import { Pressable, Text, View } from 'react-native';
import { Volume2, Square } from 'lucide-react-native';
import type { ChatMessage } from '@/types';
import { usePlaybackStore } from '@/stores/playbackStore';
import { stripMarkdown } from '@/utils/markdown';
import { cn } from '@/utils/cn';

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const playingId = usePlaybackStore((s) => s.playingId);
  const toggle = usePlaybackStore((s) => s.toggle);
  const isPlaying = playingId === message.id;

  // Display stripped markdown so the UI matches what gets read aloud.
  const display = stripMarkdown(message.content) || message.content;

  return (
    <View className={cn('mb-3 w-full', isUser ? 'items-end' : 'items-start')}>
      <View
        className={cn(
          'max-w-[84%] rounded-2xl px-3.5 py-2.5',
          isUser
            ? 'rounded-br-md bg-brand'
            : 'rounded-bl-md border border-paper-card bg-white dark:border-ink-card dark:bg-ink-card',
        )}
      >
        <Text
          className={cn(
            'text-[15px] leading-5',
            isUser ? 'text-white' : 'text-ink dark:text-paper',
          )}
        >
          {display}
        </Text>
      </View>

      <Pressable
        onPress={() => toggle(message.id, message.content)}
        hitSlop={8}
        className={cn(
          'mt-1 flex-row items-center gap-1 px-1',
          isUser ? 'flex-row-reverse' : '',
        )}
      >
        {isPlaying ? (
          <Square size={13} color="#5B8DEF" fill="#5B8DEF" />
        ) : (
          <Volume2 size={14} color="#8A95A5" />
        )}
        <Text className="text-xs font-medium text-ink/45 dark:text-paper/45">
          {isPlaying ? 'Stop' : 'Listen'}
        </Text>
      </Pressable>
    </View>
  );
}
