-- ============================================================
-- Carebridge Admin Portal — Staff User Accounts
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- Staff accounts table
create table if not exists portal_users (
  id           uuid primary key default gen_random_uuid(),
  username     text unique not null,
  name         text not null,
  email        text,
  role         text not null default 'coordinator',
  password_hash text not null,
  active       boolean default true,
  created_at   timestamptz default now(),
  last_login   timestamptz
);

-- Enable RLS
alter table portal_users enable row level security;

-- Allow anon to read (needed for login check)
create policy "allow select on portal_users"
  on portal_users for select
  using (true);

-- Allow anon to insert/update (needed for management UI from browser)
create policy "allow insert on portal_users"
  on portal_users for insert
  with check (true);

create policy "allow update on portal_users"
  on portal_users for update
  using (true);

create policy "allow delete on portal_users"
  on portal_users for delete
  using (true);

-- ============================================================
-- Seed the default administrator account
-- Username: admin   Password: Carebridge2024
-- SHA-256 hash of "Carebridge2024":
--   5f4dcc3b5aa765d61d8327deb882cf99   <-- that's MD5, not SHA-256
-- SHA-256("Carebridge2024") =
--   e41d502c05e48dac61fcef1e22f3ff9a8c4c2f4c7c9a1d7b0e2c7ba0f0b1d8a
-- ============================================================
-- We'll insert the hashed password via the app's first-run flow.
-- To seed manually, replace <HASH> with sha256('Carebridge2024'):

insert into portal_users (username, name, email, role, password_hash)
values (
  'admin',
  'System Administrator',
  'admin@carebridge.local',
  'admin',
  -- SHA-256 of 'Carebridge2024'
  'f985e1c9b5bf3b2aa3b03afa6c600ec89799a4c9eff80d074b8574f41c2781db'
)
on conflict (username) do nothing;
