import { Palette } from '@/constants/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FormField from '../components/ui/form-field';
import PrimaryButton from '../components/ui/primary-button';
import ScreenHeader from '../components/ui/screen-header';
import { db } from '../db/client';
import { tripsTable } from '../db/schema';
import { AuthContext, TripContext } from './_layout';

function DateField({ label, date, onChange }: { label: string; date: Date; onChange: (d: Date) => void }) {
  const [show, setShow] = useState(false);
  return (
    <View style={dateStyles.wrapper}>
      <Text style={dateStyles.label}>{label}</Text>
      <Pressable onPress={() => setShow(true)} style={dateStyles.button}>
        <Text style={dateStyles.value}>{date.toISOString().slice(0, 10)}</Text>
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

export default function AddTrip() {
  const router = useRouter();
  const context = useContext(TripContext);
  const authContext = useContext(AuthContext);
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [notes, setNotes] = useState('');

  if (!context) return null;
  const { refreshTrips } = context;

  const saveTrip = async () => {
    await db.insert(tripsTable).values({
      name,
      destination,
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
      notes: notes.trim() || null,
      userId: authContext?.user?.id ?? null,
    });
    if (authContext?.user) await refreshTrips(authContext.user.id);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: '' }} />
      <ScreenHeader title="Add Trip" subtitle="Plan a new holiday." />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <FormField label="Trip Name" value={name} onChangeText={setName} />
        <FormField label="Destination" value={destination} onChangeText={setDestination} />
        <DateField label="Start Date" date={startDate} onChange={setStartDate} />
        <DateField label="End Date" date={endDate} onChange={setEndDate} />
        <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Any notes about this trip..." multiline />
        <PrimaryButton label="Save Trip" onPress={saveTrip} />
        <View style={styles.backButton}>
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
  backButton: {
    marginTop: 10,
  },
});
