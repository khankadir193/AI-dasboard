-- =====================================================
-- Add billing columns to companies table
-- =====================================================

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS payment_provider TEXT,
  ADD COLUMN IF NOT EXISTS provider_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- =====================================================
-- Create billing_transactions table
-- =====================================================

CREATE TABLE IF NOT EXISTS billing_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'refunded')),
    payment_provider TEXT DEFAULT 'razorpay',
    provider_payment_id TEXT,
    provider_subscription_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_transactions_company ON billing_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_created ON billing_transactions(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_provider_payment ON billing_transactions(provider_payment_id);

ALTER TABLE billing_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company billing transactions" ON billing_transactions
    FOR SELECT USING (
        company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Service role can insert billing transactions" ON billing_transactions
    FOR INSERT WITH CHECK (true);

GRANT SELECT ON public.billing_transactions TO authenticated;
GRANT INSERT ON public.billing_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.companies TO authenticated;
