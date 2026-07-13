-- =====================================================
-- Add provider_order_id and provider_signature columns
-- to billing_transactions table
-- =====================================================

ALTER TABLE billing_transactions
  ADD COLUMN IF NOT EXISTS provider_order_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_signature TEXT;
