import { Palette } from '@/constants/theme';
import { Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  compact?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
};

export default function PrimaryButton({
  label,
  onPress,
  compact = false,
  variant = 'primary',
}: Props) {
  const buttonStyle =
    variant === 'secondary' ? styles.secondary
    : variant === 'danger' ? styles.danger
    : styles.primary;

  const labelStyle =
    variant === 'secondary' ? styles.secondaryLabel : styles.primaryLabel;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'transparent' }}
      style={({ pressed }) => [
        styles.base,
        buttonStyle,
        compact ? styles.compact : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Text style={[styles.baseLabel, labelStyle, compact ? styles.compactLabel : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: 0,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  primary: {
    backgroundColor: Palette.navy,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderColor: Palette.navy,
    borderWidth: 1.5,
  },
  danger: {
    backgroundColor: Palette.danger,
  },
  compact: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pressed: {
    opacity: 0.75,
  },
  baseLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  primaryLabel: {
    color: Palette.background,
  },
  secondaryLabel: {
    color: Palette.navy,
  },
  compactLabel: {
    fontSize: 11,
    letterSpacing: 1.2,
  },
});
