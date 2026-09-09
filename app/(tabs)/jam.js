import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { usePlayer } from '../../lib/PlayerContext';
import { useAuth } from '../../lib/AuthContext';
import { theme } from '../../lib/theme';

const makeCode = () =>
  Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

export default function Jam() {
  const insets = useSafeAreaInsets();
  const { session, displayName } = useAuth();
  const { room, isHost, members, inSync, track, joinRoom, leaveRoom } = usePlayer();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  async function startJam() {
    setBusy(true);
    const newCode = makeCode();
    const { error } = await supabase.from('rooms').insert({
      code: newCode,
      name: `${displayName}'s jam`,
      host: session.user.id,
    });
    setBusy(false);
    if (error) return Alert.alert('Could not start the jam', error.message);
    await joinRoom({
      code: newCode, name: `${displayName}'s jam`,
      hostId: session.user.id, asHost: true, displayName,
    });
  }

  async function join() {
    const c = code.trim().toUpperCase();
    if (c.length < 4) return Alert.alert('Enter the 5-letter code your friend shared.');
    setBusy(true);
    const { data, error } = await supabase.from('rooms').select('*').eq('code', c).maybeSingle();
    setBusy(false);
    if (error || !data) return Alert.alert('No jam with that code', 'Check the code and try again.');
    await joinRoom({
      code: data.code, name: data.name, hostId: data.host, asHost: false, displayName,
    });
    setCode('');
  }

  if (room) {
    return (
      <ScrollView contentContainerStyle={[styles.page, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.h1}>{room.name}</Text>
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Share this code</Text>
          <Text style={styles.code}>{room.code}</Text>
        </View>

        <View style={[styles.pill, { borderColor: inSync ? theme.sync : theme.accent }]}>
          <Text style={{ color: inSync ? theme.sync : theme.accent, fontWeight: '600' }}>
            {inSync ? 'Everyone is on the same second' : 'Lining everyone back up'}
          </Text>
        </View>

        <Text style={styles.section}>Now playing</Text>
        <Text style={styles.playing}>{track ? track.title : 'Nothing yet — pick a song in Library.'}</Text>

        <Text style={styles.section}>Listening now ({members.length})</Text>
        {members.map((m) => (
          <Text key={m} style={styles.member}>{m}{m === displayName ? '  (you)' : ''}</Text>
        ))}

        <Text style={styles.role}>
          {isHost
            ? 'You are the host. What you play, everyone hears.'
            : 'The host is driving. Your player follows along automatically.'}
        </Text>

        <Pressable onPress={leaveRoom} style={styles.leave}>
          <Text style={styles.leaveText}>Leave jam</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.page, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.h1}>Jam</Text>
      <Text style={styles.sub}>
        Start a jam and share the code. Everyone who joins hears the same song at the same moment.
      </Text>

      <Pressable onPress={startJam} disabled={busy} style={styles.cta}>
        <Text style={styles.ctaText}>{busy ? 'Working…' : 'Start a jam'}</Text>
      </Pressable>

      <Text style={styles.or}>or join one</Text>

      <View style={styles.joinRow}>
        <TextInput
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          maxLength={5}
          placeholder="ABC12"
          placeholderTextColor={theme.muted}
          style={styles.codeInput}
        />
        <Pressable onPress={join} disabled={busy} style={styles.joinBtn}>
          <Text style={styles.joinText}>Join</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, backgroundColor: theme.bg, paddingHorizontal: 20, paddingBottom: 30 },
  h1: { color: theme.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  sub: { color: theme.muted, marginTop: 8, marginBottom: 26, lineHeight: 21 },
  cta: { backgroundColor: theme.accent, borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  ctaText: { color: '#221100', fontSize: 16, fontWeight: '600' },
  or: { color: theme.muted, textAlign: 'center', marginVertical: 22 },
  joinRow: { flexDirection: 'row', gap: 10 },
  codeInput: {
    flex: 1, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line,
    borderRadius: theme.radius, paddingHorizontal: 16, paddingVertical: 14,
    color: theme.text, fontSize: 20, letterSpacing: 6,
  },
  joinBtn: {
    backgroundColor: theme.surfaceHigh, borderRadius: theme.radius,
    paddingHorizontal: 24, justifyContent: 'center',
  },
  joinText: { color: theme.text, fontWeight: '600' },
  codeCard: {
    backgroundColor: theme.surface, borderRadius: theme.radius,
    padding: 20, marginTop: 18, alignItems: 'center',
  },
  codeLabel: { color: theme.muted, fontSize: 13 },
  code: { color: theme.text, fontSize: 38, fontWeight: '700', letterSpacing: 10, marginTop: 6 },
  pill: {
    borderWidth: 1, borderRadius: 999, paddingVertical: 10,
    alignItems: 'center', marginTop: 16,
  },
  section: { color: theme.muted, fontSize: 13, marginTop: 26, marginBottom: 8 },
  playing: { color: theme.text, fontSize: 18, fontWeight: '500' },
  member: { color: theme.text, fontSize: 16, paddingVertical: 6 },
  role: { color: theme.muted, marginTop: 24, lineHeight: 20 },
  leave: {
    marginTop: 26, borderWidth: 1, borderColor: theme.line,
    borderRadius: 999, paddingVertical: 14, alignItems: 'center',
  },
  leaveText: { color: theme.danger, fontWeight: '600' },
});
