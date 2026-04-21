import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { Palette } from '@/constants/theme';
import { db } from '@/db/client';
import { activitiesTable } from '@/db/schema';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext, CategoryContext, Trip, TripContext } from '../../_layout';

function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function DateField({ label, date, onChange }: { label: string; date: Date; onChange: (d: Date) => void }) {
  const [show, setShow] = useState(false);
  return (
    <View style={dateStyles.wrapper}>
      <Text style={dateStyles.label}>{label}</Text>
      <Pressable onPress={() => setShow(true)} style={dateStyles.button}>
        <Text style={dateStyles.value}>{toLocalDate(date)}</Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(_, selected) => {
            if (Platform.OS === 'android') setShow(false);
            if (selected) onChange(selected);
          }}
        />
      )}
    </View>
  );
}

const dateStyles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    color: Palette.inkSecondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  button: {
    backgroundColor: Palette.cardBackground,
    borderColor: Palette.border,
    borderRadius: 0,
    borderWidth: 0.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  value: { color: Palette.ink, fontSize: 15 },
});

export default function AddActivity() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const catContext = useContext(CategoryContext);
  const tripContext = useContext(TripContext);

  const trip = tripContext?.trips.find((t: Trip) => t.id === Number(id));

  const defaultActivityDate = (): Date => {
    if (!trip) return new Date();
    const today = toLocalDate(new Date());
    if (today >= trip.startDate && today <= trip.endDate) return new Date();
    if (today > trip.endDate) return new Date(trip.endDate + 'T12:00:00');
    return new Date(trip.startDate + 'T12:00:00');
  };

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [date, setDate] = useState(defaultActivityDate);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categoryError, setCategoryError] = useState('');
  const [startTime, setStartTime] = useState('');
  const [location, setLocation] = useState('');
  const [cost, setCost] = useState('');
  const [participants, setParticipants] = useState('');
  const [notes, setNotes] = useState('');

  const categories = catContext?.categories ?? [];

  const saveActivity = async () => {
    let valid = true;
    if (!name.trim()) { setNameError('Activity name is required.'); valid = false; } else { setNameError(''); }
    if (categoryId === null) { setCategoryError('Please select a category.'); valid = false; } else { setCategoryError(''); }
    if (!valid) return;

    await db.insert(activitiesTable).values({
      tripId: Number(id),
      categoryId,
      name: name.trim(),
      date: toLocalDate(date),
      startTime: startTime.trim() || null,
      location: location.trim() || null,
      cost: cost.trim() || null,
      participants: participants.trim() || null,
      notes: notes.trim() || null,
    });

    if (authContext?.user) await tripContext?.refreshTrips(authContext.user.id);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: '' }} />
      <ScreenHeader title="Add Activity" subtitle={trip?.name ?? 'New Activity'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <FormField
          label="Activity Name"
          value={name}
          onChangeText={text => { setName(text); if (nameError) setNameError(''); }}
          error={nameError}
        />

        <DateField label="Date" date={date} onChange={setDate} />

        <Text style={styles.sectionLabel}>Category</Text>
        {categories.length === 0 ? (
          <Text style={styles.hint}>No categories yet. Add one in the Categories tab.</Text>
        ) : (
          <View style={styles.pillRow}>
            {categories.map(cat => {
              const selected = categoryId === cat.id;
              return (
                <Pressable key={cat.id} onPress={() => { setCategoryId(cat.id); if (categoryError) setCategoryError(''); }}>
                  <View style={[styles.pill, selected ? { borderColor: cat.color, borderWidth: 1 } : styles.pillInactive]}>
                    <View style={[styles.pillDot, { backgroundColor: cat.color }]} />
                    <Text style={[styles.pillLabel, selected && styles.pillLabelSelected]}>{cat.name}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
        {categoryError ? <Text style={styles.fieldError}>{categoryError}</Text> : null}

        <FormField label="Start Time (optional)" value={startTime} onChangeText={setStartTime} placeholder="e.g. 10:00 AM" />
        <FormField label="Location (optional)" value={location} onChangeText={setLocation} placeholder="e.g. Colosseum, Rome" />
        <FormField label="Cost (optional)" value={cost} onChangeText={setCost} placeholder="e.g. €25" />
        <FormField label="Participants (optional)" value={participants} onChangeText={setParticipants} placeholder="e.g. Sarah, Tom" />
        <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Any notes..." multiline />

        <PrimaryButton label="Save Activity" onPress={saveActivity} />
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
  hint: {
    color: Palette.inkSecondary,
    fontSize: 13,
    marginBottom: 16,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  pill: {
    alignItems: 'center',
    borderRadius: 0,
    borderWidth: 0.5,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillInactive: {
    borderColor: Palette.border,
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
  fieldError: {
    color: Palette.danger,
    fontSize: 12,
    marginBottom: 12,
    marginTop: -4,
  },
  gap: {
    marginTop: 10,
  },
});
