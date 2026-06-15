-- ============================================================
-- MIGRATION: Fix invite acceptance flow
-- Problems solved:
-- 1. Invited user cannot mark invite accepted via direct table access
--    (fallback path in frontend) because RLS requires admin/manager role.
-- 2. On conflict clause for company_members upsert in fallback needs
--    a proper unique constraint.
-- ============================================================

-- ============================================================
-- FIX 1: Add UPDATE policy so invited user can accept own invite
-- This enables the frontend fallback path when accept_invite RPC
-- is unavailable or fails.
-- ============================================================
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

-- ============================================================
-- FIX 2: Ensure company_members has unique constraint on
-- (company_id, user_id) for ON CONFLICT upsert in fallback.
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
-- FIX 3: Grant INSERT on profiles to authenticated for fallback
-- (needed for direct client-side upsert when RPC is unavailable)
-- ============================================================
GRANT INSERT ON public.profiles TO authenticated;
GRANT UPDATE ON public.invites TO authenticated;
