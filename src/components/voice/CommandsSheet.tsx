import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { MotiView } from 'moti';
import {
  X,
  Compass,
  BatteryMedium,
  CalendarRange,
  Volume2,
  MessagesSquare,
  Moon,
} from 'lucide-react-native';
import { useUiStore } from '@/stores/uiStore';
import { useTheme } from '@/theme/useTheme';

interface Group {
  title: string;
  icon: React.ReactNode;
  items: { say: string; does: string }[];
}

const GROUPS: Group[] = [
  {
    title: 'Wake me',
    icon: <Volume2 size={18} color="#5B8DEF" />,
    items: [
      { say: '“Hi” / “Hey” / “Hi Orch”', does: 'Wake the agent, then speak' },
      { say: '“Hi, plan my day”', does: 'Wake + run a command in one breath' },
    ],
  },
  {
    title: 'Navigate',
    icon: <Compass size={18} color="#5B8DEF" />,
    items: [
      { say: '“Go to tasks / energy / chat”', does: 'Open a screen' },
      { say: '“Show me my goals”', does: 'Open Goals' },
      { say: '“Take me to today”', does: 'Open the Today home' },
    ],
  },
  {
    title: 'Energy',
    icon: <BatteryMedium size={18} color="#3FBF9F" />,
    items: [
      { say: '“Log energy 4” / “Energy level 3”', does: 'Log a number 1–5' },
      { say: '“I’m feeling low / drained / peak”', does: 'Log it + chat about it' },
    ],
  },
  {
    title: 'Planning',
    icon: <CalendarRange size={18} color="#F2B441" />,
    items: [
      { say: '“Plan my day”', does: 'Generate a day plan + brief' },
      { say: '“Reshuffle my plan”', does: 'Regenerate the plan' },
    ],
  },
  {
    title: 'Read aloud',
    icon: <Volume2 size={18} color="#9B8CFF" />,
    items: [
      { say: '“What’s my top three?”', does: 'Read your top tasks' },
      { say: '“Read my brief”', does: 'Read the morning brief' },
    ],
  },
  {
    title: 'Just talk',
    icon: <MessagesSquare size={18} color="#5B8DEF" />,
    items: [
      { say: 'Anything else', does: 'I reply out loud & save it to Chat' },
    ],
  },
  {
    title: 'Control',
    icon: <Moon size={18} color="#5E6B7C" />,
    items: [
      { say: '“Stop listening” / “Go to sleep”', does: 'Back to wake-word only' },
      { say: '“What can you do?”', does: 'Open this sheet' },
    ],
  },
];

export function CommandsSheet() {
  const open = useUiStore((s) => s.commandsOpen);
  const close = useUiStore((s) => s.closeCommands);
  const { colors } = useTheme();

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
      <Pressable
        onPress={close}
        className="flex-1 justify-end bg-black/40"
      >
        <Pressable onPress={() => {}}>
          <MotiView
            from={{ translateY: 40, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{ type: 'timing', duration: 240 }}
            className="max-h-[80%] rounded-t-3xl bg-paper px-5 pb-8 pt-4 dark:bg-ink"
          >
            <View className="mb-3 flex-row items-center justify-between">
              <View>
                <Text className="text-xl font-bold text-ink dark:text-paper">
                  Voice commands
                </Text>
                <Text className="text-sm text-ink/50 dark:text-paper/50">
                  Say “Hi” to wake me, then try any of these.
                </Text>
              </View>
              <Pressable
                onPress={close}
                className="h-9 w-9 items-center justify-center rounded-full bg-ink/5 dark:bg-paper/10"
              >
                <X size={18} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {GROUPS.map((g) => (
                <View key={g.title} className="mb-4">
                  <View className="mb-2 flex-row items-center gap-2">
                    {g.icon}
                    <Text className="text-sm font-bold uppercase tracking-wide text-ink/60 dark:text-paper/60">
                      {g.title}
                    </Text>
                  </View>
                  {g.items.map((it) => (
                    <View
                      key={it.say}
                      className="mb-1.5 rounded-2xl border border-paper-card bg-white px-3.5 py-2.5 dark:border-ink-card dark:bg-ink-card"
                    >
                      <Text className="text-[15px] font-semibold text-ink dark:text-paper">
                        {it.say}
                      </Text>
                      <Text className="text-xs text-ink/50 dark:text-paper/50">
                        {it.does}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          </MotiView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
