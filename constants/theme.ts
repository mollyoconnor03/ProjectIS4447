import { Platform } from 'react-native';

export const Palette = {
  background: '#F8F8F2',
  cardBackground: '#FDFDFB',
  navy: '#1B2A4A',
  slate: '#4A5568',
  ocean: '#2D6A8F',
  ink: '#1A1A2E',
  inkSecondary: '#5C6370',
  border: '#C8BFA8',
  borderStrong: '#8B7D6B',
  danger: '#8B1A1A',
  tagBackground: '#E8EEF4',
  tagText: '#1B2A4A',
  white: '#FFFFFF',
};

export const Colors = {
  light: {
    text: Palette.ink,
    background: Palette.background,
    tint: Palette.ocean,
    icon: Palette.slate,
    tabIconDefault: Palette.slate,
    tabIconSelected: Palette.navy,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'PlayfairDisplay_700Bold',
    serifItalic: 'PlayfairDisplay_400Regular_Italic',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'PlayfairDisplay_700Bold',
    serifItalic: 'PlayfairDisplay_400Regular_Italic',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: 'PlayfairDisplay_700Bold',
    serifItalic: 'PlayfairDisplay_400Regular_Italic',
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
