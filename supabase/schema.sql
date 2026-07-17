-- Multi-tenant SaaS Schema for AI Dashboard
-- Companies, Profiles, and Analytics Data tables

-- Companies table - Each company/organization
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT UNIQUE,
    settings JSONB DEFAULT '{}',
    subscription_plan TEXT DEFAULT 'trial',
    trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    subscription_status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles with company association
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'analyst', 'viewer')),
    email TEXT,
    permissions JSONB DEFAULT '[]',
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics data with company isolation
CREATE TABLE IF NOT EXISTS analytics_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('revenue', 'expenses', 'users', 'active_users', 'projects', 'projects_created', 'projects_deleted', 'projects_updated', 'conversion_rate', 'orders', 'traffic', 'engagement', 'dashboard_view')),
    metric_value NUMERIC NOT NULL,
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KPIs table with company isolation
CREATE TABLE IF NOT EXISTS kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    value NUMERIC(15,2),
    change_percentage NUMERIC(5,2),
    trend TEXT CHECK (trend IN ('up', 'down', 'stable')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Insights with company isolation
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data tables with company isolation
CREATE TABLE IF NOT EXISTS data_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    data JSONB DEFAULT '{}',
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table with company isolation
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    description TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- company_members: RLS must be enabled so INSERT policies are enforced.
-- Without this the policies are silently ignored and the authenticated
-- role has no table-level grant, causing "permission denied".
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.company_members TO authenticated;
-- Invites / membership onboarding tables (required for invite acceptance)
-- Note: these tables must already exist in the database. We only add RLS policies here.


-- RLS Policies for Companies table
CREATE POLICY "Companies are viewable by authenticated users" ON companies
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Companies are insertable by authenticated users" ON companies
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Companies are updatable by company admin" ON companies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND company_id = companies.id 
            AND role = 'admin'
        )
    );

-- RLS Policies for Profiles table
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Company admins can view all company profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p2 
            WHERE p2.id = auth.uid() 
            AND p2.company_id = profiles.company_id 
            AND p2.role = 'admin'
        )
    );

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Company admins can update company profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p2 
            WHERE p2.id = auth.uid() 
            AND p2.company_id = profiles.company_id 
            AND p2.role = 'admin'
        )
    );

-- RLS Policies for Analytics Data table
CREATE POLICY "Users can view their company analytics data" ON analytics_data
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their company analytics data" ON analytics_data
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Company admins can update analytics data" ON analytics_data
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Company admins can delete analytics data" ON analytics_data
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for KPIs table
CREATE POLICY "Users can view their company KPIs" ON kpis
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their company KPIs" ON kpis
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Company admins can update KPIs" ON kpis
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for AI Insights table
CREATE POLICY "Users can view their company AI insights" ON ai_insights
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their company AI insights" ON ai_insights
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own AI insights" ON ai_insights
    FOR UPDATE USING (auth.uid() = user_id::text);

-- RLS Policies for Data Tables
CREATE POLICY "Users can view their company data tables" ON data_tables
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their company data tables" ON data_tables
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own data tables" ON data_tables
    FOR UPDATE USING (auth.uid() = created_by::text);

-- RLS Policies for Projects table
CREATE POLICY "Users can view their company projects" ON projects
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their company projects" ON projects
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = created_by::text);

CREATE POLICY "Company admins can update company projects" ON projects
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for Company Members (company_members)
-- Minimal safe rules for invite onboarding:
-- 1) Select: user can read only their own membership rows
-- 2) Insert: user can insert only their own membership row (auth.uid() = user_id)
DROP POLICY IF EXISTS "Users can view their own company memberships"  ON public.company_members;
DROP POLICY IF EXISTS "Users can insert their own company membership" ON public.company_members;
DROP POLICY IF EXISTS "Authenticated users can insert own membership" ON public.company_members;

CREATE POLICY "company_members_select_own" ON public.company_members
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "company_members_insert_own" ON public.company_members
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance

CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_analytics_data_company_id ON analytics_data(company_id);
CREATE INDEX IF NOT EXISTS idx_analytics_data_metric_type ON analytics_data(metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_data_metric_date ON analytics_data(metric_date);
CREATE INDEX IF NOT EXISTS idx_kpis_company_id ON kpis(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_company_id ON ai_insights(company_id);
CREATE INDEX IF NOT EXISTS idx_data_tables_company_id ON data_tables(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_data_updated_at BEFORE UPDATE ON analytics_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpis_updated_at BEFORE UPDATE ON kpis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_tables_updated_at BEFORE UPDATE ON data_tables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- AUTO-PROVISIONING TRIGGER
-- Automatically creates company and profile when user signs up
-- =====================================================

-- Function to handle new user signup.
-- Skips auto-provisioning for invite signups (skip_provisioning = 'true' in metadata)
-- so the invite acceptance flow can write the correct company_id without being overwritten.
-- Normal signups (no metadata flag) continue to receive auto-provisioned company + admin profile.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  company_uuid UUID;
  company_name TEXT;
BEGIN
  -- Skip for invite signups or if profile already exists.
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users to auto-provision
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SELECT POLICIES (SAFE)
-- =====================================================

-- Users can view their company's data
DROP POLICY IF EXISTS "Users can view their company" ON companies;
CREATE POLICY "Users can view their company" ON companies
  FOR SELECT USING (
    id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- MIGRATION: Update analytics_data metric_type constraint
-- =====================================================

-- Drop existing constraint and recreate with new allowed types
ALTER TABLE analytics_data DROP CONSTRAINT IF EXISTS analytics_data_metric_type_check;

ALTER TABLE analytics_data ADD CONSTRAINT analytics_data_metric_type_check
  CHECK (metric_type IN ('revenue', 'expenses', 'users', 'active_users', 'projects', 'projects_created', 'projects_deleted', 'projects_updated', 'conversion_rate', 'orders', 'traffic', 'engagement', 'dashboard_view'));

-- =====================================================
-- CLEANUP: Remove mock/sample data from analytics_data
-- =====================================================

-- Delete all mock/sample data
DELETE FROM analytics_data
WHERE metadata->>'source' IN ('mock', 'sample', 'demo')
   OR metadata->>'isMock' = 'true';

-- Optional: Delete suspicious data (very large values that may be random)
-- Uncomment if needed after reviewing data
-- DELETE FROM analytics_data
-- WHERE metric_value > 10000
-- AND metadata->>'isReal' IS NULL;

-- =====================================================
-- FEATURE FLAGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    feature_key TEXT NOT NULL,
    enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_company ON feature_flags(company_id);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company feature flags" ON feature_flags
    FOR SELECT USING (
        company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Admins can manage feature flags" ON feature_flags
    FOR INSERT WITH CHECK (
        company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can update feature flags" ON feature_flags
    FOR UPDATE USING (
        company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can delete feature flags" ON feature_flags
    FOR DELETE USING (
        company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =====================================================
-- ACTIVITY LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_company ON activity_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON activity_logs(resource_type, resource_id);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company activity logs" ON activity_logs
    FOR SELECT USING (
        company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can insert activity logs" ON activity_logs
    FOR INSERT WITH CHECK (
        company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    );

-- Enable Realtime for activity_logs (for potential future live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS activity_logs;

-- =====================================================
-- FIX: Grant table access to authenticated role
-- Without these GRANTs, RLS policies exist but the
-- authenticated role lacks table-level permissions,
-- causing "permission denied for table" errors.
-- Pattern matches public.company_members (line 101).
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON public.feature_flags TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.activity_logs TO authenticated;

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    resource_type TEXT,
    resource_id TEXT,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_company ON notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company notifications" ON notifications
    FOR SELECT USING (
        company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can insert company notifications" ON notifications
    FOR INSERT WITH CHECK (
        company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (
        company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    );

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;

-- =====================================================
-- GENERATED REPORTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS generated_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'team_productivity', 'executive_summary')),
    title TEXT NOT NULL,
    content JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generated_reports_company ON generated_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_type ON generated_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_generated_reports_created ON generated_reports(created_at DESC);

ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company reports" ON generated_reports
    FOR SELECT USING (
        company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can insert company reports" ON generated_reports
    FOR INSERT WITH CHECK (
        company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can delete their company reports" ON generated_reports
    FOR DELETE USING (
        company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    );

GRANT SELECT, INSERT, DELETE ON public.generated_reports TO authenticated;
