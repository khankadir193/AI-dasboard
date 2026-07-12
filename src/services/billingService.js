import { supabase } from '../lib/supabaseClient'

export async function createOrder(companyId) {
  const response = await fetch('/api/billing/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companyId }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to create payment order')
  }

  return response.json()
}

export async function verifyPayment(payload) {
  const response = await fetch('/api/billing/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Payment verification failed')
  }

  return response.json()
}

export async function fetchBillingTransactions(companyId) {
  if (!companyId) return []

  const { data, error } = await supabase
    .from('billing_transactions')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('[billingService] fetch transactions error:', error)
    return []
  }

  return data || []
}
