import { CategoryContext } from '@/app/_layout';
import CategoryCard from '@/components/CategoryCard';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { Palette } from '@/constants/theme';
import Feather from '@expo/vector-icons/Feather';
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
      <ScreenHeader title="Categories" centered />

      <PrimaryButton label="Add Category" onPress={() => router.push('/category/add')} />

      {categories.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="tag" size={36} color={Palette.inkHint} />
          <Text style={styles.emptyText}>No categories yet. Give your travels some shape.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
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
  emptyText: {
    color: Palette.inkSecondary,
    fontFamily: 'DMSerifDisplay_400Regular',
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
    textAlign: 'center',
  },
});
