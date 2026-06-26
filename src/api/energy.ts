import { supabase, invokeFunction } from '@/lib/supabase';
import type { EnergyLevel, EnergyLog } from '@/types';

export async function listEnergy(limit = 30): Promise<EnergyLog[]> {
  const { data, error } = await supabase
    .from('energy_logs')
    .select('*')
    .order('logged_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as EnergyLog[];
}

export interface LogEnergyInput {
  level: EnergyLevel;
  mood?: string | null;
  note?: string | null;
}

/**
 * Insert an energy log via the `energy` edge function so all energy writes
 * go through one server-side path (validation + future side effects).
 */
export async function logEnergy(input: LogEnergyInput): Promise<EnergyLog> {
  const res = await invokeFunction<{ log: EnergyLog }>('energy', {
    energy_level: input.level,
    mood: input.mood ?? null,
    note: input.note ?? null,
  });
  return res.log;
}

export function latestEnergy(logs: EnergyLog[]): EnergyLog | null {
  return logs.length > 0 ? logs[0] : null;
}
