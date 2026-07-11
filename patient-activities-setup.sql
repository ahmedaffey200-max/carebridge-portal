-- Carebridge Patient Activities Table
-- Run this in Supabase SQL Editor

create table if not exists patient_activities (
  id uuid primary key default gen_random_uuid(),
  patient_id text not null,
  activity_type text not null,
  title text not null,
  description text,
  old_value text,
  new_value text,
  created_at timestamptz default now(),
  created_by text
);

alter table patient_activities enable row level security;

drop policy if exists "allow all on patient_activities" on patient_activities;
create policy "allow all on patient_activities"
  on patient_activities for all
  using (true)
  with check (true);

create index if not exists idx_patient_activities_patient_id on patient_activities(patient_id);
create index if not exists idx_patient_activities_created_at on patient_activities(created_at desc);
