import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import IndexScreen from '../app/(tabs)/index';
import { TripContext, CategoryContext } from '../app/_layout';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(null),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSegments: () => [],
  useFocusEffect: () => {},
  Stack: { Screen: () => null },
}));

jest.mock('@expo/vector-icons/Feather', () => {
  const { View } = require('react-native');
  return () => <View />;
});

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native');
  return () => <View />;
});

jest.mock('../db/client', () => ({
  db: {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

jest.mock('../db/schema', () => ({ activitiesTable: {} }));
jest.mock('drizzle-orm', () => ({ inArray: jest.fn() }));

const seededTrips = [
  {
    id: 1,
    name: "Kate's Hen Party",
    destination: 'Alicante, Spain',
    startDate: '2026-03-14',
    endDate: '2026-03-17',
    notes: null,
    accommodationName: null,
    accommodationCost: null,
    activityCount: 7,
    latitude: null,
    longitude: null,
    country: 'Spain',
    userId: 1,
  },
  {
    id: 2,
    name: 'Girls Holiday',
    destination: 'Split, Croatia',
    startDate: '2026-02-06',
    endDate: '2026-02-12',
    notes: null,
    accommodationName: null,
    accommodationCost: null,
    activityCount: 7,
    latitude: null,
    longitude: null,
    country: 'Croatia',
    userId: 1,
  },
];

function renderWithContext() {
  return render(
    <TripContext.Provider value={{ trips: seededTrips, refreshTrips: jest.fn() }}>
      <CategoryContext.Provider value={{ categories: [], refreshCategories: jest.fn() }}>
        <IndexScreen />
      </CategoryContext.Provider>
    </TripContext.Provider>
  );
}

describe('Trips list screen (integration)', () => {
  it('displays seeded trip names after database initialisation', async () => {
    const { getByText } = renderWithContext();
    await waitFor(() => {
      expect(getByText("Kate's Hen Party")).toBeTruthy();
      expect(getByText('Girls Holiday')).toBeTruthy();
    });
  });

  it('displays the destination for each seeded trip', async () => {
    const { getByText } = renderWithContext();
    await waitFor(() => {
      expect(getByText('Alicante, Spain')).toBeTruthy();
      expect(getByText('Split, Croatia')).toBeTruthy();
    });
  });

  it('shows an empty state when no trips are seeded', () => {
    const { getByText } = render(
      <TripContext.Provider value={{ trips: [], refreshTrips: jest.fn() }}>
        <CategoryContext.Provider value={{ categories: [], refreshCategories: jest.fn() }}>
          <IndexScreen />
        </CategoryContext.Provider>
      </TripContext.Provider>
    );
    expect(getByText('No trips yet. The world is waiting.')).toBeTruthy();
  });
});
