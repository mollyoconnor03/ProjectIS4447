import { Activity, AuthContext, Category, CategoryContext, Target, Trip, TripContext } from '@/app/_layout';
import DonutChart from '@/components/DonutChart';
import StackedTripChart, { DayBar } from '@/components/StackedTripChart';
import ScreenHeader from '@/components/ui/screen-header';
import { Palette } from '@/constants/theme';
import { db } from '@/db/client';
import { activitiesTable, targetsTable } from '@/db/schema';
import { StreakResult, calculateStreak } from '@/utils/streak';
import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import { useFocusEffect } from 'expo-router';
import { useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
type Period = 'daily' | 'weekly' | 'monthly';

const TRIP_COLORS = ['#54A0FF', '#FF6B6B', '#1DD1A1', '#FF9F43', '#5F27CD', '#48DBFB'];

const PERIOD_LABELS: Record<Period, string> = {
  daily: 'Last 7 days',
  weekly: 'Last 6 weeks',
  monthly: 'Last 6 months',
};

function periodLabel(period: Period): string {
  if (period === 'daily') return 'Last 7 days';
  if (period === 'weekly') return 'Last 6 weeks';
  return 'Last 6 months';
}

function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDateRange(period: Period) {
  const n = new Date();
  const end = toLocalDate(n);
  if (period === 'daily') {
    const s = new Date(n); s.setDate(n.getDate() - 6);
    return { start: toLocalDate(s), end };
  }
  if (period === 'weekly') {
    const s = new Date(n); s.setDate(n.getDate() - 41);
    return { start: toLocalDate(s), end };
  }
  const s = new Date(n.getFullYear(), n.getMonth() - 5, 1);
  return { start: toLocalDate(s), end };
}

function buildTripDays(tripId: number, trip: Trip, activities: Activity[], categories: Category[]): DayBar[] {
  const days: DayBar[] = [];
  const start = new Date(trip.startDate + 'T12:00:00');
  const end = new Date(trip.endDate + 'T12:00:00');
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = toLocalDate(d);
    const dayActs = activities.filter(a => a.tripId === tripId && a.date === dateStr);
    const catMap = new Map<number | null, { color: string; count: number }>();
    for (const a of dayActs) {
      const cat = categories.find(c => c.id === a.categoryId);
      const color = cat?.color ?? Palette.inkHint;
      const prev = catMap.get(a.categoryId) ?? { color, count: 0 };
      catMap.set(a.categoryId, { color, count: prev.count + 1 });
    }
    days.push({
      date: dateStr,
      label: d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2),
      total: dayActs.length,
      segments: Array.from(catMap.values()),
    });
  }
  return days;
}

function computeProgress(target: Target, activities: Activity[]): number {
  if (target.type !== 'activity') return 0;
  return activities.filter(a => {
    if (a.tripId !== target.tripId) return false;
    if (target.categoryId !== null && a.categoryId !== target.categoryId) return false;
    return true;
  }).length;
}

type Stats = {
  total: number;
  topCat: Category | null;
  targetsMet: number;
  totalTargets: number;
  totalSpent: number;
  tripsInPeriod: number;
};

