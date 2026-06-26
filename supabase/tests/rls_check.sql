-- ─────────────────────────────────────────────────────────────────────────────
-- RLS verification — proves a user CANNOT read another user's rows.
-- Run in the Supabase SQL editor (it uses service-role there) OR via psql.
-- We simulate two users by setting the JWT claims `request.jwt.claims`.
-- ─────────────────────────────────────────────────────────────────────────────

-- Use two real auth.users ids for this test (replace with ids from your project)
-- e.g. select id from auth.users limit 2;
\set user_a '00000000-0000-0000-0000-00000000000a'
\set user_b '00000000-0000-0000-0000-00000000000b'

-- Insert a task as user A (bypassing RLS as the table owner / service role):
insert into public.tasks (user_id, title) values (:'user_a', 'A secret task')
  on conflict do nothing;

-- Become user B (RLS now applies as anon role + jwt claim):
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'user_b', 'role', 'authenticated')::text,
  true
);

-- EXPECT: 0 rows. User B must not see User A's task.
select count(*) as should_be_zero
from public.tasks
where title = 'A secret task';

-- Become user A:
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'user_a', 'role', 'authenticated')::text,
  true
);

-- EXPECT: 1 row. User A sees their own task.
select count(*) as should_be_one
from public.tasks
where title = 'A secret task';

reset role;
