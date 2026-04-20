import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { Palette } from '@/constants/theme';
import { db } from '@/db/client';
import { categoriesTable } from '@/db/schema';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext, CategoryContext } from '../_layout';

const COLOR_SWATCHES = [
  '#2D6A8F',
  '#1B2A4A',
  '#8B1A1A',
  '#2D7A4F',
  '#7A5C2D',
  '#6B2D7A',
  '#2D6B7A',
  '#7A2D5C',
  '#4A7A2D',
  '#7A6B2D',
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

export default function AddCategory() {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const catContext = useContext(CategoryContext);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [color, setColor] = useState(COLOR_SWATCHES[0]);
  const [icon, setIcon] = useState<string>(ICON_OPTIONS[2]);

  const saveCategory = async () => {
    if (!name.trim()) {
      setNameError('Category name is required.');
      return;
    }
    setNameError('');
    await db.insert(categoriesTable).values({
      name: name.trim(),
      color,
      icon,
      userId: authContext?.user?.id ?? null,
    });
    if (authContext?.user) await catContext?.refreshCategories(authContext.user.id);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Add Category" subtitle="Tag your activities." />
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
            <Pressable key={swatch} onPress={() => setColor(swatch)}>
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: swatch },
                  color === swatch ? styles.swatchSelected : styles.swatchUnselected,
                ]}
              />
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Icon</Text>
        <View style={styles.iconRow}>
          {ICON_OPTIONS.map(opt => (
            <Pressable key={opt} onPress={() => setIcon(opt)}>
              <View style={[styles.iconButton, icon === opt ? styles.iconSelected : styles.iconUnselected]}>
                <Ionicons
                  name={opt as any}
                  size={22}
                  color={icon === opt ? Palette.navy : Palette.slate}
                />
              </View>
            </Pressable>
          ))}
        </View>

        <PrimaryButton label="Save Category" onPress={saveCategory} />
        <View style={styles.cancelButton}>
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
    color: Palette.navy,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  swatch: {
    height: 36,
    width: 36,
  },
  swatchSelected: {
    borderColor: Palette.ink,
    borderWidth: 3,
  },
  swatchUnselected: {
    borderColor: Palette.border,
    borderWidth: 1.5,
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  iconButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  iconSelected: {
    backgroundColor: Palette.tagBackground,
    borderColor: Palette.navy,
    borderWidth: 2,
  },
  iconUnselected: {
    borderColor: Palette.border,
    borderWidth: 1.5,
  },
  cancelButton: {
    marginTop: 10,
  },
});
