import { Palette } from '@/constants/theme';
import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Feather name={name as any} size={20} color={color} />
      <View style={{
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: focused ? Palette.terracotta : 'transparent',
        marginTop: 4,
      }} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Palette.white,
          borderTopWidth: 0.5,
          borderTopColor: Palette.border,
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Palette.ink,
        tabBarInactiveTintColor: Palette.inkHint,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color, focused }) => <TabIcon name="map" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color, focused }) => <TabIcon name="tag" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="targets"
        options={{
          title: 'Targets',
          tabBarIcon: ({ color, focused }) => <TabIcon name="crosshair" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, focused }) => <TabIcon name="bar-chart-2" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabIcon name="user" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
