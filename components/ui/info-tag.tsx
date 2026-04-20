import { Palette } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  value: string;
};

export default function InfoTag({ label, value }: Props) {
  return (
    <View style={styles.tag}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    backgroundColor: Palette.tagBackground,
    borderColor: Palette.ocean,
    borderRadius: 0,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 8,
    marginRight: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  label: {
    color: Palette.ocean,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.0,
    marginRight: 5,
    textTransform: 'uppercase',
  },
  value: {
    color: Palette.navy,
    fontSize: 12,
    fontWeight: '600',
  },
});
