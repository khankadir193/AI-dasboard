-- =====================================================
-- Add trial and subscription columns to companies table
-- =====================================================

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- Backfill existing companies: set trial dates from created_at
-- and upgrade subscription_plan from 'free' to 'trial'
UPDATE companies
SET
  trial_started_at = COALESCE(trial_started_at, created_at),
  trial_ends_at    = COALESCE(trial_ends_at, created_at + INTERVAL '30 days'),
  subscription_status = CASE
    WHEN COALESCE(trial_ends_at, created_at + INTERVAL '30 days') < NOW() THEN 'expired'
    ELSE 'active'
  END,
  subscription_plan = CASE
    WHEN subscription_plan = 'free' THEN 'trial'
    ELSE subscription_plan
  END
WHERE trial_started_at IS NULL
   OR subscription_status IS NULL;

-- =====================================================
-- Update handle_new_user to set trial dates for new companies
-- =====================================================
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

  INSERT INTO public.companies (name, subscription_plan, trial_started_at, trial_ends_at, subscription_status)
  VALUES (company_name, 'trial', NOW(), NOW() + INTERVAL '30 days', 'active')
  RETURNING id INTO company_uuid;

  INSERT INTO public.profiles (id, company_id, role, email)
  VALUES (NEW.id, company_uuid, 'admin', NEW.email);

  INSERT INTO feature_flags (company_id, feature_key, enabled)
  VALUES
    (company_uuid, 'ai_insights', true),
    (company_uuid, 'notifications', true),
    (company_uuid, 'export_csv', true),
    (company_uuid, 'realtime_dashboard', true),
    (company_uuid, 'team_analytics', true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
