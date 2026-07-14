-- ============================================================
-- CareBridge Portal — Secure RLS Policy
-- Run this in Supabase: SQL Editor → New Query → Paste → Run
-- ============================================================
--
-- RESULT:
--   anon key      → READ only  (needed by agreement.html to check if already signed)
--   authenticated → FULL access (admin portal users who are logged in)
--   Edge functions → bypass RLS via service role key (agreement signing)
--
-- This means NO ONE can corrupt/overwrite patient data using the
-- anon key visible in the browser source code.
-- ============================================================

-- 1. Make sure RLS is on (safe to run even if already enabled)
ALTER TABLE portal_state ENABLE ROW LEVEL SECURITY;

-- 2. Remove any old policies
DROP POLICY IF EXISTS "portal_state_access" ON portal_state;
DROP POLICY IF EXISTS "authenticated_only"  ON portal_state;
DROP POLICY IF EXISTS "anon_read"           ON portal_state;
DROP POLICY IF EXISTS "auth_all"            ON portal_state;

-- 3. Anon users: read-only (allows agreement.html to check if already signed)
CREATE POLICY "anon_read" ON portal_state
  FOR SELECT
  TO anon
  USING (id = 'main');

-- 4. Authenticated users: full access (admin portal)
CREATE POLICY "auth_all" ON portal_state
  FOR ALL
  TO authenticated
  USING (id = 'main')
  WITH CHECK (id = 'main');
