import { Palette } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
  centered?: boolean;
};

export default function ScreenHeader({ title, subtitle, centered = false }: Props) {
  return (
    <View style={[styles.container, centered && styles.centered]}>
      <Text style={[styles.title, centered && styles.titleCentered]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, centered && styles.subtitleCentered]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomColor: Palette.border,
    borderBottomWidth: 0.5,
    marginBottom: 20,
    paddingBottom: 14,
  },
  title: {
    color: Palette.ink,

    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    color: Palette.ink,
    fontSize: 13,
    marginTop: 4,
  },
  centered: {
    alignItems: 'center',
  },
  titleCentered: {
    textAlign: 'center',
  },
  subtitleCentered: {
    textAlign: 'center',
  },
});
