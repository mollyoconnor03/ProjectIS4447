import AsyncStorage from '@react-native-async-storage/async-storage';
import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { Palette } from '@/constants/theme';
import { db } from '@/db/client';
import { usersTable } from '@/db/schema';
import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { eq } from 'drizzle-orm';
import { AuthContext } from '../_layout';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let valid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');
    if (!name.trim()) { setNameError('Name is required.'); valid = false; }
    if (!email.trim()) { setEmailError('Email is required.'); valid = false; }
    else if (!EMAIL_RE.test(email.trim())) { setEmailError('Enter a valid email address.'); valid = false; }
    if (password.length < 6) { setPasswordError('Password must be at least 6 characters.'); valid = false; }
    return valid;
  };

  const register = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
      if (existing[0]) { setEmailError('An account with this email already exists.'); return; }
      const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
      const result = await db.insert(usersTable).values({ name: name.trim(), email: email.toLowerCase().trim(), passwordHash: hash, createdAt: new Date().toISOString() }).returning();
      const newUser = result[0];
      await AsyncStorage.setItem('CURRENT_USER_ID', String(newUser.id));
      authContext?.setUser({ id: newUser.id, name: newUser.name, email: newUser.email });
      router.replace('/(tabs)/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.eyebrow}>
          <Text style={styles.eyebrowText}>Your travel journal</Text>
        </View>

        <ScreenHeader title="A New Adventure Begins" subtitle="Create your travel journal." />

        <View style={styles.form}>
          <FormField label="Your Name" value={name} onChangeText={t => { setName(t); setNameError(''); }} placeholder="Jane Doe" error={nameError} />
          <FormField label="Email" value={email} onChangeText={t => { setEmail(t); setEmailError(''); }} placeholder="your@email.com" error={emailError} />
          <FormField label="Password" value={password} onChangeText={t => { setPassword(t); setPasswordError(''); }} secureTextEntry placeholder="At least 6 characters" error={passwordError} />
        </View>

        <PrimaryButton label={loading ? 'Creating journal…' : 'Create Journal'} onPress={register} />

        <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.linkRow} accessibilityLabel="Sign in to existing account" accessibilityRole="button">
          <Text style={styles.link}>Already have a journal? </Text>
          <Text style={[styles.link, styles.linkAccent]}>Sign in.</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Palette.background,
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  eyebrow: {
    marginBottom: 20,
  },
  eyebrowText: {
    color: Palette.inkHint,
    fontSize: 10,
    fontWeight: '600',
  },
  form: {
    marginBottom: 8,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  link: {
    color: Palette.inkSecondary,
    fontSize: 13,
  },
  linkAccent: {
    color: Palette.terracotta,
    fontWeight: '600',
  },
});
