import { Activity, AuthContext, CategoryContext, Target, TripContext } from '@/app/_layout';
import TargetCard from '@/components/TargetCard';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { Palette } from '@/constants/theme';
import { db } from '@/db/client';
import { activitiesTable, targetsTable } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import Feather from '@expo/vector-icons/Feather';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useContext, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function getPeriodRange(period: 'weekly' | 'monthly') {
  const now = new Date();
  if (period === 'weekly') {
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(now);
    start.setDate(now.getDate() + diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function periodEndsSoon(period: 'weekly' | 'monthly'): boolean {
  const { end } = getPeriodRange(period);
  const diff = (new Date(end).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff <= 2;
}

function computeProgress(target: Target, activities: Activity[]): number {
  const { start, end } = getPeriodRange(target.period);
  return activities.filter(a => {
    if (a.date < start || a.date > end) return false;
    if (target.categoryId !== null && a.categoryId !== target.categoryId) return false;
    if (target.tripId !== null && a.tripId !== target.tripId) return false;
    return true;
  }).length;
}

export default function TargetsScreen() {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const catContext = useContext(CategoryContext);
  const tripContext = useContext(TripContext);

  const [targets, setTargets] = useState<Target[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const loadData = useCallback(async () => {
    if (!authContext?.user) return;
    const t = await db.select().from(targetsTable).where(eq(targetsTable.userId, authContext.user.id));
    setTargets(t as Target[]);

    const tripIds = (tripContext?.trips ?? []).map(tr => tr.id);
    if (tripIds.length > 0) {
      const a = await db.select().from(activitiesTable).where(inArray(activitiesTable.tripId, tripIds));
      setActivities(a);
    } else {
      setActivities([]);
    }
  }, [authContext, tripContext?.trips]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const categories = catContext?.categories ?? [];
  const trips = tripContext?.trips ?? [];

  const handleDelete = async (targetId: number) => {
    await db.delete(targetsTable).where(eq(targetsTable.id, targetId));
    await loadData();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Targets" centered />

      <PrimaryButton label="Add Target" onPress={() => router.push('/target/add')} />

      {targets.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="crosshair" size={36} color={Palette.inkHint} />
          <Text style={styles.emptyText}>No targets set. Challenge yourself.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {targets.map(t => {
            const cat = categories.find(c => c.id === t.categoryId);
            const trip = trips.find(tr => tr.id === t.tripId);
            return (
              <TargetCard
                key={t.id}
                target={t}
                progress={computeProgress(t, activities)}
                categoryName={cat?.name ?? null}
                tripName={trip?.name ?? null}
                periodEndsSoon={periodEndsSoon(t.period) && computeProgress(t, activities) < t.targetValue}
                onEdit={() => router.push({ pathname: '/target/[id]/edit', params: { id: t.id.toString() } })}
                onDelete={() => handleDelete(t.id)}
              />
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Palette.background,
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  listContent: {
    paddingBottom: 24,
    paddingTop: 14,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    color: Palette.inkSecondary,
    fontFamily: 'DMSerifDisplay_400Regular',
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
    textAlign: 'center',
  },
});
