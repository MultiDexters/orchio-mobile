import { Pressable, Text, View } from 'react-native';
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
export function VoiceOverlay({ bottomOffset = 92 }: { bottomOffset?: number }) {
  const { state, onMicPress } = useVoiceAgentController();
  const liveTranscript = useVoiceStore((s) => s.liveTranscript);
  const micPermission = useVoiceStore((s) => s.micPermission);
  const openCommands = useUiStore((s) => s.openCommands);

  return (
    <>
      <View
        pointerEvents="box-none"
        className="absolute inset-x-0 bottom-0 top-0"
        style={{ paddingBottom: bottomOffset }}
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
          {state !== 'OFF' || micPermission === false ? (
            <StatusBubble state={state} transcript={liveTranscript} />
          ) : null}
          {micPermission === false ? (
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
