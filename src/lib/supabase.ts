import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Single Supabase client for the whole app.
 * - Session is persisted to AsyncStorage and auto-refreshed.
 * - detectSessionInUrl is false (we're not on the web auth-redirect flow).
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 5,
    },
  },
});

/** Convenience: get the current user id or throw a clear error. */
export async function requireUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Not authenticated');
  }
  return user.id;
}

/**
 * Invoke a Supabase Edge Function with the current user's JWT attached.
 * `supabase.functions.invoke` already forwards the session token, but we
 * surface errors in a consistent shape.
 */
export async function invokeFunction<T>(
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body });
  if (error) {
    throw new Error(`[${name}] ${error.message ?? 'edge function failed'}`);
  }
  if (data == null) {
    throw new Error(`[${name}] empty response`);
  }
  return data;
}
