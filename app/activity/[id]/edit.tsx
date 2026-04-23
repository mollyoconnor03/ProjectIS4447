import DateField from '@/components/ui/date-field';
import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { Palette } from '@/constants/theme';
import { db } from '@/db/client';
import { activitiesTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, AuthContext, CategoryContext, TripContext } from '../../_layout';

function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function EditActivity() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const catContext = useContext(CategoryContext);
  const tripContext = useContext(TripContext);

  const [activity, setActivity] = useState<Activity | null>(null);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [date, setDate] = useState(new Date());
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categoryError, setCategoryError] = useState('');
  const [startTime, setStartTime] = useState('');
  const [location, setLocation] = useState('');
  const [cost, setCost] = useState('');
  const [participants, setParticipants] = useState('');
  const [notes, setNotes] = useState('');
  const [durationHrs, setDurationHrs] = useState('');
  const [durationMins, setDurationMins] = useState('');
  const [durationError, setDurationError] = useState('');

  useEffect(() => {
    db.select()
      .from(activitiesTable)
      .where(eq(activitiesTable.id, Number(id)))
      .then(rows => {
        if (!rows[0]) return;
        const a = rows[0];
        setName(a.name);
        setDate(new Date(a.date + 'T12:00:00'));
        setCategoryId(a.categoryId);
        setStartTime(a.startTime ?? '');
        setLocation(a.location ?? '');
        setCost(a.cost ?? '');
        setParticipants(a.participants ?? '');
        setNotes(a.notes ?? '');
        if (a.durationMins) {
          setDurationHrs(String(Math.floor(a.durationMins / 60)));
          setDurationMins(String(a.durationMins % 60));
        }
        setActivity(a);
      });
  }, [id]);

  if (!activity) return null;

  const categories = catContext?.categories ?? [];

  const saveChanges = async () => {
    let valid = true;
    if (!name.trim()) { setNameError('Activity name is required.'); valid = false; } else { setNameError(''); }
    if (categoryId === null) { setCategoryError('Please select a category.'); valid = false; } else { setCategoryError(''); }
    const totalMins = parseInt(durationHrs || '0') * 60 + parseInt(durationMins || '0');
    if (isNaN(totalMins) || totalMins <= 0) { setDurationError('Duration is required.'); valid = false; } else { setDurationError(''); }
    if (!valid) return;

    await db
      .update(activitiesTable)
      .set({
        name: name.trim(),
        categoryId,
        date: toLocalDate(date),
        startTime: startTime.trim() || null,
        location: location.trim() || null,
        cost: cost.trim() || null,
        participants: participants.trim() || null,
        notes: notes.trim() || null,
        durationMins: (durationHrs || durationMins) ? (parseInt(durationHrs || '0') * 60 + parseInt(durationMins || '0')) : null,
      })
      .where(eq(activitiesTable.id, Number(id)));

    if (authContext?.user) await tripContext?.refreshTrips(authContext.user.id);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: '' }} />
      <ScreenHeader title="Edit Activity" subtitle={name} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <FormField
          label="Activity Name"
          value={name}
          onChangeText={text => { setName(text); if (nameError) setNameError(''); }}
          error={nameError}
        />

        <DateField label="Date" date={date} onChange={setDate} />

        <Text style={styles.sectionLabel}>Category</Text>
        {categories.length === 0 ? (
          <Text style={styles.hint}>No categories yet. Add one in the Categories tab.</Text>
        ) : (
          <View style={styles.pillRow}>
            {categories.map(cat => {
              const selected = categoryId === cat.id;
              return (
                <Pressable key={cat.id} onPress={() => { setCategoryId(cat.id); if (categoryError) setCategoryError(''); }} accessibilityLabel={`Select category: ${cat.name}`} accessibilityRole="radio" accessibilityState={{ checked: categoryId === cat.id }}>
                  <View style={[styles.pill, selected ? { borderColor: cat.color, borderWidth: 1 } : styles.pillInactive]}>
                    <View style={[styles.pillDot, { backgroundColor: cat.color }]} />
                    <Text style={[styles.pillLabel, selected && styles.pillLabelSelected]}>{cat.name}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
        {categoryError ? <Text style={styles.fieldError}>{categoryError}</Text> : null}

        <Text style={styles.sectionLabel}>Duration</Text>
        <View style={styles.durationRow}>
          <View style={styles.durationField}>
            <TextInput
              style={styles.durationInput}
              value={durationHrs}
              onChangeText={t => { setDurationHrs(t); if (durationError) setDurationError(''); }}
              placeholder="0"
              placeholderTextColor={Palette.inkHint}
              keyboardType="number-pad"
              accessibilityLabel="Duration hours"
            />
            <Text style={styles.durationUnit}>h</Text>
          </View>
          <View style={styles.durationField}>
            <TextInput
              style={styles.durationInput}
              value={durationMins}
              onChangeText={t => { setDurationMins(t); if (durationError) setDurationError(''); }}
              placeholder="0"
              placeholderTextColor={Palette.inkHint}
              keyboardType="number-pad"
              accessibilityLabel="Duration minutes"
            />
            <Text style={styles.durationUnit}>m</Text>
          </View>
        </View>
        {durationError ? <Text style={styles.fieldError}>{durationError}</Text> : null}

        <FormField label="Start Time (optional)" value={startTime} onChangeText={setStartTime} placeholder="e.g. 10:00 AM" />
        <FormField label="Location (optional)" value={location} onChangeText={setLocation} placeholder="e.g. Colosseum, Rome" />
        <FormField label="Cost (optional)" value={cost} onChangeText={setCost} placeholder="e.g. €25" />
        <FormField label="Participants (optional)" value={participants} onChangeText={setParticipants} placeholder="e.g. Sarah, Tom" />
        <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Any notes..." multiline />

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
  hint: {
    color: Palette.inkSecondary,
    fontSize: 13,
    marginBottom: 16,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  pill: {
    alignItems: 'center',
    borderRadius: 0,
    borderWidth: 0.5,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillInactive: {
    borderColor: Palette.border,
  },
  pillDot: {
    height: 7,
    width: 7,
  },
  pillLabel: {
    color: Palette.inkSecondary,
    fontSize: 13,
  },
  pillLabelSelected: {
    color: Palette.ink,
    fontWeight: '600',
  },
  fieldError: {
    color: Palette.danger,
    fontSize: 12,
    marginBottom: 12,
    marginTop: -4,
  },
  gap: {
    marginTop: 10,
  },
  optional: {
    color: Palette.inkHint,
    fontWeight: '400',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  durationField: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  durationInput: {
    backgroundColor: Palette.cardBackground,
    borderColor: Palette.border,
    borderWidth: 0.5,
    color: Palette.ink,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: 64,
  },
  durationUnit: {
    color: Palette.inkSecondary,
    fontSize: 14,
  },
});
