-- ============================================================
-- MIGRATION: Complete fix for invite acceptance flow
-- 
-- Problems solved:
-- 1. accept_invite RPC doesn't exist or has bugs → new v2 RPC
-- 2. Missing GRANT INSERT on profiles → added
-- 3. Missing GRANT UPDATE on invites → added
-- 4. Missing GRANT on company_members (UPDATE) → added
-- 5. No unique constraint safety on company_members upserts
-- 6. get_invite_for_accept doesn't return full status info
-- 7. No function to check if user can retry after page refresh
-- ============================================================

-- ============================================================
-- FIX 1: Ensure all required GRANTs exist
-- ============================================================
GRANT INSERT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.company_members TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.invites TO authenticated;

-- ============================================================
-- FIX 2: Ensure unique constraint exists on company_members
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'company_members_company_user_unique'
      AND conrelid = 'public.company_members'::regclass
  ) THEN
    ALTER TABLE public.company_members
    ADD CONSTRAINT company_members_company_user_unique
    UNIQUE (company_id, user_id);
  END IF;
END $$;

-- ============================================================
-- FIX 3: Drop and recreate get_invite_for_accept with more data
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_invite_for_accept(p_token text)
RETURNS TABLE (
  id uuid,
  email text,
  role text,
  company_id uuid,
  token text,
  status text,
  expires_at timestamptz,
  created_by uuid,
  company_name text,
  accepted_at timestamptz,
  accepted_by uuid
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.id,
    i.email,
    i.role,
    i.company_id,
    i.token,
    i.status,
    i.expires_at,
    i.created_by,
    c.name AS company_name,
    i.accepted_at,
    i.accepted_by
  FROM public.invites i
  LEFT JOIN public.companies c ON c.id = i.company_id
  WHERE i.token = p_token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_invite_for_accept(text) TO anon, authenticated;

-- ============================================================
-- FIX 4: Bulletproof accept_invite RPC (v2)
-- 
-- Handles ALL edge cases:
-- - Invite doesn't exist
-- - Invite already accepted (returns success, idempotent)
-- - Invite expired
-- - Wrong email
-- - Duplicate profile (ON CONFLICT)
-- - Duplicate company_members (ON CONFLICT)
-- - Race conditions (FOR UPDATE lock, row-level locking)
-- - Partial failures (all ops in single function)
-- ============================================================
CREATE OR REPLACE FUNCTION public.accept_invite(p_token text)
RETURNS TABLE (
  id uuid,
  email text,
  role text,
  company_id uuid,
  accepted_by uuid,
  accepted_at timestamptz,
  action_taken text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.invites%ROWTYPE;
  v_user_id uuid;
  v_user_email text;
  v_invite_email text;
  v_role text;
  v_accepted_at timestamptz;
  v_action_taken text := 'accepted';
BEGIN
  v_user_id := auth.uid();
  v_user_email := lower(trim(coalesce(auth.jwt() ->> 'email', '')));

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF nullif(trim(coalesce(p_token, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Invalid invite link.';
  END IF;

  -- Lock the invite row to prevent race conditions
  SELECT *
  INTO v_invite
  FROM public.invites
  WHERE token = trim(p_token)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This invitation link is invalid or has expired.';
  END IF;

  -- Idempotent: if already accepted, just return success
  IF v_invite.status = 'accepted' THEN
    RETURN QUERY
    SELECT
      v_invite.id,
      v_invite.email,
      v_invite.role,
      v_invite.company_id,
      v_invite.accepted_by,
      v_invite.accepted_at,
      'already_accepted'::text;
    RETURN;
  END IF;

  IF v_invite.status <> 'pending' THEN
    RAISE EXCEPTION 'This invitation is no longer valid (status: %).', v_invite.status;
  END IF;

  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'This invitation link has expired.';
  END IF;

  v_invite_email := lower(trim(coalesce(v_invite.email, '')));
  IF v_invite_email = '' OR v_invite_email <> v_user_email THEN
    RAISE EXCEPTION 'This invitation belongs to a different email address. Expected %, but you are signed in as %.', v_invite_email, v_user_email;
  END IF;

  v_role := lower(trim(coalesce(v_invite.role, 'viewer')));
  IF v_role NOT IN ('admin', 'manager', 'analyst', 'viewer') THEN
    v_role := 'viewer';
  END IF;

  -- Step 1: Create/update company_members
  INSERT INTO public.company_members (
    company_id,
    user_id,
    email,
    role,
    status,
    invited_by,
    joined_at
  )
  VALUES (
    v_invite.company_id,
    v_user_id,
    v_invite_email,
    v_role,
    'active',
    v_invite.created_by,
    now()
  )
  ON CONFLICT (company_id, user_id)
  DO UPDATE SET
    email = excluded.email,
    role = excluded.role,
    status = 'active',
    invited_by = coalesce(excluded.invited_by, public.company_members.invited_by),
    joined_at = coalesce(public.company_members.joined_at, excluded.joined_at);

  -- Step 2: Create/update profiles
  INSERT INTO public.profiles (
    id,
    company_id,
    role,
    email,
    is_active
  )
  VALUES (
    v_user_id,
    v_invite.company_id,
    v_role,
    v_invite_email,
    true
  )
  ON CONFLICT (id)
  DO UPDATE SET
    company_id = excluded.company_id,
    role = excluded.role,
    email = excluded.email,
    is_active = true;

  -- Step 3: Mark invite as accepted
  v_accepted_at := now();

  UPDATE public.invites
  SET
    status = 'accepted',
    accepted_at = v_accepted_at,
    accepted_by = v_user_id
  WHERE public.invites.id = v_invite.id;

  -- Return the result
  RETURN QUERY
  SELECT
    v_invite.id,
    v_invite_email,
    v_role,
    v_invite.company_id,
    v_user_id,
    v_accepted_at,
    v_action_taken;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_invite(text) TO authenticated;

-- ============================================================
-- FIX 5: Utility function to check invite status by token
-- Can be called by anon users before signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_invite_status(p_token text)
RETURNS TABLE (
  status text,
  email text,
  company_name text,
  role text,
  expires_at timestamptz,
  is_expired boolean,
  is_accepted boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.status,
    i.email,
    c.name,
    i.role,
    i.expires_at,
    CASE WHEN i.expires_at IS NOT NULL AND i.expires_at < now() THEN true ELSE false END,
    CASE WHEN i.status = 'accepted' THEN true ELSE false END
  FROM public.invites i
  LEFT JOIN public.companies c ON c.id = i.company_id
  WHERE i.token = p_token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.check_invite_status(text) TO anon, authenticated;

-- ============================================================
-- FIX 6: Ensure RLS policies allow the invited user to
-- read/update their own invite during acceptance flow
-- ============================================================

-- Policy: self-serve accept (invited user updates their own invite)
DROP POLICY IF EXISTS "invites_update_self_accept" ON public.invites;
CREATE POLICY "invites_update_self_accept"
ON public.invites
FOR UPDATE
TO authenticated
USING (
  status = 'pending'
  AND lower(trim(email)) = lower(trim(auth.jwt() ->> 'email'))
)
WITH CHECK (
  status = 'accepted'
  AND accepted_by = auth.uid()
  AND lower(trim(email)) = lower(trim(auth.jwt() ->> 'email'))
);

-- Policy: self-serve select (invited user reads their own invite)
DROP POLICY IF EXISTS "invites_select_self" ON public.invites;
CREATE POLICY "invites_select_self"
ON public.invites
FOR SELECT
TO authenticated
USING (
  lower(trim(email)) = lower(trim(auth.jwt() ->> 'email'))
);

-- Policy: company_members - user can read their own membership
DROP POLICY IF EXISTS "company_members_select_own" ON public.company_members;
CREATE POLICY "company_members_select_own"
ON public.company_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: company_members - user can insert their own membership
DROP POLICY IF EXISTS "company_members_insert_own" ON public.company_members;
CREATE POLICY "company_members_insert_own"
ON public.company_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: company_members - user can update their own membership
DROP POLICY IF EXISTS "company_members_update_own" ON public.company_members;
CREATE POLICY "company_members_update_own"
ON public.company_members
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================
-- FIX 7: Ensure handle_new_user trigger always skips invite signups
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  company_uuid UUID;
  company_name TEXT;
BEGIN
  IF (NEW.raw_user_meta_data->>'skip_provisioning') = 'true'
     OR (NEW.raw_user_meta_data->>'invited') = 'true' THEN
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

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
