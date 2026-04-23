import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { Palette } from '@/constants/theme';
import { db } from '@/db/client';
import { transportTable } from '@/db/schema';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TYPES = ['flight', 'bus', 'train', 'ferry', 'other'] as const;
type TransportType = typeof TYPES[number];

function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function AddTransport() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [type, setType] = useState<TransportType>('flight');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [descError, setDescError] = useState('');

  const save = async () => {
    if (!description.trim()) { setDescError('Description is required.'); return; }
    await db.insert(transportTable).values({
      tripId: Number(id),
      type,
      description: description.trim(),
      date: toLocalDate(date),
      cost: cost.trim() || null,
      notes: notes.trim() || null,
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: '' }} />
      <ScreenHeader title="Add Transport" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text style={styles.sectionLabel}>Type</Text>
        <View style={styles.typeRow}>
          {TYPES.map(t => (
            <Pressable key={t} onPress={() => setType(t)}
              accessibilityLabel={`Transport type: ${t}`} accessibilityRole="radio"
              accessibilityState={{ checked: type === t }}>
              <View style={[styles.pill, type === t && styles.pillActive]}>
                <Text style={[styles.pillText, type === t && styles.pillTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <FormField
          label="Description"
          value={description}
          onChangeText={t => { setDescription(t); setDescError(''); }}
          placeholder="e.g. Ryanair FR1234 Dublin → Alicante"
          error={descError}
        />

        <Text style={styles.sectionLabel}>Date</Text>
        <Pressable
          style={styles.dateBtn}
          onPress={() => setShowDatePicker(true)}
          accessibilityLabel={`Date: ${toLocalDate(date)}`}
          accessibilityRole="button"
        >
          <Text style={styles.dateBtnText}>{toLocalDate(date)}</Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(_, selected) => {
              if (Platform.OS === 'android') setShowDatePicker(false);
              if (selected) setDate(selected);
            }}
          />
        )}

        <FormField label="Cost (optional)" value={cost} onChangeText={setCost} placeholder="e.g. €65" />
        <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} multiline />

        <PrimaryButton label="Save" onPress={save} />
        <View style={styles.gap}>
          <PrimaryButton label="Cancel" variant="secondary" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: Palette.background, flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  scroll: { paddingBottom: 32 },
  sectionLabel: {
    color: Palette.inkSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 8,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  pill: {
    borderColor: Palette.border,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillActive: { backgroundColor: Palette.terracotta, borderColor: Palette.terracotta },
  pillText: { color: Palette.inkSecondary, fontSize: 13 },
  pillTextActive: { color: Palette.white, fontWeight: '600' },
  dateBtn: {
    backgroundColor: Palette.cardBackground,
    borderColor: Palette.border,
    borderWidth: 0.5,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateBtnText: { color: Palette.ink, fontSize: 15 },
  gap: { marginTop: 10 },
});
