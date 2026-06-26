import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, Send, MessageSquareHeart } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChatBubble } from '@/components/chat/ChatBubble';
import {
  useChatMessages,
  useChatRealtime,
  useSendChat,
} from '@/hooks/useChat';
import { useVoiceStore } from '@/stores/voiceStore';
import { pressVoiceMic } from '@/voice/useVoiceAgent';
import { toast } from '@/stores/toastStore';
import type { ChatMessage } from '@/types';

export default function Chat() {
  const messages = useChatMessages();
  const send = useSendChat();
  useChatRealtime();

  const [text, setText] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const voiceState = useVoiceStore((s) => s.state);

  const data = messages.data ?? [];

  useEffect(() => {
    if (data.length > 0) {
      requestAnimationFrame(() =>
        listRef.current?.scrollToEnd({ animated: true }),
      );
    }
  }, [data.length]);

  const onSend = () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    send.mutate(t, { onError: (e) => toast((e as Error).message, 'error') });
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-paper dark:bg-ink">
      <View className="px-5 pb-2 pt-2">
        <Text className="text-3xl font-bold text-ink dark:text-paper">Chat</Text>
        <Text className="text-sm text-ink/50 dark:text-paper/50">
          Talk or type — I’ll reply out loud and remember what matters.
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        className="flex-1"
      >
        {messages.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#5B8DEF" />
          </View>
        ) : data.length === 0 ? (
          <EmptyState
            icon={<MessageSquareHeart size={36} color="#8A95A5" />}
            title="Say hi to Orchio"
            subtitle="Tap the mic and start talking, or type below. Try “I’m feeling a bit drained today.”"
          />
        ) : (
          <FlatList
            ref={listRef}
            data={data}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => <ChatBubble message={item} />}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Composer */}
        <View className="flex-row items-center gap-2 border-t border-paper-card bg-paper px-4 py-2.5 dark:border-ink-card dark:bg-ink">
          <Pressable
            onPress={pressVoiceMic}
            className="h-11 w-11 items-center justify-center rounded-2xl bg-ink/5 active:opacity-70 dark:bg-paper/10"
          >
            <Mic
              size={20}
              color={voiceState === 'AWAKE' ? '#3FBF9F' : '#5B8DEF'}
            />
          </Pressable>
          <View className="flex-1">
            <Input
              value={text}
              onChangeText={setText}
              placeholder="Message Orchio…"
              returnKeyType="send"
              onSubmitEditing={onSend}
            />
          </View>
          <Pressable
            onPress={onSend}
            disabled={send.isPending || !text.trim()}
            className="h-11 w-11 items-center justify-center rounded-2xl bg-brand active:bg-brand-deep disabled:opacity-40"
          >
            {send.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Send size={18} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
