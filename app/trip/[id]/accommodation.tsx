import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { Palette } from '@/constants/theme';
import { db } from '@/db/client';
import { tripsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext, Trip, TripContext } from '../../_layout';

export default function AccommodationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(TripContext);
  const authContext = useContext(AuthContext);

  const trip = context?.trips.find((t: Trip) => t.id === Number(id));

  const [name, setName] = useState('');
  const [cost, setCost] = useState('');

  useEffect(() => {
    if (!trip) return;
    setName(trip.accommodationName ?? '');
    setCost(trip.accommodationCost ?? '');
  }, [trip]);

  if (!trip) return null;

  const save = async () => {
    await db
      .update(tripsTable)
      .set({
        accommodationName: name.trim() || null,
        accommodationCost: cost.trim() || null,
      })
      .where(eq(tripsTable.id, Number(id)));
    if (authContext?.user) await context?.refreshTrips(authContext.user.id);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: '' }} />
      <ScreenHeader title="Accommodation" subtitle={trip.name} />
      <View style={styles.form}>
        <FormField
          label="Where are you staying?"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Hotel Sunshine, Airbnb"
        />
        <FormField
          label="Cost (optional)"
          value={cost}
          onChangeText={setCost}
          placeholder="e.g. €200"
        />
      </View>
      <PrimaryButton label="Save" onPress={save} />
      <View style={styles.cancelButton}>
        <PrimaryButton label="Cancel" variant="secondary" onPress={() => router.back()} />
      </View>
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
  form: {
    marginBottom: 8,
  },
  cancelButton: {
    marginTop: 10,
  },
});
