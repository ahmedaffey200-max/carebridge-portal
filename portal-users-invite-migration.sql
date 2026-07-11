-- ============================================================
-- Carebridge Admin Portal — Invite-link columns migration
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- Run ONCE after portal-users-setup.sql has already been run
-- ============================================================

alter table portal_users add column if not exists invite_token      text unique;
alter table portal_users add column if not exists invite_expires_at timestamptz;
alter table portal_users add column if not exists password_set      boolean default true;

-- Mark all existing accounts (they already have passwords)
update portal_users set password_set = true where invite_token is null;