function parseCost(val: string | null): number {
  if (!val) return 0;
  const n = parseFloat(val.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

type TripRow = {
  name: string;
  count: number;
  catColors: string[];
};

export default function InsightsScreen() {
  const authContext = useContext(AuthContext);
  const catContext = useContext(CategoryContext);
  const tripContext = useContext(TripContext);

  const [period, setPeriod] = useState<Period>('weekly');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, topCat: null, targetsMet: 0, totalTargets: 0, totalSpent: 0, tripsInPeriod: 0 });
  const [allActs, setAllActs] = useState<Activity[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [streak, setStreak] = useState<StreakResult | null>(null);
  const [catData, setCatData] = useState<{ name: string; color: string; count: number }[]>([]);
  const [tripRows, setTripRows] = useState<TripRow[]>([]);
  const [hasAnyActivities, setHasAnyActivities] = useState(false);

  const categories = catContext?.categories ?? [];
  const trips = tripContext?.trips ?? [];

  const loadData = useCallback(async () => {
    if (!authContext?.user) return;
    setLoading(true);

    const tripIds = trips.map(t => t.id);
    const { start, end } = getDateRange(period);
    let periodActivities: Activity[] = [];
    let allActivities: Activity[] = [];

    if (tripIds.length > 0) {
      periodActivities = await db.select().from(activitiesTable).where(
        and(inArray(activitiesTable.tripId, tripIds), gte(activitiesTable.date, start), lte(activitiesTable.date, end))
      );
      allActivities = await db.select().from(activitiesTable).where(inArray(activitiesTable.tripId, tripIds));
    }

    const targets = await db.select().from(targetsTable).where(eq(targetsTable.userId, authContext.user.id));

    // category counts in period
    const catCounts: Record<number, number> = {};
    for (const a of periodActivities) {
      if (a.categoryId !== null) catCounts[a.categoryId] = (catCounts[a.categoryId] ?? 0) + 1;
    }

    const topCatId = Number(Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0]);
    const topCat = topCatId ? (categories.find(c => c.id === topCatId) ?? null) : null;
    const targetsMet = targets.filter(t => computeProgress(t as Target, allActivities) >= t.targetValue).length;
    const totalSpent = periodActivities.reduce((sum, a) => sum + parseCost(a.cost), 0);
    const tripsInPeriod = trips.filter(t => t.startDate <= end && t.endDate >= start).length;

    setStats({ total: periodActivities.length, topCat, targetsMet, totalTargets: targets.length, totalSpent, tripsInPeriod });
    setAllActs(allActivities);
    if (selectedTripId === null && trips.length > 0) setSelectedTripId(trips[0].id);
    setCatData(
      categories.map(c => ({ name: c.name, color: c.color, count: catCounts[c.id] ?? 0 })).filter(c => c.count > 0)
    );
    setTripRows(
      trips.map(trip => {
        const ta = periodActivities.filter(a => a.tripId === trip.id);
        const colors = [...new Set(ta.map(a => a.categoryId).filter(Boolean) as number[])]
          .map(id => categories.find(c => c.id === id)?.color)
          .filter(Boolean) as string[];
        return { name: trip.name, count: ta.length, catColors: colors };
      }).filter(r => r.count > 0)
    );
    setHasAnyActivities(allActivities.length > 0);
    setStreak(await calculateStreak(authContext.user.id, trips));
    setLoading(false);
  }, [authContext, period, trips, categories]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));
  useEffect(() => { loadData(); }, [loadData]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Insights" centered />

      {streak !== null && (
        <View style={styles.streakNote}>
          {streak.count > 0 && (
            <Text style={styles.streakCount}>{streak.count} trip streak</Text>
          )}
          <Text style={styles.streakMessage}>{streak.message}</Text>
        </View>
      )}

      <View style={styles.toggleRow}>
        {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
          <Pressable key={p} style={[styles.toggleBtn, period === p && styles.toggleBtnActive]} onPress={() => setPeriod(p)} accessibilityLabel={`View ${PERIOD_LABELS[p]}`} accessibilityRole="button">
            <Text style={[styles.toggleText, period === p && styles.toggleTextActive]}>
              {PERIOD_LABELS[p]}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.terracotta} />
        </View>
      ) : !hasAnyActivities ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Start logging activities to see your journey take shape.</Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Activities logged</Text>
              <Text style={styles.statHint}>{periodLabel(period)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue} numberOfLines={1}>{stats.topCat?.name ?? '—'}</Text>
              <Text style={styles.statLabel}>Most used category</Text>
              <Text style={styles.statHint}>{periodLabel(period)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.targetsMet} / {stats.totalTargets}</Text>
              <Text style={styles.statLabel}>Targets complete</Text>
              <Text style={styles.statHint}>all active targets</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.tripsInPeriod}</Text>
              <Text style={styles.statLabel}>Trips</Text>
              <Text style={styles.statHint}>{periodLabel(period)}</Text>
            </View>
            <View style={[styles.statBox, { flexBasis: '100%' }]}>
              <Text style={styles.statValue}>€{stats.totalSpent.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total spent on activities</Text>
              <Text style={styles.statHint}>{periodLabel(period)}</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Activity by Trip</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {trips.map(tr => (
                <Pressable key={tr.id} onPress={() => setSelectedTripId(tr.id)}
                  accessibilityLabel={`View activity chart for ${tr.name}`} accessibilityRole="button"
                  style={[styles.tripPill, selectedTripId === tr.id && styles.tripPillActive]}>
                  <Text style={[styles.tripPillText, selectedTripId === tr.id && styles.tripPillTextActive]}>{tr.name}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          {selectedTripId !== null && (() => {
            const trip = trips.find(t => t.id === selectedTripId);
            if (!trip) return null;
            const days = buildTripDays(selectedTripId, trip, allActs, categories);
            const usedCats = categories.filter(cat => days.some(d => d.segments.some(s => s.color === cat.color)));
            return (
              <View style={[styles.chartCard, { marginBottom: 24 }]}>
                <StackedTripChart days={days} categories={usedCats} />
              </View>
            );
          })()}

          {(() => {
            const yearTrips = trips.filter(t => t.startDate <= '2026-12-31' && t.endDate >= '2026-01-01');
            if (yearTrips.length === 0) return null;
            const yearTripIds = new Set(yearTrips.map(t => t.id));
            const yearActs = allActs.filter(a => yearTripIds.has(a.tripId));
            const nightsAway = yearTrips.reduce((sum, t) => sum + Math.round((new Date(t.endDate).getTime() - new Date(t.startDate).getTime()) / 86400000), 0);
            const countriesVisited = new Set(yearTrips.map(t => t.country).filter(Boolean)).size;
            const totalSpendYear = yearActs.reduce((sum, a) => sum + parseCost(a.cost), 0);
            const avgSpend = totalSpendYear / yearTrips.length;
            const catCounts: Record<number, number> = {};
            for (const a of yearActs) {
              if (a.categoryId !== null) catCounts[a.categoryId] = (catCounts[a.categoryId] ?? 0) + 1;
            }
            const topCatId = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
            const topCatName = topCatId ? categories.find(c => c.id === Number(topCatId))?.name : null;
            const rows: { label: string; value: string }[] = [
              { label: 'Trips taken', value: String(yearTrips.length) },
              ...(countriesVisited > 0 ? [{ label: 'Countries visited', value: String(countriesVisited) }] : []),
              { label: 'Nights away', value: String(nightsAway) },
              ...(avgSpend > 0 ? [{ label: 'Avg. spend per trip', value: `€${avgSpend.toFixed(0)}` }] : []),
              ...(topCatName ? [{ label: 'Type of traveller', value: `${topCatName} enthusiast` }] : []),
            ];
            const spendData = yearTrips
              .map((t, i) => ({
                name: t.name,
                color: TRIP_COLORS[i % TRIP_COLORS.length],
                count: yearActs.filter(a => a.tripId === t.id).reduce((s, a) => s + parseCost(a.cost), 0),
              }))
              .filter(d => d.count > 0);
            return (
              <>
                <Text style={styles.yearTitle}>Your 2026 in Travel</Text>
                <View style={styles.yearCard}>
                  {rows.map((row, i) => (
                    <View key={row.label} style={[styles.yearRow, i === rows.length - 1 && styles.yearRowLast]}>
                      <Text style={styles.yearLabel}>{row.label}</Text>
                      <Text style={styles.yearValue}>{row.value}</Text>
                    </View>
                  ))}
                </View>
                {spendData.length > 0 && (
                  <View style={[styles.chartCard, { marginBottom: 24 }]}>
                    <Text style={styles.sectionLabel}>Spending by Trip</Text>
                    <View style={styles.donutRow}>
                      <DonutChart data={spendData} />
                      <View style={styles.legend}>
                        {spendData.map(d => (
                          <View key={d.name} style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                            <Text style={styles.legendLabel} numberOfLines={1}>{d.name}</Text>
                            <Text style={styles.legendCount}>€{d.count.toFixed(0)}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
              </>
            );
          })()}

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
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  periodRange: {
    color: Palette.inkSecondary,
    fontSize: 11,
    marginBottom: 20,
    textAlign: 'center',
  },
  toggleBtn: {
    alignItems: 'center',
    borderColor: Palette.border,
    borderWidth: 0.5,
    flex: 1,
    paddingVertical: 8,
  },
  toggleBtnActive: {
    backgroundColor: Palette.terracotta,
    borderColor: Palette.terracotta,
  },
  toggleText: {
    color: Palette.inkSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: Palette.white,
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60,
    paddingHorizontal: 32,
  },
  emptyBox: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyText: {
    color: Palette.inkSecondary,

    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  statBox: {
    backgroundColor: '#E8F8F7',
    borderColor: Palette.border,
    borderWidth: 0.5,
    flexBasis: '47%',
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  statIcon: {
    marginBottom: 6,
  },
  statValue: {
    color: Palette.ink,

    fontSize: 22,
    marginBottom: 2,
  },
  statLabel: {
    color: Palette.inkSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  statHint: {
    color: Palette.inkSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  sectionLabel: {
    color: Palette.inkSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 10,
  },
  chartCard: {
    backgroundColor: Palette.cardBackground,
    borderColor: Palette.border,
    borderWidth: 0.5,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  donutRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  legend: {
    flex: 1,
    gap: 8,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  legendDot: {
    height: 8,
    width: 8,
  },
  legendLabel: {
    color: Palette.ink,
    flex: 1,
    fontSize: 12,
  },
  legendCount: {
    color: Palette.inkSecondary,
    fontSize: 12,
  },
  tripRow: {
    alignItems: 'center',
    backgroundColor: Palette.cardBackground,
    borderColor: Palette.border,
    borderWidth: 0.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  tripRowLeft: {
    flex: 1,
    gap: 4,
  },
  tripName: {
    color: Palette.ink,

    fontSize: 14,
  },
  tripDots: {
    flexDirection: 'row',
    gap: 4,
  },
  tripDot: {
    height: 7,
    width: 7,
  },
  tripCount: {
    color: Palette.inkSecondary,
    fontSize: 12,
  },
  streakNote: {
    backgroundColor: Palette.cardBackground,
    borderColor: Palette.border,
    borderWidth: 1.5,
    marginBottom: 24,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  streakCount: {
    color: Palette.terracotta,

    fontSize: 18,
    marginBottom: 2,
  },
  streakMessage: {
    color: Palette.inkSecondary,
    fontSize: 13,
  },
  chartNote: {
    color: Palette.inkHint,
    fontSize: 10,
    marginTop: 10,
    textAlign: 'center',
  },
  tripPill: {
    borderColor: Palette.border,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tripPillActive: {
    backgroundColor: Palette.terracotta,
    borderColor: Palette.terracotta,
  },
  tripPillText: {
    color: Palette.inkSecondary,
    fontSize: 12,
  },
  tripPillTextActive: {
    color: Palette.white,
    fontWeight: '600',
  },
  yearTitle: {
    color: Palette.ink,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  yearCard: {
    backgroundColor: Palette.cardBackground,
    borderColor: Palette.border,
    borderWidth: 1.5,
    marginBottom: 24,
  },
  yearRow: {
    alignItems: 'center',
    borderBottomColor: Palette.border,
    borderBottomWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  yearRowLast: {
    borderBottomWidth: 0,
  },
  yearLabel: {
    color: Palette.inkSecondary,
    fontSize: 13,
  },
  yearValue: {
    color: Palette.ink,
    fontSize: 13,
    fontWeight: '600',
  },
});
