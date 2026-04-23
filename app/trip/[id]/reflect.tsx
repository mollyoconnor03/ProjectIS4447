import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { Palette } from '@/constants/theme';
import { db } from '@/db/client';
import { tripsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext, Trip, TripContext } from '../../_layout';

export default function ReflectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const tripContext = useContext(TripContext);
  const authContext = useContext(AuthContext);

  const trip = tripContext?.trips.find((t: Trip) => t.id === Number(id));

  const [memory, setMemory] = useState(trip?.reflectMemory ?? '');
  const [meal, setMeal] = useState(trip?.reflectMeal ?? '');
  const [spot, setSpot] = useState(trip?.reflectSpot ?? '');
  const [notes, setNotes] = useState(trip?.reflectNotes ?? '');

  if (!trip) return null;

  const save = async () => {
    await db.update(tripsTable).set({
      reflectMemory: memory.trim() || null,
      reflectMeal: meal.trim() || null,
      reflectSpot: spot.trim() || null,
      reflectNotes: notes.trim() || null,
    }).where(eq(tripsTable.id, trip.id));

    if (authContext?.user) await tripContext?.refreshTrips(authContext.user.id);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: '' }} />
      <ScreenHeader title="Reflect" subtitle={trip.name} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <FormField
          label="Favourite Memory (optional)"
          value={memory}
          onChangeText={setMemory}
          placeholder="What moment will you never forget?"
          multiline
        />
        <FormField
          label="Favourite Meal (optional)"
          value={meal}
          onChangeText={setMeal}
          placeholder="Best thing you ate or drank"
          multiline
        />
        <FormField
          label="Favourite Spot (optional)"
          value={spot}
          onChangeText={setSpot}
          placeholder="A place you'd go back to in a heartbeat"
          multiline
        />
        <FormField
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything else worth remembering..."
          multiline
        />
        <PrimaryButton label="Save Reflection" onPress={save} />
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
  gap: {
    marginTop: 10,
  },
});
