import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { Palette } from '@/constants/theme';
import { db } from '@/db/client';
import { targetsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext, CategoryContext, Target, TripContext } from '../../_layout';

type TargetType = 'activity' | 'trips_count' | 'spending';
type Period = 'monthly' | 'quarterly';

export default function EditTarget() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const catContext = useContext(CategoryContext);
  const tripContext = useContext(TripContext);

  const [loaded, setLoaded] = useState(false);
  const [type, setType] = useState<TargetType>('activity');
  const [label, setLabel] = useState('');
  const [labelError, setLabelError] = useState('');

  const [tripId, setTripId] = useState<number | null>(null);
  const [tripError, setTripError] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [activityCount, setActivityCount] = useState('');
  const [activityCountError, setActivityCountError] = useState('');

  const [period, setPeriod] = useState<Period>('monthly');
  const [targetValue, setTargetValue] = useState('');
  const [targetValueError, setTargetValueError] = useState('');

  const categories = catContext?.categories ?? [];
  const trips = tripContext?.trips ?? [];

  useEffect(() => {
    db.select().from(targetsTable).where(eq(targetsTable.id, Number(id))).then(rows => {
      if (!rows[0]) return;
      const t = rows[0] as Target;
      setType(t.type);
      setLabel(t.label);
      setTripId(t.tripId);
      setCategoryId(t.categoryId);
      setActivityCount(t.type === 'activity' ? String(t.targetValue) : '');
      setPeriod((t.period as Period) ?? 'monthly');
      setTargetValue(t.type !== 'activity' ? String(t.targetValue) : '');
      setLoaded(true);
    });
  }, [id]);

  if (!loaded) return null;

  const save = async () => {
    let valid = true;
    if (!label.trim()) { setLabelError('Name is required.'); valid = false; } else { setLabelError(''); }

    if (type === 'activity') {
      if (!tripId) { setTripError('Please select a trip.'); valid = false; } else { setTripError(''); }
      const n = parseInt(activityCount, 10);
      if (!activityCount || isNaN(n) || n <= 0) { setActivityCountError('Enter a number greater than 0.'); valid = false; } else { setActivityCountError(''); }
    } else {
      const n = parseFloat(targetValue);
      if (!targetValue || isNaN(n) || n <= 0) { setTargetValueError('Enter a value greater than 0.'); valid = false; } else { setTargetValueError(''); }
    }

    if (!valid) return;

    await db.update(targetsTable).set({
      type,
      label: label.trim(),
      tripId: type === 'activity' ? tripId : null,
      categoryId: type === 'activity' ? categoryId : null,
      period: type !== 'activity' ? period : null,
      targetValue: type === 'activity' ? parseInt(activityCount, 10) : parseFloat(targetValue),
    }).where(eq(targetsTable.id, Number(id)));
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: '' }} />
      <ScreenHeader title="Edit Target" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <Text style={styles.fieldLabel}>Type</Text>
        <View style={styles.toggleRow}>
          {(['activity', 'trips_count', 'spending'] as TargetType[]).map(t => (
            <Pressable key={t} style={[styles.toggleBtn, type === t && styles.toggleBtnActive]} onPress={() => setType(t)} accessibilityLabel={t === 'activity' ? 'Trip target' : t === 'trips_count' ? 'Trips per period' : 'Spending limit'} accessibilityRole="radio" accessibilityState={{ checked: type === t }}>
              <Text style={[styles.toggleText, type === t && styles.toggleTextActive]}>
                {t === 'activity' ? 'Trip target' : t === 'trips_count' ? 'Trips / period' : 'Spending limit'}
              </Text>
            </Pressable>
          ))}
        </View>

        <FormField label="Name" value={label} onChangeText={t => { setLabel(t); if (labelError) setLabelError(''); }} error={labelError} />

        {type === 'activity' && (
          <>
            <Text style={styles.fieldLabel}>Trip</Text>
            <View style={styles.pillRow}>
              {trips.map(tr => (
                <Pressable key={tr.id} onPress={() => { setTripId(tr.id); if (tripError) setTripError(''); }} accessibilityLabel={`Select trip: ${tr.name}`} accessibilityRole="radio" accessibilityState={{ checked: tripId === tr.id }}>
                  <View style={[styles.pill, tripId === tr.id ? styles.pillActive : styles.pillInactive]}>
                    <Text style={[styles.pillText, tripId === tr.id && styles.pillTextActive]}>{tr.name}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
            {tripError ? <Text style={styles.fieldError}>{tripError}</Text> : null}

            <Text style={styles.fieldLabel}>Category <Text style={styles.optional}>(optional)</Text></Text>
            <View style={styles.pillRow}>
              <Pressable onPress={() => setCategoryId(null)} accessibilityLabel="All categories" accessibilityRole="radio" accessibilityState={{ checked: categoryId === null }}>
                <View style={[styles.pill, categoryId === null ? styles.pillActive : styles.pillInactive]}>
                  <Text style={[styles.pillText, categoryId === null && styles.pillTextActive]}>All</Text>
                </View>
              </Pressable>
              {categories.map(cat => (
                <Pressable key={cat.id} onPress={() => setCategoryId(cat.id)} accessibilityLabel={`Select category: ${cat.name}`} accessibilityRole="radio" accessibilityState={{ checked: categoryId === cat.id }}>
                  <View style={[styles.pill, categoryId === cat.id ? styles.pillActive : styles.pillInactive]}>
                    <View style={[styles.dot, { backgroundColor: cat.color }]} />
                    <Text style={[styles.pillText, categoryId === cat.id && styles.pillTextActive]}>{cat.name}</Text>
                  </View>
                </Pressable>
              ))}
            </View>

            <FormField
              label="Target (number of activities)"
              value={activityCount}
              onChangeText={t => { setActivityCount(t); if (activityCountError) setActivityCountError(''); }}
              error={activityCountError}
              keyboardType="number-pad"
            />
          </>
        )}

        {type !== 'activity' && (
          <>
            <Text style={styles.fieldLabel}>Period</Text>
            <View style={styles.toggleRow}>
              {(['monthly', 'quarterly'] as Period[]).map(p => (
                <Pressable key={p} style={[styles.toggleBtn, period === p && styles.toggleBtnActive]} onPress={() => setPeriod(p)} accessibilityLabel={p === 'monthly' ? 'Monthly' : 'Quarterly'} accessibilityRole="radio" accessibilityState={{ checked: period === p }}>
                  <Text style={[styles.toggleText, period === p && styles.toggleTextActive]}>
                    {p === 'monthly' ? 'Monthly' : 'Quarterly'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <FormField
              label={type === 'spending' ? 'Spending limit (€)' : 'Number of trips'}
              value={targetValue}
              onChangeText={t => { setTargetValue(t); if (targetValueError) setTargetValueError(''); }}
              error={targetValueError}
              keyboardType="decimal-pad"
            />
          </>
        )}

        <PrimaryButton label="Save Changes" onPress={save} />
        <View style={styles.gap}>
          <PrimaryButton label="Cancel" variant="secondary" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Palette.background,
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  gap: { marginTop: 10 },
  fieldLabel: {
    color: Palette.inkSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 8,
  },
  optional: {
    color: Palette.inkHint,
    fontWeight: '400',
  },
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 16,
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
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    alignItems: 'center',
    borderWidth: 0.5,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillActive: {
    backgroundColor: Palette.terracotta,
    borderColor: Palette.terracotta,
  },
  pillInactive: {
    borderColor: Palette.border,
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
    height: 7,
    width: 7,
  },
  fieldError: {
    color: Palette.danger,
    fontSize: 12,
    marginBottom: 12,
    marginTop: -8,
  },
});
