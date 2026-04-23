import { Palette } from '@/constants/theme';
import { Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  compact?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
};

export default function PrimaryButton({ label, onPress, compact = false, variant = 'primary' }: Props) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const isSecondary = variant === 'secondary';

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      android_ripple={{ color: 'transparent' }}
      style={({ pressed }) => [
        styles.base,
        isPrimary && styles.primary,
        isDanger && styles.danger,
        isSecondary && styles.secondary,
        compact && styles.compact,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[
        styles.baseLabel,
        isPrimary && styles.primaryLabel,
        isDanger && styles.dangerLabel,
        isSecondary && styles.secondaryLabel,
        compact && styles.compactLabel,
      ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  primary: {
    backgroundColor: Palette.terracotta,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderColor: Palette.ink,
    borderWidth: 0.5,
  },
  danger: {
    backgroundColor: Palette.danger,
  },
  compact: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pressed: {
    opacity: 0.7,
  },
  baseLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  primaryLabel: {
    color: Palette.white,
  },
  secondaryLabel: {
    color: Palette.ink,
  },
  dangerLabel: {
    color: Palette.white,
  },
  compactLabel: {
    fontSize: 12,
  },
});
