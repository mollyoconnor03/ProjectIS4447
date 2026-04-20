import {
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_700Bold,
  useFonts,
} from '@expo-google-fonts/playfair-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activitiesTable, categoriesTable, tripsTable, usersTable } from '@/db/schema';
import { Palette } from '@/constants/theme';
import { count, eq } from 'drizzle-orm';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { createContext, useCallback, useEffect, useState } from 'react';
import { db } from '../db/client';

SplashScreen.preventAutoHideAsync();

export type AuthUser = { id: number; name: string; email: string };
type AuthContextType = {
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
};
export const AuthContext = createContext<AuthContextType | null>(null);

export type Trip = {
  id: number;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  notes: string | null;
  activityCount?: number;
};

type TripContextType = {
  trips: Trip[];
  setTrips: React.Dispatch<React.SetStateAction<Trip[]>>;
  refreshTrips: (userId: number) => Promise<void>;
};

export const TripContext = createContext<TripContextType | null>(null);

export type Category = {
  id: number;
  name: string;
  color: string;
  icon: string;
  userId: number | null;
};

type CategoryContextType = {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  refreshCategories: (userId: number) => Promise<void>;
};

export const CategoryContext = createContext<CategoryContextType | null>(null);

export type Activity = {
  id: number;
  tripId: number;
  categoryId: number | null;
  name: string;
  date: string;
  startTime: string | null;
  location: string | null;
  cost: string | null;
  participants: string | null;
  notes: string | null;
};

function useProtectedRoute(user: AuthUser | null, authLoaded: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!authLoaded) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/');
    }
  }, [user, segments, authLoaded]);
}

export default function RootLayout() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loaded, fontError] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_400Regular_Italic,
  });

  const refreshTrips = useCallback(async (userId: number) => {
    const rows = await db.select().from(tripsTable).where(eq(tripsTable.userId, userId));
    if (rows.length === 0) {
      setTrips([]);
      return;
    }
    const countRows = await db
      .select({ tripId: activitiesTable.tripId, total: count() })
      .from(activitiesTable)
      .groupBy(activitiesTable.tripId);
    const countMap: Record<number, number> = {};
    for (const c of countRows) countMap[c.tripId] = c.total;
    setTrips(rows.map(r => ({ ...r, activityCount: countMap[r.id] ?? 0 })));
  }, []);

  const refreshCategories = useCallback(async (userId: number) => {
    const rows = await db.select().from(categoriesTable).where(eq(categoriesTable.userId, userId));
    setCategories(rows);
  }, []);

  useEffect(() => {
    if ((loaded || fontError) && authLoaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded, fontError, authLoaded]);

  useEffect(() => {
    const checkSession = async () => {
      const stored = await AsyncStorage.getItem('CURRENT_USER_ID');
      if (stored) {
        const rows = await db.select().from(usersTable).where(eq(usersTable.id, Number(stored)));
        if (rows[0]) {
          const u = { id: rows[0].id, name: rows[0].name, email: rows[0].email };
          setUser(u);
          await refreshTrips(rows[0].id);
          await refreshCategories(rows[0].id);
        }
      }
      setAuthLoaded(true);
    };
    checkSession();
  }, []);

  useProtectedRoute(user, authLoaded);

  if (!loaded && !fontError) return null;

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <TripContext.Provider value={{ trips, setTrips, refreshTrips }}>
        <CategoryContext.Provider value={{ categories, setCategories, refreshCategories }}>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: Palette.background },
              headerShadowVisible: false,
              headerTitleStyle: {
                fontFamily: 'PlayfairDisplay_700Bold',
                fontSize: 18,
                color: Palette.ink,
              },
              headerTintColor: Palette.navy,
              headerBackTitle: '',
              contentStyle: { backgroundColor: Palette.background },
            }}
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </CategoryContext.Provider>
      </TripContext.Provider>
    </AuthContext.Provider>
  );
}
