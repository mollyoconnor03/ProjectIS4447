import { Trip } from '@/app/_layout';
import InfoTag from '@/components/ui/info-tag';
import PrimaryButton from '@/components/ui/primary-button';
import { Palette } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  trip: Trip;
};

export default function TripCard({ trip }: Props) {
  const router = useRouter();
  const openDetails = () =>
    router.push({ pathname: '/trip/[id]', params: { id: trip.id.toString() } });

  return (
    <View style={styles.card}>
      <Pressable onPress={openDetails}>
        <Text style={styles.name}>{trip.name}</Text>
      </Pressable>
      <Text style={styles.destination}>{trip.destination}</Text>
      <View style={styles.tags}>
        <InfoTag label="From" value={trip.startDate} />
        <InfoTag label="To" value={trip.endDate} />
        <InfoTag label="Activities" value={String(trip.activityCount ?? 0)} />
      </View>
      <PrimaryButton compact label="View Trip" onPress={openDetails} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.cardBackground,
    borderColor: Palette.border,
    borderWidth: 0.5,
    marginBottom: 12,
    paddingBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  name: {
    color: Palette.ink,
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 2,
  },
  destination: {
    color: Palette.inkSecondary,
    fontSize: 12,
    marginBottom: 10,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
    marginTop: 4,
  },
});
