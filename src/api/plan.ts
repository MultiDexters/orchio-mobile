import { supabase, invokeFunction } from '@/lib/supabase';
import type { Plan } from '@/types';
import { todayDateString } from '@/utils/strings';

export async function getPlan(date = todayDateString()): Promise<Plan | null> {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('plan_date', date)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as Plan) ?? null;
}

/**
 * Generate or reshuffle today's plan via the `plan` edge function (OpenAI).
 * Returns the freshly created plan including the morning_brief.
 */
export async function generatePlan(reshuffle = false): Promise<Plan> {
  const res = await invokeFunction<{ plan: Plan }>('plan', {
    date: todayDateString(),
    reshuffle,
  });
  return res.plan;
}
