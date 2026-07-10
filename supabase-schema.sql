-- ============================================================
-- Carebridge Portal — Supabase schema
-- Run this once in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Portal state (single JSON blob — all patients, hospitals, financials, etc.)
create table if not exists portal_state (
  id text primary key default 'main',
  state jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- Row Level Security: only authenticated users can read/write
alter table portal_state enable row level security;

create policy "auth_select" on portal_state
  for select to authenticated using (true);

create policy "auth_insert" on portal_state
  for insert to authenticated with check (true);

create policy "auth_update" on portal_state
  for update to authenticated using (true);

-- 2. Seed an empty state row so upsert always has something to update
insert into portal_state (id, state)
values ('main', '{}')
on conflict (id) do nothing;
