import { Tabs } from 'expo-router';
import { View } from 'react-native';
import PlayerBar from '../../components/PlayerBar';
import { theme } from '../../lib/theme';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: theme.muted,
          tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopColor: theme.line,
            height: 58,
          },
          tabBarLabelStyle: { fontSize: 12, marginBottom: 8 },
          tabBarIconStyle: { display: 'none' },
          sceneStyle: { backgroundColor: theme.bg },
        }}
      >
        <Tabs.Screen name="library" options={{ title: 'Library' }} />
        <Tabs.Screen name="jam" options={{ title: 'Jam' }} />
        <Tabs.Screen name="profile" options={{ title: 'You' }} />
      </Tabs>
      <PlayerBar />
    </View>
  );
}
