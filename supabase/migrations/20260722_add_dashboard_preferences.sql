-- =====================================================
-- dashboard_preferences: per-user widget order + visibility
-- Scoped by user_id only (profiles.company_id is a single FK; one company per user).
-- RLS mirrors the company_members_select_own / insert_own pattern.
-- Missing row (existing users) → graceful null return → UI falls back to default order.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.dashboard_preferences (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- widget_order: array of orderable slot IDs in user's desired sequence.
    -- Slots: 'kpi_section' | 'charts_row' | 'event_distribution' | 'recent_activity_feed'
    widget_order   JSONB NOT NULL DEFAULT '["kpi_section","charts_row","event_distribution","recent_activity_feed"]'::jsonb,
    -- hidden_widgets: individual widget IDs the user has hidden.
    -- IDs: 'kpi_section' | 'activity_timeline' | 'project_status' | 'event_distribution' | 'recent_activity_feed'
    hidden_widgets JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_dashboard_preferences_user
    ON public.dashboard_preferences(user_id);

ALTER TABLE public.dashboard_preferences ENABLE ROW LEVEL SECURITY;

-- Self-scoped SELECT: mirrors company_members_select_own
CREATE POLICY "dashboard_preferences_select_own"
    ON public.dashboard_preferences
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Self-scoped INSERT
CREATE POLICY "dashboard_preferences_insert_own"
    ON public.dashboard_preferences
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Self-scoped UPDATE (both USING + WITH CHECK required for full enforcement)
CREATE POLICY "dashboard_preferences_update_own"
    ON public.dashboard_preferences
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Self-scoped DELETE (allow users to reset their preferences)
CREATE POLICY "dashboard_preferences_delete_own"
    ON public.dashboard_preferences
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Table-level grant — required alongside RLS (pattern from activity_logs L493, notifications L536)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dashboard_preferences TO authenticated;

-- updated_at trigger: reuse existing trigger function (defined in schema.sql L298)
CREATE OR REPLACE TRIGGER update_dashboard_preferences_updated_at
    BEFORE UPDATE ON public.dashboard_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Composite index on activity_logs for 90-day heatmap query performance.
-- Existing indexes: idx_activity_logs_company (company_id) and
-- idx_activity_logs_created (created_at DESC) exist separately — Postgres
-- would bitmap-AND them for the heatmap filter (company_id + date range).
-- A composite (company_id, created_at DESC) enables a single index range scan,
-- which matters at scale for companies with heavy 90-day activity_logs data.
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_activity_logs_company_date
    ON public.activity_logs(company_id, created_at DESC);
