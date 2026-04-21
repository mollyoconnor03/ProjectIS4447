import { Palette } from '@/constants/theme';
import { StyleSheet, Text, TextInput, View } from 'react-native';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
};

export default function FormField({ label, value, onChangeText, placeholder, secureTextEntry, error, multiline, numberOfLines }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholder={placeholder ?? label}
        placeholderTextColor={Palette.inkHint}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={multiline ? (numberOfLines ?? 3) : undefined}
        style={[styles.input, multiline ? styles.multilineInput : null, error ? styles.inputError : null]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    color: Palette.inkSecondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Palette.cardBackground,
    borderColor: Palette.border,
    borderRadius: 0,
    borderWidth: 0.5,
    color: Palette.ink,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  inputError: {
    borderColor: Palette.danger,
  },
  error: {
    color: Palette.danger,
    fontSize: 12,
    marginTop: 4,
  },
});
