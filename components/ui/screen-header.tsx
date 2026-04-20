import { Palette } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
};

export default function ScreenHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomColor: Palette.border,
    borderBottomWidth: 1.5,
    marginBottom: 20,
    paddingBottom: 16,
  },
  title: {
    color: Palette.ink,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    letterSpacing: 0.3,
    lineHeight: 36,
  },
  subtitle: {
    color: Palette.inkSecondary,
    fontSize: 13,
    letterSpacing: 0.2,
    marginTop: 4,
  },
});
