-- Secure invite acceptance RPC and policy cleanup for existing databases.

CREATE OR REPLACE FUNCTION public.accept_invite(p_token text)
RETURNS TABLE (
  id uuid,
  email text,
  role text,
  company_id uuid,
  accepted_by uuid,
  accepted_at timestamptz
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
BEGIN
  v_user_id := auth.uid();
  v_user_email := lower(trim(coalesce(auth.jwt() ->> 'email', '')));

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF nullif(trim(coalesce(p_token, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Invalid invite link.';
  END IF;

  SELECT *
  INTO v_invite
  FROM public.invites
  WHERE token = trim(p_token)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid invite link.';
  END IF;

  IF v_invite.status = 'accepted' THEN
    RAISE EXCEPTION 'This invitation has already been accepted.';
  END IF;

  IF v_invite.status <> 'pending' THEN
    RAISE EXCEPTION 'This invitation is not valid anymore.';
  END IF;

  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'This invitation link has expired.';
  END IF;

  v_invite_email := lower(trim(coalesce(v_invite.email, '')));
  IF v_invite_email = '' OR v_invite_email <> v_user_email THEN
    RAISE EXCEPTION 'This invitation belongs to a different email address.';
  END IF;

  v_role := lower(trim(coalesce(v_invite.role, 'viewer')));
  IF v_role NOT IN ('admin', 'manager', 'analyst', 'viewer') THEN
    v_role := 'viewer';
  END IF;

  UPDATE public.company_members
  SET
    email = v_invite_email,
    role = v_role,
    status = 'active',
    invited_by = coalesce(v_invite.created_by, invited_by)
  WHERE company_id = v_invite.company_id
    AND user_id = v_user_id;

  IF NOT FOUND THEN
    BEGIN
      INSERT INTO public.company_members (
        company_id,
        user_id,
        email,
        role,
        status,
        invited_by
      )
      VALUES (
        v_invite.company_id,
        v_user_id,
        v_invite_email,
        v_role,
        'active',
        v_invite.created_by
      );
    EXCEPTION
      WHEN unique_violation THEN
        UPDATE public.company_members
        SET
          email = v_invite_email,
          role = v_role,
          status = 'active',
          invited_by = coalesce(v_invite.created_by, invited_by)
        WHERE company_id = v_invite.company_id
          AND user_id = v_user_id;
    END;
  END IF;

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

  v_accepted_at := now();

  UPDATE public.invites
  SET
    status = 'accepted',
    accepted_at = v_accepted_at,
    accepted_by = v_user_id
  WHERE public.invites.id = v_invite.id
    AND public.invites.status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This invitation is no longer available (already accepted or invalid).';
  END IF;

  RETURN QUERY
  SELECT
    v_invite.id,
    v_invite_email,
    v_role,
    v_invite.company_id,
    v_user_id,
    v_accepted_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_invite(text) TO authenticated;

DROP POLICY IF EXISTS "invites_select_by_token" ON public.invites;
DROP POLICY IF EXISTS "invites_select_by_token_authenticated" ON public.invites;
DROP POLICY IF EXISTS "invites_select_company" ON public.invites;

CREATE POLICY "invites_select_company"
ON public.invites
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);
