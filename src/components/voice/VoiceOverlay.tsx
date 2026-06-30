import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { HelpCircle } from 'lucide-react-native';
import { useVoiceStore } from '@/stores/voiceStore';
import { useUiStore } from '@/stores/uiStore';
import { useVoiceAgentController } from '@/voice/useVoiceAgent';
import { MicButton } from './MicButton';
import { StatusBubble } from './StatusBubble';
import { CommandsSheet } from './CommandsSheet';

/**
 * Global, always-present voice overlay: floating mic + status bubble on the
 * right, a Commands button on the left (kept well away from the mic so it's
 * never mis-tapped). Mounted once in the authed layout. This component also
 * owns the agent lifecycle via useVoiceAgentController.
 */
// Matches the tab bar height set in app/(app)/_layout.tsx.
const TAB_BAR_HEIGHT = 64;
// Generous gap so the floating controls sit well above the tab bar even with
// SDK 54 edge-to-edge (the system nav bar can sit under/around the tab bar).
const CONTROL_GAP = 78;

export function VoiceOverlay({ bottomOffset }: { bottomOffset?: number }) {
  const { state, onMicPress } = useVoiceAgentController();
  const liveTranscript = useVoiceStore((s) => s.liveTranscript);
  const micPermission = useVoiceStore((s) => s.micPermission);
  const unavailable = useVoiceStore((s) => s.unavailable);
  const openCommands = useUiStore((s) => s.openCommands);
  const insets = useSafeAreaInsets();

  // Sit above the tab bar + the device's bottom safe-area inset so the
  // mic / Commands buttons never overlap the bottom navigation.
  const offset = bottomOffset ?? TAB_BAR_HEIGHT + insets.bottom + CONTROL_GAP;

  return (
    <>
      <View
        pointerEvents="box-none"
        className="absolute inset-x-0 bottom-0 top-0"
        style={{ paddingBottom: offset }}
      >
        {/* Commands button — bottom-left, away from the mic. */}
        <Pressable
          onPress={openCommands}
          className="absolute bottom-0 left-5 h-11 flex-row items-center gap-1.5 rounded-full border border-paper-card bg-white px-3.5 dark:border-ink-card dark:bg-ink-card"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          }}
        >
          <HelpCircle size={18} color="#5B8DEF" />
          <Text className="text-sm font-semibold text-ink dark:text-paper">
            Commands
          </Text>
        </Pressable>

        {/* Mic + status bubble — bottom-right. */}
        <View className="absolute bottom-0 right-5 items-end gap-2">
          {(state !== 'OFF' || micPermission === false) && !unavailable ? (
            <StatusBubble state={state} transcript={liveTranscript} />
          ) : null}
          {unavailable ? (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-[240px] rounded-2xl bg-calm-violet/15 px-3 py-2"
            >
              <Text className="text-xs font-medium text-calm-violet">
                Voice needs a development build — it isn’t available in Expo Go.
              </Text>
            </MotiView>
          ) : null}
          {micPermission === false && !unavailable ? (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-[240px] rounded-2xl bg-calm-rose/15 px-3 py-2"
            >
              <Text className="text-xs font-medium text-calm-rose">
                Microphone access is off. Enable it in Settings to use voice.
              </Text>
            </MotiView>
          ) : null}
          <MicButton state={state} onPress={onMicPress} />
        </View>
      </View>

      <CommandsSheet />
    </>
  );
}
