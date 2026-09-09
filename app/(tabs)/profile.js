import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { usePlayer } from '../../lib/PlayerContext';
import { theme } from '../../lib/theme';

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { session, displayName } = useAuth();
  const { leaveRoom } = usePlayer();

  async function signOut() {
    leaveRoom();
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  }

  return (
    <View style={[styles.page, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.h1}>{displayName}</Text>
      <Text style={styles.email}>{session?.user?.email}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>How syncing works</Text>
        <Text style={styles.cardBody}>
          The host's phone sends its exact position every second and a half. Your player
          compares that to where you are and quietly nudges itself back in line.
        </Text>
      </View>

      <Pressable onPress={signOut} style={styles.signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 20 },
  h1: { color: theme.text, fontSize: 28, fontWeight: '700' },
  email: { color: theme.muted, marginTop: 6 },
  card: {
    backgroundColor: theme.surface, borderRadius: theme.radius,
    padding: 18, marginTop: 28,
  },
  cardTitle: { color: theme.text, fontWeight: '600', marginBottom: 8 },
  cardBody: { color: theme.muted, lineHeight: 21 },
  signOut: {
    marginTop: 'auto', marginBottom: 24, borderWidth: 1, borderColor: theme.line,
    borderRadius: 999, paddingVertical: 14, alignItems: 'center',
  },
  signOutText: { color: theme.danger, fontWeight: '600' },
});
