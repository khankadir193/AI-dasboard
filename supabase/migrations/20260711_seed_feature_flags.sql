-- =====================================================
-- Seed default feature flags for all existing companies
-- and auto-create on new company signup
-- =====================================================

-- Insert default feature flags for all existing companies.
-- Uses ON CONFLICT DO NOTHING so rerunning is safe.
INSERT INTO feature_flags (company_id, feature_key, enabled)
SELECT c.id, fk.key, true
FROM companies c
CROSS JOIN (
  VALUES
    ('ai_insights'),
    ('notifications'),
    ('export_csv'),
    ('realtime_dashboard'),
    ('team_analytics')
) AS fk(key)
ON CONFLICT (company_id, feature_key) DO NOTHING;

-- =====================================================
-- Update handle_new_user to auto-create feature flags
-- for newly registered companies
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

  INSERT INTO public.companies (name)
  VALUES (company_name)
  RETURNING id INTO company_uuid;

  INSERT INTO public.profiles (id, company_id, role, email)
  VALUES (NEW.id, company_uuid, 'admin', NEW.email);

  -- Seed default feature flags for the new company
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
