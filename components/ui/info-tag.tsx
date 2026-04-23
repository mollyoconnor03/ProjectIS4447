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
    backgroundColor: '#F0EDE8',
    flexDirection: 'row',
    marginBottom: 6,
    marginRight: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: {
    color: Palette.inkSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginRight: 5,
  },
  value: {
    color: Palette.ink,
    fontSize: 11,
  },
});
