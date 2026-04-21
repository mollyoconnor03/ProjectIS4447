import { Activity, AuthContext, Category, CategoryContext, Target, Trip, TripContext } from '@/app/_layout';
import ScreenHeader from '@/components/ui/screen-header';
import { Palette } from '@/constants/theme';
import { db } from '@/db/client';
import { activitiesTable, targetsTable } from '@/db/schema';
import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import { useFocusEffect } from 'expo-router';
import { useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

// ─── helpers ────────────────────────────────────────────────────────────────

type Period = 'daily' | 'weekly' | 'monthly';

const PERIOD_LABELS: Record<Period, string> = {
  daily: '7 Days',
  weekly: '6 Weeks',
  monthly: '6 Months',
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

function groupActivities(activities: Activity[], period: Period): { label: string; count: number }[] {
  const n = new Date();

  if (period === 'daily') {
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(n); day.setDate(n.getDate() - (6 - i));
      const key = toLocalDate(day);
      const label = day.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2);
      return { label, count: activities.filter(a => a.date === key).length };
    });
  }
  if (period === 'weekly') {
    return Array.from({ length: 6 }, (_, i) => {
      const wEnd = new Date(n); wEnd.setDate(n.getDate() - (5 - i) * 7);
      const wStart = new Date(wEnd); wStart.setDate(wEnd.getDate() - 6);
      const s = toLocalDate(wStart);
      const e = toLocalDate(wEnd);
      return { label: `W${i + 1}`, count: activities.filter(a => a.date >= s && a.date <= e).length };
    });
  }
  return Array.from({ length: 6 }, (_, i) => {
    const first = new Date(n.getFullYear(), n.getMonth() - (5 - i), 1);
    const last = new Date(n.getFullYear(), n.getMonth() - (5 - i) + 1, 0);
    const s = toLocalDate(first);
    const e = toLocalDate(last);
    const label = first.toLocaleDateString('en', { month: 'short' });
    return { label, count: activities.filter(a => a.date >= s && a.date <= e).length };
  });
}

function getPeriodRange(period: 'weekly' | 'monthly') {
  const now = new Date();
  if (period === 'weekly') {
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(now); start.setDate(now.getDate() + diff);
    const end = new Date(start); end.setDate(start.getDate() + 6);
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
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

// ─── bar chart ──────────────────────────────────────────────────────────────

const CHART_HEIGHT = 160;

function BarChart({ data }: { data: { label: string; count: number }[] }) {
  const maxVal = Math.max(...data.map(d => d.count), 1);
  const gridLines = [0.25, 0.5, 0.75, 1];

  return (
    <View>
      <View style={{ height: CHART_HEIGHT, position: 'relative' }}>
        {gridLines.map(frac => (
          <View
            key={frac}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: CHART_HEIGHT * (1 - frac),
              height: 0.5,
              backgroundColor: Palette.border,
            }}
          />
        ))}
        <View style={barStyles.barsRow}>
          {data.map((item, i) => {
            const barH = Math.max((item.count / maxVal) * CHART_HEIGHT, item.count > 0 ? 4 : 0);
            return (
              <View key={i} style={barStyles.col}>
                {item.count > 0 && (
                  <Text style={barStyles.valueLabel}>{item.count}</Text>
                )}
                <View style={[barStyles.bar, { height: barH }]} />
              </View>
            );
          })}
        </View>
      </View>
      <View style={barStyles.axis} />
      <View style={barStyles.labelsRow}>
        {data.map((item, i) => (
          <Text key={i} style={barStyles.label}>{item.label}</Text>
        ))}
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  barsRow: {
    alignItems: 'flex-end',
    bottom: 0,
    flexDirection: 'row',
    gap: 6,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  col: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    backgroundColor: Palette.terracotta,
    width: '75%',
  },
  valueLabel: {
    color: Palette.inkSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  axis: {
    backgroundColor: Palette.inkHint,
    height: 1,
    marginBottom: 6,
  },
  labelsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  label: {
    color: Palette.inkSecondary,
    flex: 1,
    fontSize: 9,
    textAlign: 'center',
  },
});

// ─── donut chart ────────────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function DonutChart({ data }: { data: { name: string; color: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return null;

  const cx = 70, cy = 70, outerR = 60, innerR = 38;
  let angle = -90;

  const paths = data.map(seg => {
    const sweep = (seg.count / total) * 360;
    const gap = data.length > 1 ? 1.5 : 0;
    const start = polarToCartesian(cx, cy, outerR, angle + gap);
    const end = polarToCartesian(cx, cy, outerR, angle + sweep - gap);
    const iStart = polarToCartesian(cx, cy, innerR, angle + sweep - gap);
    const iEnd = polarToCartesian(cx, cy, innerR, angle + gap);
    const large = sweep > 180 ? 1 : 0;
    const d = `M${start.x} ${start.y} A${outerR} ${outerR} 0 ${large} 1 ${end.x} ${end.y} L${iStart.x} ${iStart.y} A${innerR} ${innerR} 0 ${large} 0 ${iEnd.x} ${iEnd.y} Z`;
    angle += sweep;
    return { d, color: seg.color };
  });

  return (
    <Svg width={140} height={140}>
      {paths.map((p, i) => <Path key={i} d={p.d} fill={p.color} />)}
      <Circle cx={cx} cy={cy} r={innerR - 1} fill={Palette.background} />
    </Svg>
  );
}

