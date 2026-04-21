import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { Palette } from '@/constants/theme';
import { db } from '@/db/client';
import { targetsTable } from '@/db/schema';
import { Stack, useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext, CategoryContext, TripContext } from '../_layout';

export default function AddTarget() {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const catContext = useContext(CategoryContext);
  const tripContext = useContext(TripContext);

  const [label, setLabel] = useState('');
  const [labelError, setLabelError] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [targetValue, setTargetValue] = useState('');
  const [targetError, setTargetError] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [tripId, setTripId] = useState<number | null>(null);

  const categories = catContext?.categories ?? [];
  const trips = tripContext?.trips ?? [];

  const save = async () => {
    let valid = true;
    if (!label.trim()) { setLabelError('Name is required.'); valid = false; } else { setLabelError(''); }
    const val = parseInt(targetValue, 10);
    if (!targetValue || isNaN(val) || val < 1) { setTargetError('Enter a target count of at least 1.'); valid = false; } else { setTargetError(''); }
    if (!valid) return;

    await db.insert(targetsTable).values({
      userId: authContext?.user?.id ?? null,
      tripId,
      categoryId,
      label: label.trim(),
      period,
      targetValue: val,
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: '' }} />
      <ScreenHeader title="Add Target" subtitle="Set yourself a challenge." />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <FormField
          label="Name"
          value={label}
          onChangeText={text => { setLabel(text); if (labelError) setLabelError(''); }}
          placeholder="e.g. Do 3 outdoor activities"
          error={labelError}
        />

        <Text style={styles.sectionLabel}>Period</Text>
        <View style={styles.toggleRow}>
          <Pressable style={[styles.toggleBtn, period === 'weekly' && styles.toggleBtnActive]} onPress={() => setPeriod('weekly')}>
            <Text style={[styles.toggleText, period === 'weekly' && styles.toggleTextActive]}>Weekly</Text>
          </Pressable>
          <Pressable style={[styles.toggleBtn, period === 'monthly' && styles.toggleBtnActive]} onPress={() => setPeriod('monthly')}>
            <Text style={[styles.toggleText, period === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
          </Pressable>
        </View>

        <FormField
          label="Target (number of activities)"
          value={targetValue}
          onChangeText={text => { setTargetValue(text); if (targetError) setTargetError(''); }}
          placeholder="e.g. 3"
          error={targetError}
        />

        <Text style={styles.sectionLabel}>Category (optional)</Text>
        <View style={styles.pillRow}>
          <Pressable onPress={() => setCategoryId(null)}>
            <View style={[styles.pill, categoryId === null ? styles.pillActive : styles.pillInactive]}>
              <Text style={categoryId === null ? styles.pillTextActive : styles.pillTextInactive}>All</Text>
            </View>
          </Pressable>
          {categories.map(cat => (
            <Pressable key={cat.id} onPress={() => setCategoryId(cat.id)}>
              <View style={[styles.pill, categoryId === cat.id ? { borderColor: cat.color, borderWidth: 1 } : styles.pillInactive]}>
                <View style={[styles.pillDot, { backgroundColor: cat.color }]} />
                <Text style={[styles.pillLabel, categoryId === cat.id && styles.pillLabelSelected]}>{cat.name}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Trip (optional)</Text>
        <View style={styles.pillRow}>
          <Pressable onPress={() => setTripId(null)}>
            <View style={[styles.pill, tripId === null ? styles.pillActive : styles.pillInactive]}>
              <Text style={tripId === null ? styles.pillTextActive : styles.pillTextInactive}>Any Trip</Text>
            </View>
          </Pressable>
          {trips.map(trip => (
            <Pressable key={trip.id} onPress={() => setTripId(trip.id)}>
              <View style={[styles.pill, tripId === trip.id ? styles.pillActive : styles.pillInactive]}>
                <Text style={tripId === trip.id ? styles.pillTextActive : styles.pillTextInactive}>{trip.name}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <PrimaryButton label="Save Target" onPress={save} />
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
  sectionLabel: {
    color: Palette.inkSecondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: 'uppercase',
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
    paddingVertical: 10,
  },
  toggleBtnActive: {
    backgroundColor: Palette.terracotta,
    borderColor: Palette.terracotta,
  },
  toggleText: {
    color: Palette.inkSecondary,
    fontSize: 12,
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
    borderRadius: 0,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
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
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextInactive: {
    color: Palette.inkSecondary,
    fontSize: 13,
  },
  pillDot: {
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  pillLabel: {
    color: Palette.inkSecondary,
    fontSize: 13,
  },
  pillLabelSelected: {
    color: Palette.ink,
    fontWeight: '600',
  },
  gap: {
    marginTop: 10,
  },
});
