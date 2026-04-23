import { Category, AuthContext, CategoryContext } from '@/app/_layout';
import PrimaryButton from '@/components/ui/primary-button';
import { Palette } from '@/constants/theme';
import { db } from '@/db/client';
import { categoriesTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useRouter } from 'expo-router';
import { useContext } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

type Props = {
  category: Category;
};

export default function CategoryCard({ category }: Props) {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const catContext = useContext(CategoryContext);

  const confirmDelete = () => {
    Alert.alert(
      'Delete Category',
      'Are you sure? Activities using this category will lose their category.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDelete },
      ]
    );
  };

  const handleDelete = async () => {
    await db.delete(categoriesTable).where(eq(categoriesTable.id, category.id));
    if (authContext?.user) await catContext?.refreshCategories(authContext.user.id);
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: category.color }]} />
        <Text style={styles.name}>{category.name}</Text>
      </View>
      <View style={styles.buttonRow}>
        <View style={styles.buttonWrap}>
          <PrimaryButton compact label="Edit" variant="secondary" onPress={() =>
            router.push({ pathname: '/category/[id]/edit', params: { id: category.id.toString() } })
          } />
        </View>
        <View style={styles.buttonWrap}>
          <PrimaryButton compact label="Delete" variant="danger" onPress={confirmDelete} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.cardBackground,
    borderColor: Palette.border,
    borderWidth: 1,
    elevation: 2,
    marginBottom: 10,
    paddingBottom: 14,
    paddingHorizontal: 18,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 2,
  },
  dot: {
    height: 8,
    marginRight: 8,
    width: 8,
  },
  name: {
    color: Palette.ink,

    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  buttonWrap: {
    flex: 1,
  },
});
