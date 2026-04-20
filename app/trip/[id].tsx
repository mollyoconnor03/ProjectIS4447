import ActivityCard from '@/components/ActivityCard';
import InfoTag from '@/components/ui/info-tag';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { Palette } from '@/constants/theme';
import { db } from '@/db/client';
import { activitiesTable, tripsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Feather from '@expo/vector-icons/Feather';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useContext } from 'react';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, AuthContext, CategoryContext, Trip, TripContext } from '../_layout';

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(TripContext);
  const authContext = useContext(AuthContext);
  const catContext = useContext(CategoryContext);

  const [activities, setActivities] = useState<Activity[]>([]);

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

  useFocusEffect(
    useCallback(() => {
      loadActivities();
    }, [loadActivities])
  );

  if (!trip) return null;

  const categories = catContext?.categories ?? [];

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ScreenHeader title={trip.name} subtitle={trip.destination} />

        <View style={styles.tagsRow}>
          <InfoTag label="From" value={trip.startDate} />
          <InfoTag label="To" value={trip.endDate} />
          <InfoTag label="Activities" value={String(activities.length)} />
        </View>

        <View style={styles.actionRow}>
          <View style={styles.actionBtn}>
            <PrimaryButton
              compact
              label="Edit Trip"
              variant="secondary"
              onPress={() => router.push({ pathname: '../trip/[id]/edit', params: { id } })}
            />
          </View>
          <View style={styles.actionBtn}>
            <PrimaryButton
              compact
              label="Delete Trip"
              variant="danger"
              onPress={confirmDeleteTrip}
            />
          </View>
        </View>

        <PrimaryButton
          label="+ Add Activity"
          onPress={() => router.push({ pathname: '/trip/[id]/add-activity', params: { id: trip.id.toString() } })}
        />

        <View style={styles.activityList}>
          {activities.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="calendar" size={40} color={Palette.border} />
              <Text style={styles.emptyHeading}>Nothing planned yet.</Text>
              <Text style={styles.emptyBody}>Add your first activity.</Text>
            </View>
          ) : (
            activities.map(a => {
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
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
  },
  activityList: {
    marginTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  emptyHeading: {
    color: Palette.ink,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    letterSpacing: 0.2,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyBody: {
    color: Palette.inkSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center',
  },
});
