-- ============================================================
-- Carebridge Patient Portal — Supabase Database Setup
-- Paste this into the Supabase SQL editor and run it.
-- ============================================================

-- Patient invitations (admin creates these)
create table if not exists patient_invitations (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  patient_id text not null,
  patient_name text not null,
  patient_email text,
  coordinator_id text,
  coordinator_name text,
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '30 days',
  used_at timestamptz,
  status text default 'pending'
);

-- Messages between coordinator and patient
create table if not exists patient_messages (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references patient_invitations(id),
  patient_id text not null,
  sender_role text not null,
  sender_name text not null,
  content text not null,
  created_at timestamptz default now(),
  read_at timestamptz
);

-- Patient location pings
create table if not exists patient_locations (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references patient_invitations(id),
  patient_id text not null,
  latitude double precision,
  longitude double precision,
  accuracy double precision,
  city text,
  country text,
  recorded_at timestamptz default now()
);

-- Enable RLS on all tables
alter table patient_invitations enable row level security;
alter table patient_messages enable row level security;
alter table patient_locations enable row level security;

-- Policies
create policy "patients can read own invitation by token"
  on patient_invitations for select
  using (true);

create policy "patients can update own invitation"
  on patient_invitations for update
  using (true);

create policy "allow insert invitations"
  on patient_invitations for insert
  with check (true);

create policy "allow all on messages"
  on patient_messages for all
  using (true);

create policy "allow all on locations"
  on patient_locations for all
  using (true);
