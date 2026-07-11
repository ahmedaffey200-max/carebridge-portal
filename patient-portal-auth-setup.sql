-- ============================================================
-- Carebridge Patient Portal — Auth Setup SQL
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1. Performance indexes for token and email lookups
create index if not exists idx_patient_invitations_token
  on patient_invitations(token);

create index if not exists idx_patient_invitations_email
  on patient_invitations(patient_email);

-- 2. New columns for password-based auth
alter table patient_invitations
  add column if not exists password_set boolean default false;

alter table patient_invitations
  add column if not exists auth_user_id uuid;

-- 3. Index for fast lookup by auth_user_id
create index if not exists idx_patient_invitations_auth_user
  on patient_invitations(auth_user_id);

-- ============================================================
-- Row Level Security policies (run these only if RLS is
-- enabled on patient_invitations — check in Table Editor)
-- ============================================================

-- Allow anyone (anon) to read an invitation by token (existing portal behaviour)
-- This policy may already exist; skip if it conflicts.
-- create policy "Anyone can read invitation by token" on patient_invitations
--   for select using (true);

-- Allow authenticated patients to read their own invitation by auth_user_id
-- create policy "Patients can read own invitation" on patient_invitations
--   for select using (auth_user_id = auth.uid());

-- Allow authenticated patients to update their invitation when completing signup
-- (needed if RLS is ON and you are not using the Edge Function for the update)
-- create policy "Patients can complete their own signup" on patient_invitations
--   for update
--   using  (patient_email = auth.email() and password_set = false)
--   with check (patient_email = auth.email());

-- ============================================================
-- Optional: patient_messages table (if not yet created)
-- ============================================================
-- create table if not exists patient_messages (
--   id            uuid primary key default gen_random_uuid(),
--   invitation_id uuid references patient_invitations(id) on delete cascade,
--   patient_id    text not null,
--   sender_role   text not null check (sender_role in ('patient','coordinator')),
--   sender_name   text,
--   content       text not null,
--   read_at       timestamptz,
--   created_at    timestamptz default now()
-- );

-- ============================================================
-- Optional: patient_locations table (if not yet created)
-- ============================================================
-- create table if not exists patient_locations (
--   id            uuid primary key default gen_random_uuid(),
--   invitation_id uuid references patient_invitations(id) on delete cascade,
--   patient_id    text not null,
--   latitude      double precision,
--   longitude     double precision,
--   accuracy      double precision,
--   city          text,
--   country       text,
--   recorded_at   timestamptz default now()
-- );
