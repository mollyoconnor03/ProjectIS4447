import { Palette } from '@/constants/theme';
import Feather from '@expo/vector-icons/Feather';
import { View } from 'react-native';

type Props = {
  name: string;
  color: string;
  focused: boolean;
};

export default function TabIcon({ name, color, focused }: Props) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Feather name={name as any} size={20} color={color} />
      <View style={{
        width: 4,
        height: 4,
        backgroundColor: focused ? Palette.terracotta : 'transparent',
        marginTop: 4,
      }} />
    </View>
  );
}
