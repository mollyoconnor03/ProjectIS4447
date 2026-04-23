import AsyncStorage from '@react-native-async-storage/async-storage';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { Palette } from '@/constants/theme';
import { db } from '@/db/client';
import { activitiesTable, targetsTable, tripsTable, usersTable } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { useRouter } from 'expo-router';
import { useContext } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext, TripContext } from '../_layout';

export default function Profile() {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const tripContext = useContext(TripContext);

  if (!authContext?.user) return null;
  const { user } = authContext;

  const signOut = async () => {
    await AsyncStorage.removeItem('CURRENT_USER_ID');
    tripContext?.setTrips([]);
    authContext.setUser(null);
    router.replace('/(auth)/login');
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently erase your journal and all recorded expeditions. There is no return voyage.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDelete },
      ],
    );
  };

  const handleDelete = async () => {
    const userId = user.id;
    const userTrips = await db
      .select({ id: tripsTable.id })
      .from(tripsTable)
      .where(eq(tripsTable.userId, userId));
    const tripIds = userTrips.map((t) => t.id);
    if (tripIds.length > 0) {
      await db.delete(activitiesTable).where(inArray(activitiesTable.tripId, tripIds));
      await db.delete(targetsTable).where(inArray(targetsTable.tripId, tripIds));
    }
    await db.delete(tripsTable).where(eq(tripsTable.userId, userId));
    await db.delete(usersTable).where(eq(usersTable.id, userId));
    await AsyncStorage.removeItem('CURRENT_USER_ID');
    tripContext?.setTrips([]);
    authContext.setUser(null);
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.logoWrap}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      </View>
      <ScreenHeader title={user.name} subtitle={user.email} centered />
      <PrimaryButton label="Sign Out" variant="secondary" onPress={signOut} />
      <View style={styles.gap}>
        <PrimaryButton label="Delete Account" variant="danger" onPress={confirmDelete} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Palette.background,
    flex: 1,
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    height: 130,
    width: 240,
  },
  gap: {
    marginTop: 10,
  },
});
