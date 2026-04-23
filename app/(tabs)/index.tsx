import { Activity, CategoryContext, Trip, TripContext } from '@/app/_layout';
import { Palette } from '@/constants/theme';
import { db } from '@/db/client';
import { activitiesTable } from '@/db/schema';
import DateTimePicker from '@react-native-community/datetimepicker';
import Feather from '@expo/vector-icons/Feather';
import { inArray } from 'drizzle-orm';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useContext, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TripCard from '../../components/TripCard';
import PrimaryButton from '../../components/ui/primary-button';

function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseCost(val: string | null): number {
  if (!val) return 0;
  const n = parseFloat(val.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

export default function IndexScreen() {
  const router = useRouter();
  const context = useContext(TripContext);
  const catContext = useContext(CategoryContext);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [filterFrom, setFilterFrom] = useState<Date | null>(null);
  const [filterTo, setFilterTo] = useState<Date | null>(null);
  const [filterCountry, setFilterCountry] = useState('');
  const [filterMaxCost, setFilterMaxCost] = useState('');
  const [filterCategoryIds, setFilterCategoryIds] = useState<number[]>([]);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  if (!context) return null;
  const { trips } = context;
  const categories = catContext?.categories ?? [];
  const today = new Date().toISOString().slice(0, 10);

  useFocusEffect(useCallback(() => {
    if (trips.length === 0) { setActivities([]); return; }
    const ids = trips.map(t => t.id);
    db.select().from(activitiesTable).where(inArray(activitiesTable.tripId, ids)).then(setActivities);
  }, [trips]));

  const activeFilterCount = [
    filterFrom,
    filterTo,
    filterCountry.trim() || null,
    filterMaxCost.trim() || null,
    filterCategoryIds.length > 0 ? true : null,
  ].filter(Boolean).length;

  const clearAll = () => {
    setFilterFrom(null);
    setFilterTo(null);
    setFilterCountry('');
    setFilterMaxCost('');
    setFilterCategoryIds([]);
  };

  const filtered = trips.filter((trip: Trip) => {
    if (filterFrom && trip.endDate < toLocalDate(filterFrom)) return false;
    if (filterTo && trip.startDate > toLocalDate(filterTo)) return false;
    if (filterCountry.trim()) {
      const q = filterCountry.trim().toLowerCase();
      if (!trip.destination.toLowerCase().includes(q) && !(trip.country ?? '').toLowerCase().includes(q)) return false;
    }
    if (filterMaxCost.trim()) {
      const max = parseFloat(filterMaxCost);
      if (!isNaN(max)) {
        const tripActs = activities.filter(a => a.tripId === trip.id);
        const total = parseCost(trip.accommodationCost) + tripActs.reduce((s, a) => s + parseCost(a.cost), 0);
        if (total > max) return false;
      }
    }
    if (filterCategoryIds.length > 0) {
      const tripActs = activities.filter(a => a.tripId === trip.id);
      if (!filterCategoryIds.every(catId => tripActs.some(a => a.categoryId === catId))) return false;
    }
    return true;
  });

  const upcoming = filtered.filter((t: Trip) => t.endDate >= today);
  const past = filtered.filter((t: Trip) => t.endDate < today);

  const toggleCategory = (id: number) =>
    setFilterCategoryIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.logoHeader}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.tagline}>Plan, Travel, Reflect</Text>
      </View>

      <View style={styles.topRow}>
        <View style={styles.addBtnWrap}>
          <PrimaryButton label="Add trip" onPress={() => router.push({ pathname: '../add' })} />
        </View>
        {trips.length > 0 && (
          <Pressable
            style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
            onPress={() => setShowFilter(true)}
            accessibilityLabel={activeFilterCount > 0 ? `Filter trips, ${activeFilterCount} active` : 'Filter trips'}
            accessibilityRole="button"
          >
            <Feather name="sliders" size={14} color={activeFilterCount > 0 ? Palette.white : Palette.inkSecondary} />
            {activeFilterCount > 0 && (
              <Text style={styles.filterBtnCount}>{activeFilterCount}</Text>
            )}
          </Pressable>
        )}
      </View>

      {trips.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="compass" size={36} color={Palette.inkHint} />
          <Text style={styles.emptyText}>No trips yet. The world is waiting.</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="search" size={36} color={Palette.inkHint} />
          <Text style={styles.emptyText}>No trips match those filters.</Text>
          <Pressable onPress={clearAll} style={styles.clearLink} accessibilityLabel="Clear all filters" accessibilityRole="button">
            <Text style={styles.clearLinkText}>Clear filters</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {upcoming.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Upcoming</Text>
              {upcoming.map((trip: Trip) => <TripCard key={trip.id} trip={trip} />)}
            </>
          )}
          {past.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Past</Text>
              {past.map((trip: Trip) => <TripCard key={trip.id} trip={trip} />)}
            </>
          )}
        </ScrollView>
      )}

      <Modal visible={showFilter} animationType="slide" transparent onRequestClose={() => setShowFilter(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowFilter(false)} accessibilityLabel="Close filter panel" accessibilityRole="button" />
        <View style={styles.panel}>
          <View style={styles.panelHandle} />
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Filter trips</Text>
            {activeFilterCount > 0 && (
              <Pressable onPress={clearAll} accessibilityLabel="Clear all filters" accessibilityRole="button">
                <Text style={styles.clearAll}>Clear all</Text>
              </Pressable>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelScroll}>

            <Text style={styles.filterLabel}>Date range</Text>
            <View style={styles.dateRow}>
              <Pressable style={styles.dateBtn} onPress={() => setShowFromPicker(true)} accessibilityLabel={filterFrom ? `From date: ${toLocalDate(filterFrom)}` : 'Select from date'} accessibilityRole="button">
                <Text style={[styles.dateBtnText, { color: filterFrom ? Palette.ink : Palette.inkHint }]}>
                  {filterFrom ? toLocalDate(filterFrom) : 'From'}
                </Text>
              </Pressable>
              <Text style={styles.dateSep}>–</Text>
              <Pressable style={styles.dateBtn} onPress={() => setShowToPicker(true)} accessibilityLabel={filterTo ? `To date: ${toLocalDate(filterTo)}` : 'Select to date'} accessibilityRole="button">
                <Text style={[styles.dateBtnText, { color: filterTo ? Palette.ink : Palette.inkHint }]}>
                  {filterTo ? toLocalDate(filterTo) : 'To'}
                </Text>
              </Pressable>
            </View>
            {showFromPicker && (
              <DateTimePicker
                value={filterFrom ?? new Date()}
                mode="date"
                display="default"
                onChange={(_, d) => { if (Platform.OS === 'android') setShowFromPicker(false); if (d) setFilterFrom(d); }}
              />
            )}
            {showToPicker && (
              <DateTimePicker
                value={filterTo ?? new Date()}
                mode="date"
                display="default"
                onChange={(_, d) => { if (Platform.OS === 'android') setShowToPicker(false); if (d) setFilterTo(d); }}
              />
            )}

            <Text style={styles.filterLabel}>Max total cost (€)</Text>
            <TextInput
              style={styles.textInput}
              value={filterMaxCost}
              onChangeText={setFilterMaxCost}
              placeholder="e.g. 500"
              placeholderTextColor={Palette.inkHint}
              keyboardType="decimal-pad"
              accessibilityLabel="Maximum total cost filter"
            />

            <Text style={styles.filterLabel}>Destination</Text>
            <TextInput
              style={styles.textInput}
              value={filterCountry}
              onChangeText={setFilterCountry}
              placeholder="e.g. France, Barcelona…"
              placeholderTextColor={Palette.inkHint}
              accessibilityLabel="Destination filter"
            />

            {categories.length > 0 && (
              <>
                <Text style={styles.filterLabel}>Activity categories</Text>
                <View style={styles.pillRow}>
                  {categories.map(cat => {
                    const active = filterCategoryIds.includes(cat.id);
                    return (
                      <Pressable key={cat.id} onPress={() => toggleCategory(cat.id)} accessibilityLabel={`${filterCategoryIds.includes(cat.id) ? 'Remove' : 'Add'} category filter: ${cat.name}`} accessibilityRole="checkbox" accessibilityState={{ checked: filterCategoryIds.includes(cat.id) }}>
                        <View style={[styles.pill, active && styles.pillActive]}>
                          <View style={[styles.dot, { backgroundColor: cat.color }]} />
                          <Text style={[styles.pillText, active && styles.pillTextActive]}>{cat.name}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            <PrimaryButton label="Apply" onPress={() => setShowFilter(false)} />

          </ScrollView>
        </View>
      </Modal>
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
  logoHeader: {
    alignItems: 'center',
    marginBottom: 4,
    paddingBottom: 8,
  },
  logo: {
    height: 130,
    width: 240,
  },
  tagline: {
    color: Palette.inkSecondary,
    fontSize: 13,
    letterSpacing: 1,
    marginTop: 4,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
    marginTop: 14,
  },
  addBtnWrap: {
    flex: 1,
  },
  filterBtn: {
    alignItems: 'center',
    borderColor: Palette.border,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  filterBtnActive: {
    backgroundColor: Palette.terracotta,
    borderColor: Palette.terracotta,
  },
  filterBtnCount: {
    color: Palette.white,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionLabel: {
    color: Palette.inkSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
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

    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
    textAlign: 'center',
  },
  clearLink: {
    marginTop: 14,
  },
  clearLinkText: {
    color: Palette.terracotta,
    fontSize: 13,
    fontWeight: '600',
  },
  // modal
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    flex: 1,
  },
  panel: {
    backgroundColor: Palette.background,
    maxHeight: '82%',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  panelHandle: {
    alignSelf: 'center',
    backgroundColor: Palette.border,
    height: 4,
    marginBottom: 16,
    width: 40,
  },
  panelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  panelTitle: {
    color: Palette.ink,

    fontSize: 22,
  },
  clearAll: {
    color: Palette.terracotta,
    fontSize: 13,
    fontWeight: '600',
  },
  panelScroll: {
    paddingBottom: 8,
  },
  filterLabel: {
    color: Palette.inkSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 10,
  },
  dateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
  },
  dateBtn: {
    backgroundColor: Palette.cardBackground,
    borderColor: Palette.border,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  dateBtnText: {
    fontSize: 13,
  },
  dateSep: {
    color: Palette.inkHint,
    fontSize: 16,
  },
  textInput: {
    backgroundColor: Palette.cardBackground,
    borderColor: Palette.border,
    borderWidth: 1,
    color: Palette.ink,
    fontSize: 14,
    marginBottom: 22,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 22,
  },
  pill: {
    alignItems: 'center',
    borderColor: Palette.border,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillActive: {
    backgroundColor: Palette.terracotta,
    borderColor: Palette.terracotta,
  },
  pillText: {
    color: Palette.inkSecondary,
    fontSize: 13,
  },
  pillTextActive: {
    color: Palette.white,
    fontWeight: '600',
  },
  dot: {
    height: 8,
    width: 8,
  },
});
