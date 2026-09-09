import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePlayer } from '../lib/PlayerContext';
import { theme } from '../lib/theme';

const fmt = (s) => {
  if (!s || Number.isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
};

export default function PlayerBar() {
  const { track, isPlaying, position, duration, togglePlay, room, isHost, inSync } = usePlayer();
  if (!track) return null;

  const pct = duration ? Math.min(100, (position / duration) * 100) : 0;
  const locked = room && !isHost;

  return (
    <View style={styles.wrap}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <View style={styles.body}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{track.title}</Text>
          <Text style={styles.sub}>
            {fmt(position)} / {fmt(duration)}
            {room ? (inSync ? '  ·  in sync' : '  ·  catching up') : ''}
          </Text>
        </View>
        <Pressable
          onPress={locked ? undefined : togglePlay}
          style={[styles.btn, locked && { opacity: 0.35 }]}
        >
          <Text style={styles.btnText}>{isPlaying ? 'Pause' : 'Play'}</Text>
        </Pressable>
      </View>
      {locked ? (
        <Text style={styles.note}>The host controls playback in this jam.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.line,
    paddingBottom: 8,
  },
  progressTrack: { height: 2, backgroundColor: theme.line },
  progressFill: { height: 2, backgroundColor: theme.accent },
  body: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  title: { color: theme.text, fontSize: 15, fontWeight: '500' },
  sub: { color: theme.muted, fontSize: 12, marginTop: 3 },
  btn: {
    backgroundColor: theme.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  btnText: { color: '#221100', fontWeight: '600' },
  note: { color: theme.muted, fontSize: 11, paddingHorizontal: 14, paddingBottom: 4 },
});
