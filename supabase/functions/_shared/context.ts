import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

export interface UserContext {
  name: string | null;
  work_hours: string; // derived "07:00-23:00"
  peak_hours: number[];
  default_energy: number; // derived from recent logs
  activeTasks: {
    id: string;
    title: string;
    energy_cost: string;
    importance: number;
    deadline: string | null;
    estimated_minutes: number | null;
    status: string;
  }[];
  recentEnergy: { energy_level: number; mood: string | null; logged_at: string }[];
  todayPlan: { morning_brief: string | null; blocks: unknown } | null;
  recentMessages: { role: string; content: string }[];
  goals: { title: string; description: string | null }[];
}

const todayISODate = () => new Date().toISOString().slice(0, 10);
const hhmm = (t: string | null | undefined, fallback: string) =>
  (t ?? fallback).slice(0, 5);

/** Gather everything the AI needs to be useful, scoped to the user via RLS. */
export async function gatherContext(
  db: SupabaseClient,
  userId: string,
): Promise<UserContext> {
  const [profile, prefs, tasks, energy, plan, messages, goals] =
    await Promise.all([
      db.from('profiles').select('full_name').eq('id', userId).maybeSingle(),
      db
        .from('preferences')
        .select('wake_time, sleep_time, peak_hours')
        .eq('user_id', userId)
        .maybeSingle(),
      db
        .from('tasks')
        .select('id,title,energy_cost,importance,deadline,estimated_minutes,status')
        .not('status', 'in', '("completed","cancelled")')
        .order('importance', { ascending: false })
        .limit(25),
      db
        .from('energy_logs')
        .select('energy_level,mood,logged_at')
        .order('logged_at', { ascending: false })
        .limit(5),
      db
        .from('plans')
        .select('morning_brief, blocks')
        .eq('plan_date', todayISODate())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      db
        .from('chat_messages')
        .select('role, content')
        .order('created_at', { ascending: false })
        .limit(10),
      db.from('goals').select('title, description').eq('is_active', true).limit(10),
    ]);

  const recentEnergy = energy.data ?? [];
  const avgEnergy =
    recentEnergy.length > 0
      ? Math.round(
          recentEnergy.reduce((s, e) => s + (e.energy_level ?? 3), 0) /
            recentEnergy.length,
        )
      : 3;

  return {
    name: profile.data?.full_name ?? null,
    work_hours: `${hhmm(prefs.data?.wake_time, '09:00')}-${hhmm(prefs.data?.sleep_time, '17:00')}`,
    peak_hours: prefs.data?.peak_hours ?? [9, 10, 11],
    default_energy: avgEnergy,
    activeTasks: tasks.data ?? [],
    recentEnergy,
    todayPlan: plan.data ?? null,
    recentMessages: (messages.data ?? []).reverse(),
    goals: goals.data ?? [],
  };
}
