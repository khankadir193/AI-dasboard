-- ============================================================
-- MIGRATION: reconcile_invited_user — SECURITY DEFINER fallback
-- Called by the frontend when profile or company_member is
-- missing after a successful accept_invite RPC call.
-- This can happen due to replication lag, RLS edge cases in
-- client-side SELECT queries, or partial RPC failures.
--
-- SAFETY: validates auth.uid() before every write.
-- Only inserts/upserts rows owned by the calling user.
-- ============================================================

-- ============================================================
-- reconcile_profile — creates or updates the calling user's
-- profile row with the given company_id, role, and email.
-- Returns the profile row or NULL on failure.
-- ============================================================
CREATE OR REPLACE FUNCTION public.reconcile_profile(
  p_company_id uuid,
  p_role text DEFAULT 'viewer',
  p_email text DEFAULT ''
)
RETURNS TABLE (
  id uuid,
  company_id uuid,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_role text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_role := lower(trim(coalesce(nullif(trim(p_role), ''), 'viewer')));
  IF v_role NOT IN ('admin', 'manager', 'analyst', 'viewer') THEN
    v_role := 'viewer';
  END IF;

  INSERT INTO public.profiles (id, company_id, role, email, is_active)
  VALUES (
    v_user_id,
    p_company_id,
    v_role,
    lower(trim(coalesce(p_email, ''))),
    true
  )
  ON CONFLICT (id)
  DO UPDATE SET
    company_id = coalesce(excluded.company_id, public.profiles.company_id),
    role = excluded.role,
    email = coalesce(nullif(excluded.email, ''), public.profiles.email),
    is_active = true;

  RETURN QUERY
  SELECT pr.id, pr.company_id, pr.role
  FROM public.profiles pr
  WHERE pr.id = v_user_id
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reconcile_profile(uuid, text, text) TO authenticated;

-- ============================================================
-- reconcile_member — creates or updates the calling user's
-- company_members row. Returns the member row or NULL.
-- ============================================================
CREATE OR REPLACE FUNCTION public.reconcile_member(
  p_company_id uuid,
  p_role text DEFAULT 'viewer',
  p_email text DEFAULT '',
  p_invited_by uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  company_id uuid,
  user_id uuid,
  role text,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_role text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_role := lower(trim(coalesce(nullif(trim(p_role), ''), 'viewer')));
  IF v_role NOT IN ('admin', 'manager', 'analyst', 'viewer') THEN
    v_role := 'viewer';
  END IF;

  INSERT INTO public.company_members (
    company_id, user_id, email, role, status, invited_by, joined_at
  )
  VALUES (
    p_company_id,
    v_user_id,
    lower(trim(coalesce(p_email, ''))),
    v_role,
    'active',
    p_invited_by,
    now()
  )
  ON CONFLICT (company_id, user_id)
  DO UPDATE SET
    email = coalesce(nullif(excluded.email, ''), public.company_members.email),
    role = excluded.role,
    status = 'active',
    invited_by = coalesce(excluded.invited_by, public.company_members.invited_by),
    joined_at = coalesce(public.company_members.joined_at, excluded.joined_at);

  RETURN QUERY
  SELECT cm.id, cm.company_id, cm.user_id, cm.role, cm.status
  FROM public.company_members cm
  WHERE cm.user_id = v_user_id
    AND cm.company_id = p_company_id
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reconcile_member(uuid, text, text, uuid) TO authenticated;
