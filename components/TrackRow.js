import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../lib/theme';

export default function TrackRow({ track, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <View style={[styles.art, { backgroundColor: track.art || theme.surfaceHigh }]}>
        <Text style={styles.artGlyph}>{track.title.slice(0, 1)}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={[styles.title, active && { color: theme.accent }]} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
      </View>
      {active ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  art: { width: 52, height: 52, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  artGlyph: { color: theme.text, fontSize: 20, fontWeight: '600', opacity: 0.75 },
  meta: { flex: 1, marginLeft: 14 },
  title: { color: theme.text, fontSize: 16, fontWeight: '500' },
  artist: { color: theme.muted, fontSize: 13, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent },
});
