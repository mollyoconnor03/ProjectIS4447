import { CategoryContext } from '@/app/_layout';
import CategoryCard from '@/components/CategoryCard';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { Palette } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useContext } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CategoriesScreen() {
  const router = useRouter();
  const context = useContext(CategoryContext);

  if (!context) return null;

  const { categories } = context;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Categories"
        subtitle={`${categories.length} ${categories.length !== 1 ? 'categories' : 'category'}`}
      />

      <PrimaryButton
        label="Add Category"
        onPress={() => router.push('/category/add')}
      />

      {categories.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={48} color={Palette.border} />
          <Text style={styles.emptyHeading}>No categories yet.</Text>
          <Text style={styles.emptyBody}>
            Add a category to organise your activities.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {categories.map(cat => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Palette.background,
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  listContent: {
    paddingBottom: 24,
    paddingTop: 14,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60,
    paddingHorizontal: 32,
  },
  emptyHeading: {
    color: Palette.ink,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    letterSpacing: 0.2,
    marginBottom: 10,
    marginTop: 20,
    textAlign: 'center',
  },
  emptyBody: {
    color: Palette.inkSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
