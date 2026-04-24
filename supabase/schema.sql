-- Multi-tenant SaaS Schema for AI Dashboard

-- Tenants table - Each company/organization
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT UNIQUE,
    settings JSONB DEFAULT '{}',
    subscription_plan TEXT DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles with tenant association
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user', 'viewer')),
    permissions JSONB DEFAULT '[]',
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics data with tenant isolation
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    metric_name TEXT NOT NULL,
    value DECIMAL(10,2),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KPI data with tenant isolation
CREATE TABLE IF NOT EXISTS kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    value DECIMAL(15,2),
    change_percentage DECIMAL(5,2),
    trend TEXT CHECK (trend IN ('up', 'down', 'stable')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Insights with tenant isolation
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data tables with tenant isolation
CREATE TABLE IF NOT EXISTS data_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    data JSONB DEFAULT '{}',
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_tables ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Tenants table
CREATE POLICY "Tenants are viewable by authenticated users" ON tenants
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Tenants are insertable by authenticated users" ON tenants
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Tenants are updatable by tenant admin" ON tenants
    FOR UPDATE USING (
        auth.jwt() ->> 'tenant_id' = id::text AND
        auth.jwt() ->> 'role' = 'admin'
    );

-- RLS Policies for Profiles table
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Tenant admins can view all tenant profiles" ON profiles
    FOR SELECT USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text AND
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Tenant admins can update tenant profiles" ON profiles
    FOR UPDATE USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text AND
        auth.jwt() ->> 'role' = 'admin'
    );

-- RLS Policies for Analytics table
CREATE POLICY "Users can view their tenant analytics" ON analytics
    FOR SELECT USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text
    );

CREATE POLICY "Users can insert their tenant analytics" ON analytics
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'tenant_id' = tenant_id::text
    );

CREATE POLICY "Users can update their tenant analytics" ON analytics
    FOR UPDATE USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text
    );

CREATE POLICY "Users can delete their tenant analytics" ON analytics
    FOR DELETE USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text AND
        auth.jwt() ->> 'role' IN ('admin', 'user')
    );

-- RLS Policies for KPIs table
CREATE POLICY "Users can view their tenant KPIs" ON kpis
    FOR SELECT USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text
    );

CREATE POLICY "Users can insert their tenant KPIs" ON kpis
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'tenant_id' = tenant_id::text AND
        auth.jwt() ->> 'role' IN ('admin', 'user')
    );

CREATE POLICY "Users can update their tenant KPIs" ON kpis
    FOR UPDATE USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text AND
        auth.jwt() ->> 'role' IN ('admin', 'user')
    );

-- RLS Policies for AI Insights table
CREATE POLICY "Users can view their tenant AI insights" ON ai_insights
    FOR SELECT USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text
    );

CREATE POLICY "Users can insert their tenant AI insights" ON ai_insights
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'tenant_id' = tenant_id::text
    );

CREATE POLICY "Users can update their own AI insights" ON ai_insights
    FOR UPDATE USING (
        auth.uid() = user_id::text
    );

-- RLS Policies for Data Tables
CREATE POLICY "Users can view their tenant data tables" ON data_tables
    FOR SELECT USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text
    );

CREATE POLICY "Users can insert their tenant data tables" ON data_tables
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'tenant_id' = tenant_id::text
    );

CREATE POLICY "Users can update their own data tables" ON data_tables
    FOR UPDATE USING (
        auth.uid() = created_by::text
    );

CREATE POLICY "Users can delete their own data tables" ON data_tables
    FOR DELETE USING (
        auth.uid() = created_by::text AND
        auth.jwt() ->> 'role' IN ('admin', 'user')
    );

-- Create indexes for better performance
CREATE INDEX idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX idx_analytics_tenant_id ON analytics(tenant_id);
CREATE INDEX idx_kpis_tenant_id ON kpis(tenant_id);
CREATE INDEX idx_ai_insights_tenant_id ON ai_insights(tenant_id);
CREATE INDEX idx_data_tables_tenant_id ON data_tables(tenant_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_updated_at BEFORE UPDATE ON analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpis_updated_at BEFORE UPDATE ON kpis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_tables_updated_at BEFORE UPDATE ON data_tables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
