import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import TrackRow from '../../components/TrackRow';
import { CATALOG } from '../../lib/catalog';
import { supabase } from '../../lib/supabase';
import { usePlayer } from '../../lib/PlayerContext';
import { useAuth } from '../../lib/AuthContext';
import { theme } from '../../lib/theme';

export default function Library() {
  const insets = useSafeAreaInsets();
  const { track, loadTrack, room, isHost } = usePlayer();
  const { session } = useAuth();
  const [uploads, setUploads] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { fetchUploads(); }, []);

  async function fetchUploads() {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return;
    setUploads(
      (data ?? []).map((t) => ({
        id: t.id, title: t.title, artist: t.artist || 'You', url: t.url, art: '#3A3350',
      }))
    );
  }

  async function pickAndUpload() {
    const res = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
    if (res.canceled) return;
    const file = res.assets[0];
    setBusy(true);
    try {
      const body = await (await fetch(file.uri)).arrayBuffer();
      const path = `${session.user.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from('songs')
        .upload(path, body, { contentType: file.mimeType || 'audio/mpeg' });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from('songs').getPublicUrl(path);
      const { error: dbErr } = await supabase.from('tracks').insert({
        title: file.name.replace(/\.[^.]+$/, ''),
        artist: session.user.user_metadata?.display_name || 'You',
        url: pub.publicUrl,
        owner: session.user.id,
      });
      if (dbErr) throw dbErr;
      await fetchUploads();
    } catch (e) {
      Alert.alert('Upload failed', e.message ?? 'Try a smaller file.');
    } finally {
      setBusy(false);
    }
  }

  const locked = room && !isHost;
  const data = [...uploads, ...CATALOG];

  return (
    <View style={[styles.page, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.h1}>Library</Text>
      <Text style={styles.sub}>
        {locked ? 'The host picks the song while you are in a jam.' : 'Tap a song to play it.'}
      </Text>

      <Pressable onPress={pickAndUpload} disabled={busy} style={styles.upload}>
        <Text style={styles.uploadText}>{busy ? 'Uploading…' : '+  Add a song from your phone'}</Text>
      </Pressable>

      <FlatList
        data={data}
        keyExtractor={(t) => String(t.id)}
        renderItem={({ item }) => (
          <TrackRow
            track={item}
            active={track?.id === item.id}
            onPress={() => (locked ? null : loadTrack(item))}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 20 },
  h1: { color: theme.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  sub: { color: theme.muted, marginTop: 6, marginBottom: 18 },
  upload: {
    borderWidth: 1, borderColor: theme.line, borderStyle: 'dashed',
    borderRadius: theme.radius, paddingVertical: 14, alignItems: 'center', marginBottom: 12,
  },
  uploadText: { color: theme.sync, fontWeight: '500' },
  sep: { height: 1, backgroundColor: theme.line, opacity: 0.5 },
});
