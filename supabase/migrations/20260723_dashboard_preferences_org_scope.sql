-- =====================================================================
-- dashboard_preferences: add company_id for per-user-per-tenant scoping
--
-- Why: A user in multiple companies (or an admin viewing a secondary
-- tenant) previously had a single global layout. Adding company_id
-- gives each (user, company) pair an independent layout, matching the
-- spec requirement and staying consistent with the rest of the codebase
-- which uniformly uses company_id as the tenant identifier.
--
-- Using company_id (not a new organization_id column) avoids duplicate
-- tenant identifiers and unnecessary migrations.
--
-- Migration strategy:
--   1. Add company_id as nullable with a FK to companies.
--   2. Back-fill existing rows from profiles.company_id.
--   3. Drop the old user_id unique constraint.
--   4. Add a composite unique index on (user_id, company_id).
--   5. Update RLS policy for UPDATE to keep user_id = auth.uid() guard.
--
-- Backwards compatibility:
--   - Rows with NULL company_id continue to work because the app
--     conditionally adds the company filter and conflict key only when
--     the value is non-null.  Existing single-tenant deployments are
--     unaffected.
-- =====================================================================

-- 1. Add company_id column (nullable for backwards compat)
ALTER TABLE public.dashboard_preferences
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2. Back-fill existing rows using the user's company_id from profiles
UPDATE public.dashboard_preferences dp
SET company_id = p.company_id
FROM public.profiles p
WHERE p.id = dp.user_id
  AND dp.company_id IS NULL;

-- 3. Drop the old single-column unique constraint (if it exists under its original name)
--    We use DROP CONSTRAINT IF EXISTS + a fallback index drop for safety.
DO $$
BEGIN
  -- Attempt to drop the named constraint added in the original migration
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'dashboard_preferences_user_id_key'
      AND conrelid = 'public.dashboard_preferences'::regclass
  ) THEN
    ALTER TABLE public.dashboard_preferences
      DROP CONSTRAINT dashboard_preferences_user_id_key;
  END IF;
END$$;

-- 4. Add composite unique index: (user_id, company_id).
--    Allows one layout per user per company. NULL company_id rows each get
--    their own slot because NULL != NULL in unique indexes (pg standard).
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_preferences_user_company
  ON public.dashboard_preferences(user_id, company_id);

-- 5. Re-create UPDATE RLS policy (user_id = auth.uid() is the primary gate).
DROP POLICY IF EXISTS "dashboard_preferences_update_own" ON public.dashboard_preferences;
CREATE POLICY "dashboard_preferences_update_own"
  ON public.dashboard_preferences
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 6. Add index on company_id for efficient tenant-scoped queries
CREATE INDEX IF NOT EXISTS idx_dashboard_preferences_company
  ON public.dashboard_preferences(company_id);

-- 7. Update the updated_at trigger function reference (no-op if already correct)
--    Ensures the trigger fires on every UPDATE including company-scoped upserts.
DROP TRIGGER IF EXISTS update_dashboard_preferences_updated_at ON public.dashboard_preferences;
CREATE TRIGGER update_dashboard_preferences_updated_at
  BEFORE UPDATE ON public.dashboard_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
