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

export default function Login() {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setSubmitError('');
    if (!email.trim()) { setEmailError('Email is required.'); valid = false; }
    else if (!EMAIL_RE.test(email.trim())) { setEmailError('Enter a valid email address.'); valid = false; }
    if (!password) { setPasswordError('Password is required.'); valid = false; }
    return valid;
  };

  const signIn = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const rows = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
      if (!rows[0]) { setSubmitError('No account found for that email.'); return; }
      const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
      if (hash !== rows[0].passwordHash) { setSubmitError('Password is incorrect.'); return; }
      await AsyncStorage.setItem('CURRENT_USER_ID', String(rows[0].id));
      authContext?.setUser({ id: rows[0].id, name: rows[0].name, email: rows[0].email });
      router.replace('/(tabs)/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.eyebrow}>
          <Text style={styles.eyebrowText}>YOUR TRAVEL JOURNAL</Text>
        </View>

        <ScreenHeader title="Welcome Back" subtitle="Sign in to continue your journey." />

        <View style={styles.form}>
          <FormField label="Email" value={email} onChangeText={t => { setEmail(t); setEmailError(''); setSubmitError(''); }} placeholder="your@email.com" error={emailError} />
          <FormField label="Password" value={password} onChangeText={t => { setPassword(t); setPasswordError(''); setSubmitError(''); }} secureTextEntry error={passwordError} />
          {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}
        </View>

        <PrimaryButton label={loading ? 'Signing in…' : 'Sign In'} onPress={signIn} />

        <Pressable onPress={() => router.push('/(auth)/register')} style={styles.linkRow}>
          <Text style={styles.link}>New here? </Text>
          <Text style={[styles.link, styles.linkAccent]}>Begin your journey.</Text>
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
    letterSpacing: 2,
  },
  form: {
    marginBottom: 8,
  },
  submitError: {
    color: Palette.danger,
    fontSize: 13,
    marginBottom: 12,
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
