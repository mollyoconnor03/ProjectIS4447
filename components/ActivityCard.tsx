import { Activity } from '@/app/_layout';
import PrimaryButton from '@/components/ui/primary-button';
import { Palette } from '@/constants/theme';
import Feather from '@expo/vector-icons/Feather';
import { Alert, StyleSheet, Text, View } from 'react-native';

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

type Props = {
  activity: Activity;
  categoryName: string | null;
  categoryColor: string | null;
  onEdit: () => void;
  onDelete: () => void;
};

export default function ActivityCard({ activity, categoryName, categoryColor, onEdit, onDelete }: Props) {
  const confirmDelete = () => {
    Alert.alert(
      'Delete Activity',
      'This will permanently delete this activity.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.metaRow}>
        <Text style={styles.date}>{activity.date}</Text>
        {categoryName && categoryColor && (
          <View style={styles.categoryPill}>
            <View style={[styles.dot, { backgroundColor: categoryColor }]} />
            <Text style={styles.categoryLabel}>{categoryName}</Text>
          </View>
        )}
      </View>
      <Text style={styles.name}>{activity.name}</Text>
      {activity.durationMins ? <View style={styles.detailRow}><Feather name="clock" size={11} color={Palette.inkHint} /><Text style={styles.detail}>{formatDuration(activity.durationMins)}</Text></View> : null}
      {activity.startTime ? <View style={styles.detailRow}><Feather name="clock" size={11} color={Palette.inkHint} /><Text style={styles.detail}>{activity.startTime}</Text></View> : null}
      {activity.location ? <View style={styles.detailRow}><Feather name="map-pin" size={11} color={Palette.inkHint} /><Text style={styles.detail}>{activity.location}</Text></View> : null}
      {activity.cost ? <View style={styles.detailRow}><Feather name="tag" size={11} color={Palette.inkHint} /><Text style={styles.detail}>{activity.cost}</Text></View> : null}
      {activity.participants ? <View style={styles.detailRow}><Feather name="users" size={11} color={Palette.inkHint} /><Text style={styles.detail}>{activity.participants}</Text></View> : null}
      {activity.notes ? <View style={styles.detailRow}><Feather name="file-text" size={11} color={Palette.inkHint} /><Text style={styles.notes} numberOfLines={2}>{activity.notes}</Text></View> : null}
      <View style={styles.buttonRow}>
        <View style={styles.buttonWrap}>
          <PrimaryButton compact label="Edit" variant="secondary" onPress={onEdit} />
        </View>
        <View style={styles.buttonWrap}>
          <PrimaryButton compact label="Delete" variant="danger" onPress={confirmDelete} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.cardBackground,
    borderColor: Palette.border,
    borderWidth: 1,
    elevation: 2,
    marginBottom: 10,
    paddingBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 4,
  },
  date: {
    color: Palette.inkSecondary,
    flex: 1,
    fontSize: 11,
  },
  categoryPill: {
    alignItems: 'center',
    backgroundColor: '#F0EDE8',
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: {
    height: 8,
    width: 8,
  },
  categoryLabel: {
    color: Palette.inkSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  name: {
    color: Palette.ink,

    fontSize: 17,
    marginBottom: 6,
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    marginBottom: 2,
  },
  detail: {
    color: Palette.inkSecondary,
    fontSize: 12,
  },
  notes: {
    color: Palette.inkSecondary,
    fontStyle: 'italic',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  buttonWrap: {
    flex: 1,
  },
});
