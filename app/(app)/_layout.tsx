import { View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import {
  Home,
  ListTodo,
  MessageCircle,
  BatteryMedium,
  Settings as SettingsIcon,
} from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/useTheme';
import { VoiceOverlay } from '@/components/voice/VoiceOverlay';

export default function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const { colors } = useTheme();

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.textFaint,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.cardBorder,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 6,
          } as never,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      >
        <Tabs.Screen
          name="today"
          options={{
            title: 'Today',
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: 'Tasks',
            tabBarIcon: ({ color, size }) => <ListTodo color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color, size }) => (
              <MessageCircle color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="energy"
          options={{
            title: 'Energy',
            tabBarIcon: ({ color, size }) => (
              <BatteryMedium color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <SettingsIcon color={color} size={size} />
            ),
          }}
        />
        {/* Reachable by voice + in-app links, hidden from the tab bar. */}
        <Tabs.Screen name="goals" options={{ href: null }} />
        <Tabs.Screen name="brief" options={{ href: null }} />
      </Tabs>

      {/* Global, always-present voice agent overlay. */}
      <VoiceOverlay />
    </View>
  );
}
