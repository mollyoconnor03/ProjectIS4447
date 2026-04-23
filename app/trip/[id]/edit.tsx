import DateField from '@/components/ui/date-field';
import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { Palette } from '@/constants/theme';
import { db } from '@/db/client';
import { tripsTable } from '@/db/schema';
import Feather from '@expo/vector-icons/Feather';
import { eq } from 'drizzle-orm';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext, Trip, TripContext } from '../../_layout';

type GeoResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
};

export default function EditTrip() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(TripContext);
  const authContext = useContext(AuthContext);
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [notes, setNotes] = useState('');

  const [geoResults, setGeoResults] = useState<GeoResult[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(false);
  const [selectedGeo, setSelectedGeo] = useState<GeoResult | null>(null);

  const trip = context?.trips.find((t: Trip) => t.id === Number(id));

  useEffect(() => {
    if (!trip) return;
    setName(trip.name);
    setDestination(trip.destination);
    setStartDate(new Date(trip.startDate));
    setEndDate(new Date(trip.endDate));
    setNotes(trip.notes ?? '');
    if (trip.latitude && trip.longitude && trip.country) {
      setSelectedGeo({
        id: 0,
        name: trip.destination,
        latitude: trip.latitude,
        longitude: trip.longitude,
        country: trip.country,
      });
    }
  }, [trip]);

  if (!context || !trip) return null;

  const { refreshTrips } = context;

  const lookupDestination = async () => {
    if (!destination.trim()) return;
    setGeoLoading(true);
    setGeoResults([]);
    setGeoError(false);
    setSelectedGeo(null);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination.trim())}&count=3`
      );
      const data = await res.json();
      const results: GeoResult[] = data.results ?? [];
      setGeoResults(results);
      if (results.length === 0) setGeoError(true);
    } catch {
      setGeoError(true);
    }
    setGeoLoading(false);
  };

  const saveChanges = async () => {
    await db
      .update(tripsTable)
      .set({
        name,
        destination,
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        notes: notes.trim() || null,
        latitude: selectedGeo?.latitude ?? null,
        longitude: selectedGeo?.longitude ?? null,
        country: selectedGeo?.country ?? null,
      })
      .where(eq(tripsTable.id, Number(id)));
    if (authContext?.user) await refreshTrips(authContext.user.id);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: '' }} />
      <ScreenHeader title="Edit Trip" subtitle={`Update ${trip.name}`} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <FormField label="Trip Name" value={name} onChangeText={setName} />

        <FormField
          label="Destination"
          value={destination}
          onChangeText={text => {
            setDestination(text);
            setSelectedGeo(null);
            setGeoResults([]);
            setGeoError(false);
          }}
        />

        {destination.trim().length > 0 && !selectedGeo && (
          <View style={styles.geoLookupRow}>
            <Pressable style={styles.lookupBtn} onPress={lookupDestination} disabled={geoLoading} accessibilityLabel="Look up location coordinates" accessibilityRole="button">
              {geoLoading
                ? <ActivityIndicator size="small" color={Palette.terracotta} />
                : <Text style={styles.lookupBtnText}>Look up location</Text>
              }
            </Pressable>
          </View>
        )}

        {geoError && (
          <Text style={styles.geoError}>No results found. Try a different spelling.</Text>
        )}

        {geoResults.length > 0 && !selectedGeo && (
          <View style={styles.geoResults}>
            {geoResults.map(r => (
              <Pressable key={r.id} style={styles.geoRow} onPress={() => {
                setSelectedGeo(r);
                setGeoResults([]);
              }} accessibilityLabel={`Select location: ${r.name}${r.admin1 ? `, ${r.admin1}` : ''}, ${r.country}`} accessibilityRole="button">
                <View style={styles.geoRowInner}>
                  <Text style={styles.geoName}>{r.name}{r.admin1 ? `, ${r.admin1}` : ''}</Text>
                  <Text style={styles.geoCountry}>{r.country}</Text>
                </View>
                <Feather name="chevron-right" size={14} color={Palette.inkHint} />
              </Pressable>
            ))}
          </View>
        )}

        {selectedGeo && (
          <View style={styles.geoConfirmed}>
            <Feather name="map-pin" size={13} color={Palette.terracotta} />
            <Text style={styles.geoConfirmedText}>
              {selectedGeo.name}{selectedGeo.admin1 ? `, ${selectedGeo.admin1}` : ''}, {selectedGeo.country}
            </Text>
            <Pressable onPress={() => { setSelectedGeo(null); setGeoResults([]); }} accessibilityLabel="Clear selected location" accessibilityRole="button">
              <Feather name="x" size={13} color={Palette.inkHint} />
            </Pressable>
          </View>
        )}

        <DateField label="Start Date" date={startDate} onChange={setStartDate} />
        <DateField label="End Date" date={endDate} onChange={setEndDate} />
        <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Any notes about this trip..." multiline />

        <PrimaryButton label="Save Changes" onPress={saveChanges} />
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
  geoLookupRow: {
    marginBottom: 12,
    marginTop: -4,
  },
  lookupBtn: {
    alignSelf: 'flex-start',
    borderColor: Palette.terracotta,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  lookupBtnText: {
    color: Palette.terracotta,
    fontSize: 12,
    fontWeight: '600',
  },
  geoError: {
    color: Palette.inkSecondary,
    fontSize: 12,
    marginBottom: 12,
    marginTop: -4,
  },
  geoResults: {
    borderColor: Palette.border,
    borderWidth: 0.5,
    marginBottom: 16,
    marginTop: -4,
  },
  geoRow: {
    alignItems: 'center',
    borderBottomColor: Palette.border,
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  geoRowInner: {
    flex: 1,
  },
  geoName: {
    color: Palette.ink,
    fontSize: 13,
    fontWeight: '500',
  },
  geoCountry: {
    color: Palette.inkSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  geoConfirmed: {
    alignItems: 'center',
    backgroundColor: Palette.cardBackground,
    borderColor: Palette.border,
    borderWidth: 0.5,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    marginTop: -4,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  geoConfirmedText: {
    color: Palette.ink,
    flex: 1,
    fontSize: 12,
  },
});
