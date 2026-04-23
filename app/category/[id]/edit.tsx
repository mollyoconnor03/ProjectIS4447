import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { Palette } from '@/constants/theme';
import { db } from '@/db/client';
import { categoriesTable } from '@/db/schema';
import Ionicons from '@expo/vector-icons/Ionicons';
import { eq } from 'drizzle-orm';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext, CategoryContext } from '../../_layout';

const COLOR_SWATCHES = [
  '#FF6B6B',
  '#FF9F43',
  '#FECA57',
  '#48DBFB',
  '#1DD1A1',
  '#54A0FF',
  '#5F27CD',
  '#FF9FF3',
  '#00D2D3',
  '#FF6B81',
];

const ICON_OPTIONS = [
  'camera',
  'map',
  'compass',
  'cafe',
  'sunny',
  'musical-notes',
  'bicycle',
  'restaurant',
  'wine',
  'boat',
] as const;

export default function EditCategory() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const catContext = useContext(CategoryContext);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [color, setColor] = useState(COLOR_SWATCHES[0]);
  const [icon, setIcon] = useState<string>(ICON_OPTIONS[2]);

  const category = catContext?.categories.find(c => c.id === Number(id));

  useEffect(() => {
    if (!category) return;
    setName(category.name);
    setColor(category.color);
    setIcon(category.icon);
  }, [category]);

  if (!catContext || !category) return null;

  const saveChanges = async () => {
    if (!name.trim()) {
      setNameError('Category name is required.');
      return;
    }
    setNameError('');
    await db
      .update(categoriesTable)
      .set({ name: name.trim(), color, icon })
      .where(eq(categoriesTable.id, Number(id)));
    if (authContext?.user) await catContext.refreshCategories(authContext.user.id);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: '' }} />
      <ScreenHeader title="Edit Category" subtitle={`Update ${category.name}`} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <FormField
          label="Category Name"
          value={name}
          onChangeText={text => { setName(text); if (nameError) setNameError(''); }}
          error={nameError}
        />

        <Text style={styles.sectionLabel}>Colour</Text>
        <View style={styles.swatchRow}>
          {COLOR_SWATCHES.map(swatch => (
            <Pressable key={swatch} onPress={() => setColor(swatch)} accessibilityLabel={`Select colour ${swatch}`} accessibilityRole="radio" accessibilityState={{ checked: color === swatch }}>
              <View style={[styles.swatch, { backgroundColor: swatch }, color === swatch ? styles.swatchSelected : styles.swatchUnselected]} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Icon</Text>
        <View style={styles.iconRow}>
          {ICON_OPTIONS.map(opt => (
            <Pressable key={opt} onPress={() => setIcon(opt)} accessibilityLabel={`Select icon ${opt}`} accessibilityRole="radio" accessibilityState={{ checked: icon === opt }}>
              <View style={[styles.iconButton, icon === opt ? styles.iconSelected : styles.iconUnselected]}>
                <Ionicons name={opt as any} size={22} color={icon === opt ? Palette.ink : Palette.inkHint} />
              </View>
            </Pressable>
          ))}
        </View>

        <PrimaryButton label="Save Changes" onPress={saveChanges} />
        <View style={styles.gap}>
          <PrimaryButton label="Cancel" variant="secondary" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Palette.background,
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  sectionLabel: {
    color: Palette.inkSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 10,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  swatch: {
    height: 34,
    width: 34,
  },
  swatchSelected: {
    borderColor: Palette.ink,
    borderWidth: 2,
  },
  swatchUnselected: {
    borderWidth: 0,
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  iconButton: {
    alignItems: 'center',
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  iconSelected: {
    borderColor: Palette.ink,
    borderWidth: 1,
  },
  iconUnselected: {
    borderColor: Palette.border,
    borderWidth: 0.5,
  },
  gap: {
    marginTop: 10,
  },
});
