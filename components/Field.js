import { StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../lib/theme';

export default function Field({ label, error, ...props }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.muted}
        style={[styles.input, error && { borderColor: theme.danger }]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: theme.muted, fontSize: 13, marginBottom: 6 },
  input: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: theme.radius,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: theme.text,
    fontSize: 16,
  },
  error: { color: theme.danger, fontSize: 12, marginTop: 6 },
});
