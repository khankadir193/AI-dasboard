-- =====================================================
-- Utility function to refresh PostgREST schema cache
-- Called by backend when schema-related errors occur
-- during billing_transactions insert
-- =====================================================

CREATE OR REPLACE FUNCTION public.pgrst_reload()
RETURNS void
LANGUAGE SQL
SECURITY DEFINER
AS $$
  NOTIFY pgrst, 'reload schema';
$$;