// ─── upcoming section ────────────────────────────────────────────────────────

function UpcomingSection({ trips }: { trips: Trip[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = trips.filter(t => t.endDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate));

  if (upcoming.length === 0) return null;

  function daysUntil(dateStr: string): string {
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Ongoing';
    if (diff === 0) return 'Starts today';
    if (diff === 1) return 'Starts tomorrow';
    return `Starts in ${diff} days`;
  }

  return (
    <>
      <Text style={upcomingStyles.sectionLabel}>Upcoming</Text>
      {upcoming.map(trip => (
        <View key={trip.id} style={upcomingStyles.card}>
          <View style={upcomingStyles.cardLeft}>
            <Text style={upcomingStyles.tripName}>{trip.name}</Text>
            <Text style={upcomingStyles.destination}>{trip.destination}</Text>
            <Text style={upcomingStyles.dates}>{trip.startDate} – {trip.endDate}</Text>
          </View>
          <View style={upcomingStyles.cardRight}>
            <Text style={upcomingStyles.daysUntil}>{daysUntil(trip.startDate)}</Text>
            {(trip.activityCount ?? 0) > 0 && (
              <Text style={upcomingStyles.actCount}>{trip.activityCount} planned</Text>
            )}
          </View>
        </View>
      ))}
    </>
  );
}

const upcomingStyles = StyleSheet.create({
  sectionLabel: {
    color: Palette.inkSecondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
    marginBottom: 10,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: Palette.cardBackground,
    borderColor: Palette.border,
    borderLeftColor: Palette.terracotta,
    borderLeftWidth: 2,
    borderWidth: 0.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardLeft: {
    flex: 1,
    gap: 2,
  },
  tripName: {
    color: Palette.ink,
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 15,
  },
  destination: {
    color: Palette.inkSecondary,
    fontSize: 12,
  },
  dates: {
    color: Palette.inkHint,
    fontSize: 11,
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  daysUntil: {
    color: Palette.terracotta,
    fontSize: 11,
    fontWeight: '600',
  },
  actCount: {
    color: Palette.inkSecondary,
    fontSize: 11,
    marginTop: 2,
  },
});

// ─── main screen ────────────────────────────────────────────────────────────

type Stats = {
  total: number;
  topCat: Category | null;
  targetsMet: number;
  totalTargets: number;
};

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
  const [stats, setStats] = useState<Stats>({ total: 0, topCat: null, targetsMet: 0, totalTargets: 0 });
  const [barData, setBarData] = useState<{ label: string; count: number }[]>([]);
  const [catData, setCatData] = useState<{ name: string; color: string; count: number }[]>([]);
  const [tripRows, setTripRows] = useState<TripRow[]>([]);
  const [hasAnyActivities, setHasAnyActivities] = useState(false);

  const categories = catContext?.categories ?? [];
  const trips = tripContext?.trips ?? [];

  const loadData = useCallback(async () => {
    if (!authContext?.user) return;
    setLoading(true);

    const tripIds = trips.map(t => t.id);
    let periodActivities: Activity[] = [];
    let allActivities: Activity[] = [];

    if (tripIds.length > 0) {
      const { start, end } = getDateRange(period);
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

    setStats({ total: periodActivities.length, topCat, targetsMet, totalTargets: targets.length });
    setBarData(groupActivities(periodActivities, period));
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
    setLoading(false);
  }, [authContext, period, trips, categories]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));
  useEffect(() => { loadData(); }, [loadData]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Insights" centered />

      <View style={styles.toggleRow}>
        {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
          <Pressable key={p} style={[styles.toggleBtn, period === p && styles.toggleBtnActive]} onPress={() => setPeriod(p)}>
            <Text style={[styles.toggleText, period === p && styles.toggleTextActive]}>
              {PERIOD_LABELS[p]}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.periodRange}>{periodLabel(period)}</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.terracotta} />
        </View>
      ) : !hasAnyActivities ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Start logging activities to see your journey take shape.</Text>
          </View>
          <UpcomingSection trips={trips} />
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
              <Text style={styles.statValue}>{tripRows.length}</Text>
              <Text style={styles.statLabel}>Trips with activity</Text>
              <Text style={styles.statHint}>{periodLabel(period)}</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Activity Over Time</Text>
          <View style={styles.chartCard}>
            <BarChart data={barData} />
          </View>

          {catData.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>By Category</Text>
              <View style={styles.chartCard}>
                <View style={styles.donutRow}>
                  <DonutChart data={catData} />
                  <View style={styles.legend}>
                    {catData.map((c, i) => (
                      <View key={i} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: c.color }]} />
                        <Text style={styles.legendLabel}>{c.name}</Text>
                        <Text style={styles.legendCount}>{c.count}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </>
          )}

          {tripRows.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Per Trip</Text>
              {tripRows.map((row, i) => (
                <View key={i} style={styles.tripRow}>
                  <View style={styles.tripRowLeft}>
                    <Text style={styles.tripName}>{row.name}</Text>
                    <View style={styles.tripDots}>
                      {row.catColors.map((color, j) => (
                        <View key={j} style={[styles.tripDot, { backgroundColor: color }]} />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.tripCount}>{row.count} {row.count === 1 ? 'activity' : 'activities'}</Text>
                </View>
              ))}
            </>
          )}

          <UpcomingSection trips={trips} />

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
    color: Palette.inkHint,
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
    fontFamily: 'DMSerifDisplay_400Regular',
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
    backgroundColor: Palette.cardBackground,
    borderColor: Palette.border,
    borderWidth: 0.5,
    flexBasis: '47%',
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  statValue: {
    color: Palette.ink,
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    marginBottom: 2,
  },
  statLabel: {
    color: Palette.inkSecondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },
  statHint: {
    color: Palette.inkHint,
    fontSize: 10,
    marginTop: 2,
  },
  sectionLabel: {
    color: Palette.inkSecondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
    marginBottom: 10,
    textTransform: 'uppercase',
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
    borderRadius: 4,
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
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 14,
  },
  tripDots: {
    flexDirection: 'row',
    gap: 4,
  },
  tripDot: {
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  tripCount: {
    color: Palette.inkSecondary,
    fontSize: 12,
  },
});
