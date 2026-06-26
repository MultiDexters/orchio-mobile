import { supabase, invokeFunction } from '@/lib/supabase';
import type { ChatMessage, ChatResponse } from '@/types';
import { pluralize } from '@/utils/strings';

export async function listMessages(limit = 100): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

/**
 * Send a message to the `chat` edge function. The function persists both the
 * user message and the assistant reply to chat_messages, extracts any
 * tasks/notes/goals/feelings, and returns a clean (JSON-stripped) reply.
 */
export async function sendChatMessage(message: string): Promise<ChatResponse> {
  return invokeFunction<ChatResponse>('chat', { message });
}

/** Build a short toast string from the saved counts, or null if nothing. */
export function savedSummary(res: ChatResponse): string | null {
  const s = res.saved;
  if (!s) return null;
  const parts: string[] = [];
  if (s.tasks) parts.push(pluralize(s.tasks, 'task'));
  if (s.goals) parts.push(pluralize(s.goals, 'goal'));
  if (s.notes) parts.push(pluralize(s.notes, 'note'));
  if (s.feelings) parts.push(pluralize(s.feelings, 'feeling'));
  if (parts.length === 0) return null;
  return `Filed ${parts.join(', ')}`;
}
