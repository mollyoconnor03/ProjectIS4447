import { Category, AuthContext, CategoryContext } from '@/app/_layout';
import PrimaryButton from '@/components/ui/primary-button';
import { Palette } from '@/constants/theme';
import { db } from '@/db/client';
import { categoriesTable } from '@/db/schema';
import Ionicons from '@expo/vector-icons/Ionicons';
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
      <View style={[styles.accentBar, { backgroundColor: category.color }]} />
      <View style={styles.row}>
        <Ionicons name={category.icon as any} size={18} color={Palette.ink} style={styles.icon} />
        <Text style={styles.name}>{category.name}</Text>
      </View>
      <View style={styles.buttonRow}>
        <View style={styles.buttonWrap}>
          <PrimaryButton
            compact
            label="Edit"
            variant="secondary"
            onPress={() =>
              router.push({ pathname: '/category/[id]/edit', params: { id: category.id.toString() } })
            }
          />
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
    borderRadius: 0,
    borderWidth: 1.5,
    marginBottom: 14,
    overflow: 'hidden',
    paddingBottom: 16,
    paddingLeft: 20,
    paddingRight: 16,
    paddingTop: 16,
  },
  accentBar: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 3,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 2,
  },
  icon: {
    marginRight: 10,
  },
  name: {
    color: Palette.ink,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 16,
    letterSpacing: 0.1,
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
