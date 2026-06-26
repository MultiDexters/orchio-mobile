import { Text, View } from 'react-native';
import { MotiView } from 'moti';
import { statusCopy, type VoiceAgentState } from '@/stores/voiceStore';
import { cn } from '@/utils/cn';

const DOT: Record<VoiceAgentState, string> = {
  OFF: 'bg-ink/30 dark:bg-paper/30',
  ARMED: 'bg-brand',
  AWAKE: 'bg-calm-mint',
  THINKING: 'bg-calm-violet',
  SPEAKING: 'bg-calm-amber',
};

export function StatusBubble({
  state,
  transcript,
}: {
  state: VoiceAgentState;
  transcript?: string;
}) {
  const copy = statusCopy(state);
  const showTranscript = state === 'AWAKE' && Boolean(transcript);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 200 }}
      className="max-w-[260px] rounded-2xl border border-paper-card bg-white px-3.5 py-2.5 dark:border-ink-card dark:bg-ink-card"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      }}
    >
      <View className="flex-row items-center gap-2">
        <View className={cn('h-2 w-2 rounded-full', DOT[state])} />
        <Text className="text-sm font-semibold text-ink dark:text-paper">
          {copy.title}
        </Text>
      </View>
      {showTranscript ? (
        <Text
          numberOfLines={3}
          className="mt-1 text-xs leading-4 text-ink/60 dark:text-paper/60"
        >
          {transcript}
        </Text>
      ) : (
        <Text className="mt-0.5 text-xs text-ink/45 dark:text-paper/45">
          {copy.subtitle}
        </Text>
      )}
    </MotiView>
  );
}
