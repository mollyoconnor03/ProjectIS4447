import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { Palette } from '@/constants/theme';
import { db } from '@/db/client';
import { accommodationsTable } from '@/db/schema';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function AddAccommodation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [name, setName] = useState('');
  const [checkIn, setCheckIn] = useState(new Date());
  const [checkOut, setCheckOut] = useState(new Date());
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showCheckOut, setShowCheckOut] = useState(false);
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [nameError, setNameError] = useState('');

  const save = async () => {
    if (!name.trim()) { setNameError('Name is required.'); return; }
    await db.insert(accommodationsTable).values({
      tripId: Number(id),
      name: name.trim(),
      checkIn: toLocalDate(checkIn),
      checkOut: toLocalDate(checkOut),
      cost: cost.trim() || null,
      notes: notes.trim() || null,
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: '' }} />
      <ScreenHeader title="Add Accommodation" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <FormField
          label="Name"
          value={name}
          onChangeText={t => { setName(t); setNameError(''); }}
          placeholder="e.g. Hotel Azul, Airbnb Central"
          error={nameError}
        />

        <Text style={styles.sectionLabel}>Check-in Date</Text>
        <Pressable
          style={styles.dateBtn}
          onPress={() => setShowCheckIn(true)}
          accessibilityLabel={`Check-in date: ${toLocalDate(checkIn)}`}
          accessibilityRole="button"
        >
          <Text style={styles.dateBtnText}>{toLocalDate(checkIn)}</Text>
        </Pressable>
        {showCheckIn && (
          <DateTimePicker
            value={checkIn}
            mode="date"
            display="default"
            onChange={(_, selected) => {
              if (Platform.OS === 'android') setShowCheckIn(false);
              if (selected) setCheckIn(selected);
            }}
          />
        )}

        <Text style={styles.sectionLabel}>Check-out Date</Text>
        <Pressable
          style={styles.dateBtn}
          onPress={() => setShowCheckOut(true)}
          accessibilityLabel={`Check-out date: ${toLocalDate(checkOut)}`}
          accessibilityRole="button"
        >
          <Text style={styles.dateBtnText}>{toLocalDate(checkOut)}</Text>
        </Pressable>
        {showCheckOut && (
          <DateTimePicker
            value={checkOut}
            mode="date"
            display="default"
            onChange={(_, selected) => {
              if (Platform.OS === 'android') setShowCheckOut(false);
              if (selected) setCheckOut(selected);
            }}
          />
        )}

        <FormField label="Cost (optional)" value={cost} onChangeText={setCost} placeholder="e.g. €120" />
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
