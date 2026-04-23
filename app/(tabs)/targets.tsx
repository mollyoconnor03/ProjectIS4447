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

function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getPeriodRange(period: string): { start: string; end: string } {
  const now = new Date();
  if (period === 'monthly') {
    return {
      start: toLocalDate(new Date(now.getFullYear(), now.getMonth(), 1)),
      end: toLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    };
  }
  if (period === 'quarterly') {
    const q = Math.floor(now.getMonth() / 3);
    return {
      start: toLocalDate(new Date(now.getFullYear(), q * 3, 1)),
      end: toLocalDate(new Date(now.getFullYear(), (q + 1) * 3, 0)),
    };
  }
  return { start: '', end: '' };
}

function parseCost(val: string | null): number {
  if (!val) return 0;
  const n = parseFloat(val.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

function computeProgress(target: Target, activities: Activity[], trips: any[]): number {
  if (target.type === 'activity') {
    return activities.filter(a => {
      if (a.tripId !== target.tripId) return false;
      if (target.categoryId !== null && a.categoryId !== target.categoryId) return false;
      return true;
    }).length;
  }
  if (target.type === 'trips_count' && target.period) {
    const { start, end } = getPeriodRange(target.period);
    return trips.filter(t => t.startDate <= end && t.endDate >= start).length;
  }
  if (target.type === 'spending' && target.period) {
    const { start, end } = getPeriodRange(target.period);
    return activities
      .filter(a => a.date >= start && a.date <= end)
      .reduce((sum, a) => sum + parseCost(a.cost), 0);
  }
  return 0;
}

export default function TargetsScreen() {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const catContext = useContext(CategoryContext);
  const tripContext = useContext(TripContext);

  const [targets, setTargets] = useState<Target[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const trips = tripContext?.trips ?? [];
  const categories = catContext?.categories ?? [];

  const loadData = useCallback(async () => {
    if (!authContext?.user) return;
    const t = await db.select().from(targetsTable).where(eq(targetsTable.userId, authContext.user.id));
    setTargets(t as Target[]);
    const tripIds = trips.map(tr => tr.id);
    if (tripIds.length > 0) {
      setActivities(await db.select().from(activitiesTable).where(inArray(activitiesTable.tripId, tripIds)));
    } else {
      setActivities([]);
    }
  }, [authContext, trips]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleDelete = async (id: number) => {
    await db.delete(targetsTable).where(eq(targetsTable.id, id));
    await loadData();
  };

  function isMet(t: Target): boolean {
    const progress = computeProgress(t, activities, trips);
    const today = toLocalDate(new Date());
    if (t.type !== 'activity' && t.period) {
      const { end } = getPeriodRange(t.period);
      if (today <= end) return false; // period still ongoing — never completed yet
    }
    return t.type === 'spending' ? progress <= t.targetValue : progress >= t.targetValue;
  }

  function renderCard(t: Target) {
    const cat = categories.find(c => c.id === t.categoryId);
    const trip = trips.find(tr => tr.id === t.tripId);
    return (
      <TargetCard
        key={t.id}
        target={t}
        progress={computeProgress(t, activities, trips)}
        tripName={trip?.name ?? null}
        categoryName={cat?.name ?? null}
        onEdit={() => router.push({ pathname: '/target/[id]/edit', params: { id: t.id.toString() } })}
        onDelete={() => handleDelete(t.id)}
      />
    );
  }

  const activeTargets = targets.filter(t => !isMet(t));
  const completedTargets = targets.filter(t => isMet(t));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Targets" centered />

      <PrimaryButton label="Add Target" onPress={() => router.push('/target/add')} />

      {targets.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="crosshair" size={36} color={Palette.inkHint} />
          <Text style={styles.emptyText}>No targets yet. Set a goal for your next trip.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>

          {activeTargets.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Active</Text>
              {activeTargets.map(renderCard)}
            </>
          )}

          {completedTargets.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Completed</Text>
              {completedTargets.map(renderCard)}
            </>
          )}

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
  sectionLabel: {
    color: Palette.ink,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 8,
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

    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
    textAlign: 'center',
  },
});
