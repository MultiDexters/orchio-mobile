-- ─────────────────────────────────────────────────────────────────────────────
-- Orchio mobile: enable Supabase Realtime on chat_messages.
--
-- The shared Orchio schema already has RLS on every table and Realtime enabled
-- for `plans`, but NOT for `chat_messages`. The mobile Chat screen live-refreshes
-- when the voice agent saves a message, which uses Realtime on chat_messages.
--
-- Run this ONCE against the shared project (Supabase Dashboard → SQL Editor).
-- It is safe and additive; it does not touch the web app's tables or data.
-- (The app also invalidates its query cache directly, so this is a nice-to-have.)
-- ─────────────────────────────────────────────────────────────────────────────

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;
