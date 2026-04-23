import { Target } from '@/app/_layout';
import PrimaryButton from '@/components/ui/primary-button';
import { Palette } from '@/constants/theme';
import { Alert, StyleSheet, Text, View } from 'react-native';

type Props = {
  target: Target;
  progress: number;
  tripName: string | null;
  categoryName: string | null;
  onEdit: () => void;
  onDelete: () => void;
};

function progressLabel(target: Target, progress: number): string {
  if (target.type === 'spending') {
    return `€${progress.toFixed(2)} of €${target.targetValue.toFixed(2)}`;
  }
  if (target.type === 'trips_count') {
    return `${progress} / ${target.targetValue} trip${target.targetValue !== 1 ? 's' : ''}`;
  }
  return `${progress} / ${target.targetValue} ${target.targetValue !== 1 ? 'activities' : 'activity'}`;
}

function periodLabel(period: string | null): string {
  if (period === 'monthly') return 'Monthly';
  if (period === 'quarterly') return 'Quarterly';
  return period ?? '';
}

export default function TargetCard({ target, progress, tripName, categoryName, onEdit, onDelete }: Props) {
  const isSpending = target.type === 'spending';
  const pct = Math.min(progress / target.targetValue, 1);
  const met = isSpending ? progress <= target.targetValue : progress >= target.targetValue;

  const confirmDelete = () => {
    Alert.alert('Delete Target', 'Remove this target?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.label} numberOfLines={1}>{target.label}</Text>
        {target.type === 'activity' && tripName
          ? <Text style={styles.badge}>{tripName}</Text>
          : <Text style={styles.badge}>{periodLabel(target.period)}</Text>
        }
      </View>

      <Text style={styles.sub}>
        {target.type === 'activity'
          ? (categoryName ?? 'All activities')
          : target.type === 'spending'
          ? 'Spending limit'
          : 'Trips per period'}
      </Text>

      <View style={styles.trackRow}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: isSpending ? (met ? '#4a7c59' : Palette.danger) : (met ? '#4a7c59' : Palette.terracotta) }]} />
        </View>
        {met && <Text style={styles.metLabel}>{isSpending ? 'Under budget' : 'Met'}</Text>}
      </View>

      <Text style={styles.progressText}>{progressLabel(target, progress)}</Text>

      <View style={styles.btnRow}>
        <View style={styles.btn}>
          <PrimaryButton compact label="Edit" variant="secondary" onPress={onEdit} />
        </View>
        <View style={styles.btn}>
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
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  label: {
    color: Palette.ink,
    flex: 1,

    fontSize: 16,
    marginRight: 8,
  },
  badge: {
    color: Palette.inkSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  sub: {
    color: Palette.inkSecondary,
    fontSize: 11,
    marginBottom: 12,
  },
  trackRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  track: {
    backgroundColor: Palette.border,
    flex: 1,
    height: 3,
  },
  fill: {
    height: 3,
  },
  metLabel: {
    color: '#4a7c59',
    fontSize: 11,
    fontWeight: '600',
  },
  progressText: {
    color: Palette.inkSecondary,
    fontSize: 12,
    marginBottom: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
  },
});
