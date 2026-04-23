import { Trip } from '@/app/_layout';
import InfoTag from '@/components/ui/info-tag';
import PrimaryButton from '@/components/ui/primary-button';
import { Palette } from '@/constants/theme';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  trip: Trip;
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
  const month = d.toLocaleDateString('en', { month: 'long' });
  return `${day}${suffix} ${month}`;
}

export default function TripCard({ trip }: Props) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const isPast = trip.endDate < today;

  const openDetails = () =>
    router.push({ pathname: '/trip/[id]', params: { id: trip.id.toString() } });

  const openReflect = () =>
    router.push({ pathname: '/trip/[id]/reflect', params: { id: trip.id.toString() } });

  return (
    <View style={styles.card}>
      <Pressable onPress={openDetails} accessibilityLabel={`View trip: ${trip.name}`} accessibilityRole="button">
        <Text style={styles.name}>{trip.name}</Text>
      </Pressable>
      <View style={styles.destinationRow}>
        <Feather name="map-pin" size={11} color={Palette.inkHint} />
        <Text style={styles.destination}>{trip.destination}</Text>
      </View>
      <View style={styles.tags}>
        <InfoTag label="From" value={formatDate(trip.startDate)} />
        <InfoTag label="To" value={formatDate(trip.endDate)} />
        <InfoTag label="Activities" value={String(trip.activityCount ?? 0)} />
      </View>
      <View style={styles.btnRow}>
        <View style={styles.btnFlex}>
          <PrimaryButton compact label="View Trip" onPress={openDetails} />
        </View>
        {isPast && (
          <View style={styles.btnFlex}>
            <PrimaryButton compact label="Reflect" variant="secondary" onPress={openReflect} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#E8F8F7',
    borderColor: Palette.border,
    borderWidth: 1,
    elevation: 2,
    marginBottom: 14,
    paddingBottom: 16,
    paddingHorizontal: 18,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  name: {
    color: Palette.ink,

    fontSize: 20,
    lineHeight: 26,
    marginBottom: 3,
  },
  destinationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
  },
  destination: {
    color: Palette.inkSecondary,
    fontSize: 13,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
    marginTop: 4,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnFlex: {
    flex: 1,
  },
});
