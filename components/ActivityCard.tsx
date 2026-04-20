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
  const accentColor = categoryColor ?? Palette.border;

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
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <Text style={styles.name}>{activity.name}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.date}>{activity.date}</Text>
        {categoryName && categoryColor && (
          <View style={styles.categoryPill}>
            <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
            <Text style={styles.categoryLabel}>{categoryName}</Text>
          </View>
        )}
      </View>
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
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 3,
  },
  name: {
    color: Palette.ink,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 16,
    letterSpacing: 0.1,
    marginBottom: 4,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 6,
  },
  date: {
    color: Palette.inkSecondary,
    flex: 1,
    fontSize: 12,
  },
  categoryPill: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  categoryDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  categoryLabel: {
    color: Palette.inkSecondary,
    fontSize: 12,
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
