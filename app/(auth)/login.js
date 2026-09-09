import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import Field from '../../components/Field';
import { supabase } from '../../lib/supabase';
import { theme } from '../../lib/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setError('');
    if (!email || !password) return setError('Enter your email and password.');
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return setError(error.message);
    router.replace('/(tabs)/library');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.brand}>Jamify</Text>
        <Text style={styles.tag}>One song. Same second. Everyone.</Text>

        <View style={{ height: 40 }} />

        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          error={error}
        />

        <Pressable onPress={signIn} disabled={busy} style={[styles.cta, busy && { opacity: 0.6 }]}>
          <Text style={styles.ctaText}>{busy ? 'Signing in…' : 'Sign in'}</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.muted}>New here? </Text>
          <Link href="/(auth)/signup" style={styles.link}>Create an account</Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, backgroundColor: theme.bg, padding: 24, justifyContent: 'center' },
  brand: { color: theme.text, fontSize: 40, fontWeight: '700', letterSpacing: -1 },
  tag: { color: theme.accent, fontSize: 15, marginTop: 8 },
  cta: {
    backgroundColor: theme.accent,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaText: { color: '#221100', fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  muted: { color: theme.muted },
  link: { color: theme.sync, fontWeight: '600' },
});
