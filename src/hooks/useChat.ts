import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { listMessages, sendChatMessage } from '@/api/chat';
import { useAuthStore } from '@/stores/authStore';

export function useChatMessages() {
  return useQuery({ queryKey: qk.chat, queryFn: () => listMessages() });
}

export function useSendChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => sendChatMessage(message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.chat });
      // brain-dump extraction may have created tasks/goals/notes/energy
      qc.invalidateQueries({ queryKey: qk.tasks });
      qc.invalidateQueries({ queryKey: qk.goals });
      qc.invalidateQueries({ queryKey: qk.energy });
    },
  });
}

/**
 * Live-refresh chat when rows are inserted (e.g. the voice agent saved a
 * message from another part of the app). Mount once on the Chat screen.
 */
export function useChatRealtime() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`chat:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: qk.chat });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);
}
