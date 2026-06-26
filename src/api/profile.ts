import { supabase, requireUserId } from '@/lib/supabase';
import type { Preferences, Profile } from '@/types';

export async function getProfile(): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

export async function getPreferences(): Promise<Preferences | null> {
  const { data, error } = await supabase
    .from('preferences')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return (data as Preferences) ?? null;
}

export async function upsertPreferences(
  patch: Partial<Omit<Preferences, 'user_id' | 'updated_at'>>,
): Promise<Preferences> {
  const user_id = await requireUserId();
  const { data, error } = await supabase
    .from('preferences')
    .upsert(
      { user_id, ...patch, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )
    .select('*')
    .single();
  if (error) throw error;
  return data as Preferences;
}
