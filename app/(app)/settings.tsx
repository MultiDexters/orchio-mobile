import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  LogOut,
  Mic,
  Moon,
  Sun,
  SunMoon,
  Target,
  Sparkles,
  Volume2,
  ChevronRight,
} from 'lucide-react-native';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore, type ThemePref } from '@/stores/settingsStore';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/theme/useTheme';
import { getVoiceAgent } from '@/voice/agentSingleton';
import { cn } from '@/utils/cn';

function Row({
  icon,
  label,
  hint,
  right,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center gap-3 py-3"
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-ink/5 dark:bg-paper/10">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-medium text-ink dark:text-paper">
          {label}
        </Text>
        {hint ? (
          <Text className="text-xs text-ink/45 dark:text-paper/45">{hint}</Text>
        ) : null}
      </View>
      {right}
    </Pressable>
  );
}

const THEMES: { key: ThemePref; label: string; icon: React.ReactNode }[] = [
  { key: 'system', label: 'System', icon: <SunMoon size={16} color="#5B8DEF" /> },
  { key: 'light', label: 'Light', icon: <Sun size={16} color="#F2B441" /> },
  { key: 'dark', label: 'Dark', icon: <Moon size={16} color="#9B8CFF" /> },
];

export default function Settings() {
  const router = useRouter();
  const profile = useProfile();
  const signOut = useAuthStore((s) => s.signOut);
  const { colors } = useTheme();

  const s = useSettingsStore();

  return (
    <ScreenContainer className="px-0">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-1 mt-2 text-3xl font-bold text-ink dark:text-paper">
          Settings
        </Text>
        <Text className="mb-4 text-sm text-ink/50 dark:text-paper/50">
          {profile.data?.full_name
            ? `Signed in as ${profile.data.full_name}`
            : 'Your preferences'}
        </Text>

        {/* Appearance */}
        <Text className="mb-2 ml-1 text-xs font-bold uppercase tracking-wide text-ink/40 dark:text-paper/40">
          Appearance
        </Text>
        <Card className="mb-4">
          <View className="flex-row gap-2">
            {THEMES.map((t) => (
              <Pressable
                key={t.key}
                onPress={() => s.setTheme(t.key)}
                className={cn(
                  'flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5',
                  s.theme === t.key
                    ? 'bg-brand/15'
                    : 'bg-ink/5 dark:bg-paper/10',
                )}
              >
                {t.icon}
                <Text
                  className={cn(
                    'text-sm font-semibold',
                    s.theme === t.key
                      ? 'text-brand'
                      : 'text-ink/60 dark:text-paper/60',
                  )}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Voice */}
        <Text className="mb-2 ml-1 text-xs font-bold uppercase tracking-wide text-ink/40 dark:text-paper/40">
          Voice agent
        </Text>
        <Card className="mb-4 py-1">
          <Row
            icon={<Mic size={18} color="#5B8DEF" />}
            label="Voice control"
            hint="Always-listening, hands-free agent"
            right={
              <Switch
                value={s.voiceEnabled}
                onValueChange={(v) => {
                  s.setVoiceEnabled(v);
                  if (!v) void getVoiceAgent().stop();
                }}
                trackColor={{ true: colors.brand }}
              />
            }
          />
          <View className="h-px bg-paper-card dark:bg-ink-card" />
          <Row
            icon={<Sparkles size={18} color="#3FBF9F" />}
            label="Wake-word detection"
            hint="Use Porcupine when configured"
            right={
              <Switch
                value={s.wakeWordEnabled}
                onValueChange={s.setWakeWordEnabled}
                trackColor={{ true: colors.brand }}
              />
            }
          />
          <View className="h-px bg-paper-card dark:bg-ink-card" />
          <Row
            icon={<Volume2 size={18} color="#F2B441" />}
            label="Acknowledge on wake"
            hint="Say “Yes?” when I wake up"
            right={
              <Switch
                value={s.acknowledgeOnWake}
                onValueChange={s.setAcknowledgeOnWake}
                trackColor={{ true: colors.brand }}
              />
            }
          />
        </Card>

        {/* Speech rate */}
        <Card className="mb-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-[15px] font-medium text-ink dark:text-paper">
              Speaking rate
            </Text>
            <Text className="text-sm font-semibold text-brand">
              {s.ttsRate.toFixed(1)}×
            </Text>
          </View>
          <View className="flex-row gap-2">
            {[0.8, 0.9, 1.0, 1.1, 1.2].map((r) => (
              <Pressable
                key={r}
                onPress={() => s.setTtsRate(r)}
                className={cn(
                  'flex-1 items-center rounded-xl py-2',
                  Math.abs(s.ttsRate - r) < 0.01
                    ? 'bg-brand/15'
                    : 'bg-ink/5 dark:bg-paper/10',
                )}
              >
                <Text
                  className={cn(
                    'text-xs font-semibold',
                    Math.abs(s.ttsRate - r) < 0.01
                      ? 'text-brand'
                      : 'text-ink/55 dark:text-paper/55',
                  )}
                >
                  {r.toFixed(1)}×
                </Text>
              </Pressable>
            ))}
          </View>
          <Button
            label="Test voice"
            variant="secondary"
            className="mt-3"
            onPress={() =>
              void getVoiceAgent().speakOneShot(
                "Hi, I'm Orchio. This is how I sound.",
              )
            }
          />
        </Card>

        {/* More */}
        <Text className="mb-2 ml-1 text-xs font-bold uppercase tracking-wide text-ink/40 dark:text-paper/40">
          More
        </Text>
        <Card className="mb-4 py-1">
          <Row
            icon={<Target size={18} color="#9B8CFF" />}
            label="Goals"
            onPress={() => router.navigate('/(app)/goals')}
            right={<ChevronRight size={18} color={colors.textFaint} />}
          />
          <View className="h-px bg-paper-card dark:bg-ink-card" />
          <Row
            icon={<Sparkles size={18} color="#F2B441" />}
            label="Morning brief"
            onPress={() => router.navigate('/(app)/brief')}
            right={<ChevronRight size={18} color={colors.textFaint} />}
          />
        </Card>

        <Button
          label="Sign out"
          variant="danger"
          icon={<LogOut size={18} color="#E8657A" />}
          onPress={() => void signOut()}
        />
      </ScrollView>
    </ScreenContainer>
  );
}
