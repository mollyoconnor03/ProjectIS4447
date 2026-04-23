import ActivityCard from '@/components/ActivityCard';
import WeatherWidget from '@/components/WeatherWidget';
import InfoTag from '@/components/ui/info-tag';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { Palette } from '@/constants/theme';
import { db } from '@/db/client';
import { accommodationsTable, activitiesTable, transportTable, tripsTable } from '@/db/schema';
import { buildTripCsv } from '@/utils/exportCsv';
import { eq } from 'drizzle-orm';
import Feather from '@expo/vector-icons/Feather';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useCallback, useContext, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Accommodation, Activity, AuthContext, CategoryContext, Transport, Trip, TripContext } from '../_layout';

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(TripContext);
  const authContext = useContext(AuthContext);
  const catContext = useContext(CategoryContext);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [transport, setTransport] = useState<Transport[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [filterCategoryId, setFilterCategoryId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  if (!context) return null;

  const { trips, refreshTrips } = context;
  const trip = trips.find((t: Trip) => t.id === Number(id));

  const loadData = useCallback(async () => {
    const [acts, trans, accoms] = await Promise.all([
      db.select().from(activitiesTable).where(eq(activitiesTable.tripId, Number(id))),
      db.select().from(transportTable).where(eq(transportTable.tripId, Number(id))),
      db.select().from(accommodationsTable).where(eq(accommodationsTable.tripId, Number(id))),
    ]);
    acts.sort((a, b) => a.date.localeCompare(b.date));
    trans.sort((a, b) => a.date.localeCompare(b.date));
    accoms.sort((a, b) => a.checkIn.localeCompare(b.checkIn));
    setActivities(acts);
    setTransport(trans);
    setAccommodations(accoms);
  }, [id]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  if (!trip) return null;

  const hasReflection = trip.reflectMemory || trip.reflectMeal || trip.reflectSpot || trip.reflectNotes;

  const categories = catContext?.categories ?? [];

  const parseCost = (val: string | null) => {
    if (!val) return 0;
    const n = parseFloat(val.replace(/[^0-9.]/g, ''));
    return isNaN(n) ? 0 : n;
  };

  const totalCost =
    activities.reduce((sum, a) => sum + parseCost(a.cost), 0) +
    transport.reduce((sum, t) => sum + parseCost(t.cost), 0) +
    accommodations.reduce((sum, a) => sum + parseCost(a.cost), 0);

  const handleDeleteActivity = async (activityId: number) => {
    await db.delete(activitiesTable).where(eq(activitiesTable.id, activityId));
    await loadData();
    if (authContext?.user) await refreshTrips(authContext.user.id);
  };

  const confirmDeleteTransport = (tId: number) =>
    Alert.alert('Remove Transport', 'Remove this transport entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await db.delete(transportTable).where(eq(transportTable.id, tId));
        await loadData();
      }},
    ]);

  const confirmDeleteAccommodation = (aId: number) =>
    Alert.alert('Remove Accommodation', 'Remove this accommodation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await db.delete(accommodationsTable).where(eq(accommodationsTable.id, aId));
        await loadData();
      }},
    ]);

  const deleteTrip = async () => {
    await Promise.all([
      db.delete(activitiesTable).where(eq(activitiesTable.tripId, Number(id))),
      db.delete(transportTable).where(eq(transportTable.tripId, Number(id))),
      db.delete(accommodationsTable).where(eq(accommodationsTable.tripId, Number(id))),
    ]);
    await db.delete(tripsTable).where(eq(tripsTable.id, Number(id)));
    if (authContext?.user) await refreshTrips(authContext.user.id);
    router.back();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = buildTripCsv(trip, activities, categories);
      const safeName = trip.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const fileUri = FileSystem.cacheDirectory + `aistear-${safeName}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: `Export ${trip.name}` });
    } catch {
      Alert.alert('Export failed', 'Something went wrong while generating the export.');
    } finally {
      setExporting(false);
    }
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
      <Stack.Screen options={{
        title: '',
        headerRight: () => (
          <Pressable onPress={handleExport} disabled={exporting} accessibilityLabel="Export trip as CSV" accessibilityRole="button" style={{ marginRight: 8 }}>
            <Feather name="download" size={20} color={Palette.inkSecondary} />
          </Pressable>
        ),
      }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ScreenHeader title={trip.name} subtitle={trip.destination} />

        <View style={styles.actionRow}>
          <View style={styles.actionBtn}>
            <PrimaryButton compact label="Edit Trip" variant="secondary" onPress={() => router.push({ pathname: '../trip/[id]/edit', params: { id } })} />
          </View>
          <View style={styles.actionBtn}>
            <PrimaryButton compact label="Delete Trip" variant="danger" onPress={confirmDeleteTrip} />
          </View>
        </View>

        <WeatherWidget trip={trip} />

        <View style={styles.tagsRow}>
          <InfoTag label="From" value={trip.startDate} />
          <InfoTag label="To" value={trip.endDate} />
          <InfoTag label="Activities" value={String(activities.length)} />
        </View>

        <View style={styles.metaCard}>
          <Text style={styles.metaCardTitle}>Transport</Text>
          {transport.map(t => (
            <View key={t.id} style={styles.logItem}>
              <View style={styles.logItemLeft}>
                <Text style={styles.logItemTitle}>{t.type.charAt(0).toUpperCase() + t.type.slice(1)}: {t.description}</Text>
                <Text style={styles.logItemSub}>{t.date}{t.cost ? ` · ${t.cost}` : ''}</Text>
                {t.notes ? <Text style={styles.logItemNote}>{t.notes}</Text> : null}
              </View>
              <Pressable onPress={() => confirmDeleteTransport(t.id)} accessibilityLabel="Delete transport entry" accessibilityRole="button">
                <Feather name="trash-2" size={15} color={Palette.danger} />
              </Pressable>
            </View>
          ))}
          <PrimaryButton compact label="+ Add Transport" variant="secondary"
            onPress={() => router.push({ pathname: '/trip/[id]/add-transport', params: { id } })} />
        </View>

        <View style={styles.metaCard}>
          <Text style={styles.metaCardTitle}>Accommodation</Text>
          {accommodations.map(a => (
            <View key={a.id} style={styles.logItem}>
              <View style={styles.logItemLeft}>
                <Text style={styles.logItemTitle}>{a.name}</Text>
                <Text style={styles.logItemSub}>{a.checkIn} → {a.checkOut}{a.cost ? ` · ${a.cost}` : ''}</Text>
                {a.notes ? <Text style={styles.logItemNote}>{a.notes}</Text> : null}
              </View>
              <Pressable onPress={() => confirmDeleteAccommodation(a.id)} accessibilityLabel="Delete accommodation entry" accessibilityRole="button">
                <Feather name="trash-2" size={15} color={Palette.danger} />
              </Pressable>
            </View>
          ))}
          <PrimaryButton compact label="+ Add Accommodation" variant="secondary"
            onPress={() => router.push({ pathname: '/trip/[id]/add-accommodation', params: { id } })} />
        </View>

        {hasReflection && (
          <View style={styles.metaCard}>
            <Text style={styles.metaCardTitle}>Reflections</Text>
            {trip.reflectMemory ? (
              <View style={styles.reflectRow}>
                <Text style={styles.reflectLabel}>Favourite Memory</Text>
                <Text style={styles.reflectValue}>{trip.reflectMemory}</Text>
              </View>
            ) : null}
            {trip.reflectMeal ? (
              <View style={styles.reflectRow}>
                <Text style={styles.reflectLabel}>Favourite Meal</Text>
                <Text style={styles.reflectValue}>{trip.reflectMeal}</Text>
              </View>
            ) : null}
            {trip.reflectSpot ? (
              <View style={styles.reflectRow}>
                <Text style={styles.reflectLabel}>Favourite Spot</Text>
                <Text style={styles.reflectValue}>{trip.reflectSpot}</Text>
              </View>
            ) : null}
            {trip.reflectNotes ? (
              <View style={[styles.reflectRow, styles.reflectRowLast]}>
                <Text style={styles.reflectLabel}>Notes</Text>
                <Text style={styles.reflectValue}>{trip.reflectNotes}</Text>
              </View>
            ) : null}
          </View>
        )}

        {totalCost > 0 && (
          <View style={styles.metaCard}>
            <View style={styles.costRow}>
              <Text style={styles.metaCardTitle}>Total Cost</Text>
              <Text style={styles.costValue}>€{totalCost.toFixed(2)}</Text>
            </View>
          </View>
        )}

        <PrimaryButton label="+ Add Activity" onPress={() => router.push({ pathname: '/trip/[id]/add-activity', params: { id: trip.id.toString() } })} />

        {activities.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
            <Pressable onPress={() => setFilterCategoryId(null)} accessibilityLabel="Show all activities" accessibilityRole="radio" accessibilityState={{ checked: filterCategoryId === null }}>
              <View style={[styles.pill, filterCategoryId === null ? styles.pillActive : styles.pillInactive]}>
                <Text style={filterCategoryId === null ? styles.pillTextActive : styles.pillTextInactive}>All</Text>
              </View>
            </Pressable>
            {categories.filter(c => activities.some(a => a.categoryId === c.id)).map(cat => (
              <Pressable key={cat.id} onPress={() => setFilterCategoryId(cat.id)} accessibilityLabel={`Filter by category: ${cat.name}`} accessibilityRole="radio" accessibilityState={{ checked: filterCategoryId === cat.id }}>
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
    marginBottom: 8,
  },
  logItem: {
    alignItems: 'center',
    borderBottomColor: Palette.border,
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
  },
  logItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  logItemTitle: {
    color: Palette.ink,
    fontSize: 14,
    fontWeight: '500',
  },
  logItemSub: {
    color: Palette.inkSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  logItemNote: {
    color: Palette.inkHint,
    fontSize: 11,
    fontStyle: 'italic',
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

    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 14,
    textAlign: 'center',
  },
  reflectRow: {
    borderBottomColor: Palette.border,
    borderBottomWidth: 0.5,
    marginBottom: 10,
    paddingBottom: 10,
  },
  reflectRowLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  reflectLabel: {
    color: Palette.inkSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 3,
  },
  reflectValue: {
    color: Palette.ink,
    fontSize: 14,
    lineHeight: 20,
  },
});
