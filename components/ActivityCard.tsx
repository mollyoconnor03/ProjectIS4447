import { Activity } from '@/app/_layout';
import PrimaryButton from '@/components/ui/primary-button';
import { Palette } from '@/constants/theme';
import { Alert, StyleSheet, Text, View } from 'react-native';

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
      {activity.startTime ? <Text style={styles.detail}>Time: {activity.startTime}</Text> : null}
      {activity.location ? <Text style={styles.detail}>Location: {activity.location}</Text> : null}
      {activity.cost ? <Text style={styles.detail}>Cost: {activity.cost}</Text> : null}
      {activity.participants ? <Text style={styles.detail}>With: {activity.participants}</Text> : null}
      {activity.notes ? <Text style={styles.notes} numberOfLines={2}>{activity.notes}</Text> : null}
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
    borderWidth: 0.5,
    marginBottom: 10,
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
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
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  categoryLabel: {
    color: Palette.inkSecondary,
    fontSize: 11,
  },
  name: {
    color: Palette.ink,
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 16,
    marginBottom: 5,
  },
  detail: {
    color: Palette.inkSecondary,
    fontSize: 12,
    marginBottom: 2,
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
