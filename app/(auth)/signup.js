import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import Field from '../../components/Field';
import { supabase } from '../../lib/supabase';
import { theme } from '../../lib/theme';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function signUp() {
    setError(''); setNotice('');
    if (!name.trim()) return setError('Pick a name your friends will recognise.');
    if (password.length < 6) return setError('Use at least 6 characters.');
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: name.trim() } },
    });
    setBusy(false);
    if (error) return setError(error.message);
    if (data.session) return router.replace('/(tabs)/library');
    setNotice('Check your email to confirm the account, then sign in.');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.brand}>Create your account</Text>
        <Text style={styles.tag}>Then start a jam and send the code to a friend.</Text>

        <View style={{ height: 32 }} />

        <Field label="Display name" value={name} onChangeText={setName} placeholder="Shabir" />
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
          placeholder="At least 6 characters"
          error={error}
        />

        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        <Pressable onPress={signUp} disabled={busy} style={[styles.cta, busy && { opacity: 0.6 }]}>
          <Text style={styles.ctaText}>{busy ? 'Creating…' : 'Create account'}</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.muted}>Already have one? </Text>
          <Link href="/(auth)/login" style={styles.link}>Sign in</Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, backgroundColor: theme.bg, padding: 24, justifyContent: 'center' },
  brand: { color: theme.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.5 },
  tag: { color: theme.muted, fontSize: 15, marginTop: 8 },
  notice: { color: theme.sync, marginBottom: 14 },
  cta: {
    backgroundColor: theme.accent, borderRadius: 999, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  ctaText: { color: '#221100', fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  muted: { color: theme.muted },
  link: { color: theme.sync, fontWeight: '600' },
});
