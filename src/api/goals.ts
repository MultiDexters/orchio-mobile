import { supabase, requireUserId } from '@/lib/supabase';
import type { Goal } from '@/types';

export async function listGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Goal[];
}

export async function createGoal(
  title: string,
  description?: string,
): Promise<Goal> {
  const user_id = await requireUserId();
  const { data, error } = await supabase
    .from('goals')
    .insert({ user_id, title, description: description ?? null })
    .select('*')
    .single();
  if (error) throw error;
  return data as Goal;
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) throw error;
}
