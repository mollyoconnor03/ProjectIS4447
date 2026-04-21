import { Target } from '@/app/_layout';
import PrimaryButton from '@/components/ui/primary-button';
import { Palette } from '@/constants/theme';
import { Alert, StyleSheet, Text, View } from 'react-native';

type Props = {
  target: Target;
  progress: number;
  categoryName: string | null;
  tripName: string | null;
  periodEndsSoon: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export default function TargetCard({ target, progress, categoryName, tripName, onEdit, onDelete }: Props) {
  const exceeded = progress >= target.targetValue;
  const fill = Math.min(progress / target.targetValue, 1);

  const confirmDelete = () => {
    Alert.alert(
      'Delete Target',
      'This will permanently delete this target.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{target.label}</Text>
      <Text style={styles.period}>{target.period === 'weekly' ? 'Weekly' : 'Monthly'}</Text>

      <View style={styles.metaRow}>
        {categoryName ? <Text style={styles.meta}>Category: {categoryName}</Text> : null}
        {tripName ? <Text style={styles.meta}>Trip: {tripName}</Text> : null}
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${fill * 100}%` as any }]} />
      </View>

      <Text style={styles.progressText}>
        {progress} / {target.targetValue} activities{exceeded ? '  ✓' : ''}
      </Text>

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
    paddingTop: 14,
  },
  label: {
    color: Palette.ink,
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 16,
    marginBottom: 2,
  },
  period: {
    color: Palette.inkSecondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.0,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  metaRow: {
    gap: 2,
    marginBottom: 4,
  },
  meta: {
    color: Palette.inkSecondary,
    fontSize: 12,
  },
  progressTrack: {
    backgroundColor: Palette.border,
    height: 3,
    marginBottom: 6,
    marginTop: 8,
  },
  progressFill: {
    backgroundColor: Palette.terracotta,
    height: 3,
  },
  progressText: {
    color: Palette.inkSecondary,
    fontSize: 12,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  buttonWrap: {
    flex: 1,
  },
});
