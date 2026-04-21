import { Palette } from '@/constants/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TripCard from '../../components/TripCard';
import PrimaryButton from '../../components/ui/primary-button';
import { Trip, TripContext } from '../_layout';

export default function IndexScreen() {
  const router = useRouter();
  const context = useContext(TripContext);

  const [filterFrom, setFilterFrom] = useState<Date | null>(null);
  const [filterTo, setFilterTo] = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  if (!context) return null;

  const { trips } = context;
  const today = new Date().toISOString().slice(0, 10);

  const filtered = trips.filter((trip: Trip) => {
    if (filterFrom && trip.endDate < filterFrom.toISOString().slice(0, 10)) return false;
    if (filterTo && trip.startDate > filterTo.toISOString().slice(0, 10)) return false;
    return true;
  });

  const upcoming = filtered.filter((t: Trip) => t.endDate >= today);
  const past = filtered.filter((t: Trip) => t.endDate < today);
  const hasFilter = filterFrom !== null || filterTo !== null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.logoHeader}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        {trips.length > 0 && (
          <Text style={styles.logoSubtitle}>{trips.length} trip{trips.length !== 1 ? 's' : ''} recorded</Text>
        )}
      </View>

      <PrimaryButton label="Add Trip" onPress={() => router.push({ pathname: '../add' })} />

      {trips.length > 0 && (
        <View style={styles.filterRow}>
          <Pressable style={styles.dateBtn} onPress={() => setShowFromPicker(true)}>
            <Text style={[styles.dateBtnText, { color: filterFrom ? Palette.ink : Palette.inkHint }]}>
              From: {filterFrom ? filterFrom.toISOString().slice(0, 10) : 'any'}
            </Text>
          </Pressable>
          <Text style={styles.dateSep}>–</Text>
          <Pressable style={styles.dateBtn} onPress={() => setShowToPicker(true)}>
            <Text style={[styles.dateBtnText, { color: filterTo ? Palette.ink : Palette.inkHint }]}>
              To: {filterTo ? filterTo.toISOString().slice(0, 10) : 'any'}
            </Text>
          </Pressable>
          {hasFilter && (
            <Pressable onPress={() => { setFilterFrom(null); setFilterTo(null); }}>
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          )}
        </View>
      )}

      {showFromPicker && (
        <DateTimePicker
          value={filterFrom ?? new Date()}
          mode="date"
          display="default"
          onChange={(_, selected) => {
            if (Platform.OS === 'android') setShowFromPicker(false);
            if (selected) setFilterFrom(selected);
          }}
        />
      )}
      {showToPicker && (
        <DateTimePicker
          value={filterTo ?? new Date()}
          mode="date"
          display="default"
          onChange={(_, selected) => {
            if (Platform.OS === 'android') setShowToPicker(false);
            if (selected) setFilterTo(selected);
          }}
        />
      )}

      {trips.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="compass" size={36} color={Palette.inkHint} />
          <Text style={styles.emptyText}>No trips yet. The world is waiting.</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="calendar" size={36} color={Palette.inkHint} />
          <Text style={styles.emptyText}>Nothing in that range.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {upcoming.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Upcoming</Text>
              {upcoming.map((trip: Trip) => <TripCard key={trip.id} trip={trip} />)}
            </>
          )}
          {past.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Past</Text>
              {past.map((trip: Trip) => <TripCard key={trip.id} trip={trip} />)}
            </>
          )}
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
  logoHeader: {
    alignItems: 'center',
    borderBottomColor: Palette.border,
    borderBottomWidth: 0.5,
    marginBottom: 4,
    paddingBottom: 8,
  },
  logo: {
    height: 130,
    width: 240,
  },
  logoSubtitle: {
    color: Palette.inkSecondary,
    fontSize: 11,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  filterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
    marginTop: 14,
  },
  dateBtn: {
    borderColor: Palette.border,
    borderWidth: 0.5,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  dateBtnText: {
    fontSize: 12,
  },
  dateSep: {
    color: Palette.inkHint,
    fontSize: 14,
  },
  clearText: {
    color: Palette.inkSecondary,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionLabel: {
    color: Palette.inkSecondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
  },
  listContent: {
    paddingBottom: 24,
    paddingTop: 14,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    color: Palette.inkSecondary,
    fontFamily: 'DMSerifDisplay_400Regular',
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
    textAlign: 'center',
  },
});
