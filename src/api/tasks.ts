import { supabase, requireUserId, invokeFunction } from '@/lib/supabase';
import type { EnergyCost, Task, TaskSource, TaskStatus } from '@/types';
import { toEnergyCost } from '@/utils/energy';

export async function listTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('status', { ascending: true })
    .order('importance', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Task[];
}

export interface NewTaskInput {
  title: string;
  energy_cost?: EnergyCost;
  importance?: number;
  deadline?: string | null;
  estimated_minutes?: number;
  source?: TaskSource;
}

export async function createTask(input: NewTaskInput): Promise<Task> {
  const user_id = await requireUserId();
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id,
      title: input.title,
      energy_cost: toEnergyCost(input.energy_cost ?? 'moderate'),
      importance: input.importance ?? 3,
      deadline: input.deadline ?? null,
      estimated_minutes: input.estimated_minutes ?? 30,
      status: 'pending',
      source: input.source ?? 'manual',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Task;
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatus,
): Promise<void> {
  const { error } = await supabase.from('tasks').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

/** Top tasks via the `tasks` edge function (server-curated selection). */
export async function fetchTopTasks(limit = 3): Promise<Task[]> {
  const res = await invokeFunction<{ top: Task[] }>('tasks', { limit });
  return res.top ?? [];
}

/** Pure, client-side ranking used as a fallback / for the UI. */
export function rankTopTasks(tasks: Task[], limit = 3): Task[] {
  const active = tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'cancelled',
  );
  return [...active]
    .sort((a, b) => {
      // deadline urgency first, then importance
      const ad = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const bd = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      if (ad !== bd) return ad - bd;
      return b.importance - a.importance;
    })
    .slice(0, limit);
}
