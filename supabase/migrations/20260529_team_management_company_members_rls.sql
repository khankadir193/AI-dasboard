-- Team Management: allow admins/managers to read and update company_members in their company.
-- Keeps invite onboarding policies (select_own, insert_own) intact.

GRANT UPDATE ON public.company_members TO authenticated;

CREATE POLICY "company_members_select_company"
ON public.company_members
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "company_members_update_admin"
ON public.company_members
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.company_id = company_members.company_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.company_id = company_members.company_id
  )
);

CREATE POLICY "company_members_update_manager"
ON public.company_members
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'manager'
      AND p.company_id = company_members.company_id
  )
  AND company_members.role IN ('analyst', 'viewer')
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'manager'
      AND p.company_id = company_members.company_id
  )
  AND company_members.role IN ('analyst', 'viewer')
);
