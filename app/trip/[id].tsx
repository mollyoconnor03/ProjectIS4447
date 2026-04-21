import ActivityCard from '@/components/ActivityCard';
import InfoTag from '@/components/ui/info-tag';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { Palette } from '@/constants/theme';
import { db } from '@/db/client';
import { activitiesTable, tripsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Feather from '@expo/vector-icons/Feather';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useContext, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, AuthContext, CategoryContext, Trip, TripContext } from '../_layout';

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(TripContext);
  const authContext = useContext(AuthContext);
  const catContext = useContext(CategoryContext);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [filterCategoryId, setFilterCategoryId] = useState<number | null>(null);

  if (!context) return null;

  const { trips, refreshTrips } = context;
  const trip = trips.find((t: Trip) => t.id === Number(id));

  const loadActivities = useCallback(async () => {
    const rows = await db
      .select()
      .from(activitiesTable)
      .where(eq(activitiesTable.tripId, Number(id)));
    rows.sort((a, b) => a.date.localeCompare(b.date));
    setActivities(rows);
  }, [id]);

  useFocusEffect(useCallback(() => { loadActivities(); }, [loadActivities]));

  if (!trip) return null;

  const categories = catContext?.categories ?? [];

  const parseCost = (val: string | null) => {
    if (!val) return 0;
    const n = parseFloat(val.replace(/[^0-9.]/g, ''));
    return isNaN(n) ? 0 : n;
  };

  const totalCost = parseCost(trip.accommodationCost) + activities.reduce((sum, a) => sum + parseCost(a.cost), 0);

  const handleDeleteActivity = async (activityId: number) => {
    await db.delete(activitiesTable).where(eq(activitiesTable.id, activityId));
    await loadActivities();
    if (authContext?.user) await refreshTrips(authContext.user.id);
  };

  const deleteTrip = async () => {
    await db.delete(tripsTable).where(eq(tripsTable.id, Number(id)));
    if (authContext?.user) await refreshTrips(authContext.user.id);
    router.back();
  };

  const confirmDeleteTrip = () => {
    Alert.alert(
      'Delete Trip',
      'This will permanently delete this trip and all its activities. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteTrip },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ScreenHeader title={trip.name} subtitle={trip.destination} />

        <View style={styles.tagsRow}>
          <InfoTag label="From" value={trip.startDate} />
          <InfoTag label="To" value={trip.endDate} />
          <InfoTag label="Activities" value={String(activities.length)} />
        </View>

        <View style={styles.metaCard}>
          <Text style={styles.metaCardTitle}>Accommodation</Text>
          {trip.accommodationName ? (
            <View style={styles.accommodationRow}>
              <View>
                <Text style={styles.accommodationName}>{trip.accommodationName}</Text>
                {trip.accommodationCost ? (
                  <Text style={styles.accommodationCost}>{trip.accommodationCost}</Text>
                ) : null}
              </View>
              <PrimaryButton
                compact
                label="Edit"
                variant="secondary"
                onPress={() => router.push({ pathname: '/trip/[id]/accommodation', params: { id } })}
              />
            </View>
          ) : (
            <PrimaryButton
              compact
              label="+ Add Accommodation"
              variant="secondary"
              onPress={() => router.push({ pathname: '/trip/[id]/accommodation', params: { id } })}
            />
          )}
        </View>

        {totalCost > 0 && (
          <View style={styles.metaCard}>
            <View style={styles.costRow}>
              <Text style={styles.metaCardTitle}>Total Cost</Text>
              <Text style={styles.costValue}>€{totalCost.toFixed(2)}</Text>
            </View>
          </View>
        )}

        <View style={styles.actionRow}>
          <View style={styles.actionBtn}>
            <PrimaryButton compact label="Edit Trip" variant="secondary" onPress={() => router.push({ pathname: '../trip/[id]/edit', params: { id } })} />
          </View>
          <View style={styles.actionBtn}>
            <PrimaryButton compact label="Delete Trip" variant="danger" onPress={confirmDeleteTrip} />
          </View>
        </View>

        <PrimaryButton label="+ Add Activity" onPress={() => router.push({ pathname: '/trip/[id]/add-activity', params: { id: trip.id.toString() } })} />

        {activities.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
            <Pressable onPress={() => setFilterCategoryId(null)}>
              <View style={[styles.pill, filterCategoryId === null ? styles.pillActive : styles.pillInactive]}>
                <Text style={filterCategoryId === null ? styles.pillTextActive : styles.pillTextInactive}>All</Text>
              </View>
            </Pressable>
            {categories.filter(c => activities.some(a => a.categoryId === c.id)).map(cat => (
              <Pressable key={cat.id} onPress={() => setFilterCategoryId(cat.id)}>
                <View style={[styles.pill, filterCategoryId === cat.id ? styles.pillActive : styles.pillInactive]}>
                  <Text style={filterCategoryId === cat.id ? styles.pillTextActive : styles.pillTextInactive}>{cat.name}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View style={styles.activityList}>
          {activities.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="calendar" size={32} color={Palette.inkHint} />
              <Text style={styles.emptyText}>Nothing planned yet. Add your first activity.</Text>
            </View>
          ) : (
            activities.filter(a => filterCategoryId === null || a.categoryId === filterCategoryId).map(a => {
              const cat = categories.find(c => c.id === a.categoryId);
              return (
                <ActivityCard
                  key={a.id}
                  activity={a}
                  categoryName={cat?.name ?? null}
                  categoryColor={cat?.color ?? null}
                  onEdit={() => router.push({ pathname: '/activity/[id]/edit', params: { id: a.id.toString() } })}
                  onDelete={() => handleDeleteActivity(a.id)}
                />
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Palette.background,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  metaCard: {
    backgroundColor: Palette.cardBackground,
    borderColor: Palette.border,
    borderWidth: 0.5,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  metaCardTitle: {
    color: Palette.inkSecondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  accommodationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accommodationName: {
    color: Palette.ink,
    fontSize: 14,
    fontWeight: '500',
  },
  accommodationCost: {
    color: Palette.inkSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  costRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  costValue: {
    color: Palette.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingBottom: 4,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillActive: {
    backgroundColor: Palette.terracotta,
  },
  pillInactive: {
    borderColor: Palette.border,
    borderWidth: 0.5,
  },
  pillTextActive: {
    color: Palette.white,
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextInactive: {
    color: Palette.inkSecondary,
    fontSize: 12,
  },
  activityList: {
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  emptyText: {
    color: Palette.inkSecondary,
    fontFamily: 'DMSerifDisplay_400Regular',
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 14,
    textAlign: 'center',
  },
});
