-- Invite flow: secure public read by token + company-scoped invite management

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
  company_name text
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
    c.name AS company_name
  FROM public.invites i
  LEFT JOIN public.companies c ON c.id = i.company_id
  WHERE i.token = p_token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_invite_for_accept(text) TO anon, authenticated;

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.invites TO authenticated;

DROP POLICY IF EXISTS "invites_select_company" ON public.invites;
DROP POLICY IF EXISTS "invites_insert_company_managers" ON public.invites;
DROP POLICY IF EXISTS "invites_update_company_managers" ON public.invites;

-- Allow anonymous users to fetch invite details by token.
-- This is required for the invite acceptance page (pre-signin).
DROP POLICY IF EXISTS "invites_select_company" ON public.invites;

CREATE POLICY "invites_select_by_token" 
ON public.invites
FOR SELECT
TO anon
USING (token = p_token);

-- Authenticated users can also fetch the invite by token.
CREATE POLICY "invites_select_by_token_authenticated"
ON public.invites
FOR SELECT
TO authenticated
USING (token = p_token);

CREATE POLICY "invites_insert_company_managers"
ON public.invites
FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
  AND created_by = auth.uid()
);

CREATE POLICY "invites_update_company_managers"
ON public.invites
FOR UPDATE
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);
