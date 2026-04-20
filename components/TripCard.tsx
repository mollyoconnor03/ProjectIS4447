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
      <View style={styles.accentBar} />
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
    borderRadius: 0,
    borderWidth: 1.5,
    marginBottom: 14,
    overflow: 'hidden',
    paddingBottom: 16,
    paddingLeft: 20,
    paddingRight: 16,
    paddingTop: 16,
  },
  accentBar: {
    backgroundColor: Palette.navy,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 3,
  },
  name: {
    color: Palette.ink,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 18,
    letterSpacing: 0.1,
    lineHeight: 24,
  },
  destination: {
    color: Palette.inkSecondary,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginBottom: 10,
    marginTop: 2,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
});
