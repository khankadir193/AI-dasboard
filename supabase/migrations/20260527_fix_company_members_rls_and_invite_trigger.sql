-- ============================================================
-- MIGRATION: Fix company_members RLS + invite-safe provisioning
-- ============================================================
-- Problem 1: company_members had no ENABLE ROW LEVEL SECURITY,
--            so all RLS policies on it were silently ignored and
--            the authenticated role had no table-level INSERT grant,
--            producing: "permission denied for table company_members".
--
-- Problem 2: handle_new_user() trigger always creates a new company
--            and profile on every signup, overwriting the invited
--            company_id that the invite acceptance flow writes later.
-- ============================================================

-- ============================================================
-- DIAGNOSTIC QUERIES (run manually to verify state before/after)
-- ============================================================
-- -- 1. RLS status
-- SELECT relname, relrowsecurity
-- FROM pg_class
-- WHERE relname = 'company_members';
--
-- -- 2. Existing policies on company_members
-- SELECT policyname, cmd, roles, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'company_members';
--
-- -- 3. Grants on company_members
-- SELECT grantee, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE table_name = 'company_members';
--
-- -- 4. Table owner
-- SELECT tableowner FROM pg_tables WHERE tablename = 'company_members';
-- ============================================================


-- ============================================================
-- FIX 1: Enable RLS on company_members
-- ============================================================
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- FIX 2: Ensure authenticated role has required table grants
-- ============================================================
GRANT SELECT, INSERT ON public.company_members TO authenticated;


-- ============================================================
-- FIX 3: Drop any pre-existing company_members policies that
--         may be incomplete or conflicting, then recreate cleanly.
-- ============================================================
DROP POLICY IF EXISTS "Users can view their own company memberships"  ON public.company_members;
DROP POLICY IF EXISTS "Users can insert their own company membership" ON public.company_members;
DROP POLICY IF EXISTS "Authenticated users can insert own membership" ON public.company_members;


-- SELECT: members can read only their own row
CREATE POLICY "company_members_select_own"
ON public.company_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());


-- INSERT: members can insert only a row where user_id = their own uid
-- This is the critical policy that was previously being ignored
-- because RLS was never enabled on the table.
CREATE POLICY "company_members_insert_own"
ON public.company_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());


-- ============================================================
-- FIX 4: Make the auto-provisioning trigger invite-aware.
--
-- The original handle_new_user() ALWAYS created a new company
-- and profile for every signup, including invited users.
-- This overrides the invite flow's upsert to company_id.
--
-- The fix: skip auto-provisioning when the signup carries
-- invite metadata (skip_provisioning = 'true' in user metadata),
-- OR when a profile row already exists for the user.
-- This is fully backwards-compatible: normal signups that do NOT
-- set skip_provisioning continue to get auto-provisioned.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  company_uuid UUID;
  company_name TEXT;
BEGIN
  -- If the signup was triggered by an invite acceptance, skip
  -- auto-provisioning so the invite flow can write the correct
  -- company_id and role without being overwritten.
  IF (NEW.raw_user_meta_data->>'skip_provisioning') = 'true'
     OR (NEW.raw_user_meta_data->>'invited') = 'true' THEN
    RETURN NEW;
  END IF;

  -- Also skip if a profile already exists (idempotency guard).
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Normal signup: auto-provision company + admin profile.
  company_name := COALESCE(
    NEW.raw_user_meta_data->>'company_name',
    SPLIT_PART(NEW.email, '@', 1) || ' Company'
  );

  INSERT INTO public.companies (name)
  VALUES (company_name)
  RETURNING id INTO company_uuid;

  INSERT INTO public.profiles (id, company_id, role, email)
  VALUES (NEW.id, company_uuid, 'admin', NEW.email);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
