/**
 * Centralised, typed access to the public (EXPO_PUBLIC_*) environment.
 * Only client-safe values live here. Server secrets (OpenAI, service role)
 * never reach the app bundle — they live in Supabase Edge Function secrets.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    // We don't throw at import time so the app can still render a helpful
    // "not configured" message rather than a white screen.
    if (__DEV__) {
      console.warn(`[env] Missing ${name}. Set it in your .env file.`);
    }
    return '';
  }
  return value;
}

export const env = {
  supabaseUrl: required(
    'EXPO_PUBLIC_SUPABASE_URL',
    process.env.EXPO_PUBLIC_SUPABASE_URL,
  ),
  supabaseAnonKey: required(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  ),
  picovoiceAccessKey: process.env.EXPO_PUBLIC_PICOVOICE_ACCESS_KEY ?? '',
  /** 'ondevice' | 'deepgram' — which STT adapter to construct by default. */
  sttEngine: (process.env.EXPO_PUBLIC_STT_ENGINE ?? 'ondevice') as
    | 'ondevice'
    | 'deepgram',
  deepgramApiKey: process.env.EXPO_PUBLIC_DEEPGRAM_API_KEY ?? '',
};

export const isSupabaseConfigured = (): boolean =>
  Boolean(env.supabaseUrl) && Boolean(env.supabaseAnonKey);

export const isPicovoiceConfigured = (): boolean =>
  Boolean(env.picovoiceAccessKey);
