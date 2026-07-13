import Razorpay from 'razorpay'
import crypto from 'crypto'
import supabase from '../lib/supabaseAdmin.js'

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set')
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

export async function handleCreateOrder(req, res) {
  try {
    const { companyId } = req.body
    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' })
    }

    const razorpay = getRazorpay()

    const order = await razorpay.orders.create({
      amount: 99900,
      currency: 'INR',
      receipt: companyId,
      notes: { company_id: companyId },
    })

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    })
  } catch (error) {
    console.error('[Billing] create-order error:', error)
    return res.status(500).json({ error: 'Failed to create payment order' })
  }
}

export async function handleVerifyPayment(req, res) {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      companyId,
    } = req.body

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !companyId) {
      const missing = []
      if (!razorpay_payment_id) missing.push('razorpay_payment_id')
      if (!razorpay_order_id) missing.push('razorpay_order_id')
      if (!razorpay_signature) missing.push('razorpay_signature')
      if (!companyId) missing.push('companyId')
      console.error('[Billing] verify-payment missing fields:', { missing, body: req.body })
      return res.status(400).json({ error: 'Missing payment verification fields', missing })
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      console.error('[Billing] signature mismatch:', {
        companyId,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        computedSignature: expectedSignature,
        receivedSignature: razorpay_signature,
      })
      return res.status(400).json({ error: 'Invalid payment signature' })
    }

    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setDate(periodEnd.getDate() + 30)

    const { data: company, error: updateError } = await supabase
      .from('companies')
      .update({
        subscription_plan: 'pro',
        subscription_status: 'active',
        payment_provider: 'razorpay',
        provider_subscription_id: razorpay_order_id,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .eq('id', companyId)
      .select()
      .maybeSingle()

    if (updateError) {
      console.error('[Billing] company update failed:', {
        companyId,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
      })
      return res.status(500).json({
        error: 'Failed to update subscription',
        details: updateError.message,
        code: updateError.code,
      })
    }

    if (!company) {
      console.error('[Billing] company not found after update:', { companyId })
      return res.status(404).json({ error: 'Company not found', companyId })
    }

    const { data: existingTx } = await supabase
      .from('billing_transactions')
      .select('id')
      .eq('provider_payment_id', razorpay_payment_id)
      .maybeSingle()

    if (!existingTx) {
      const insertPayload = {
        company_id: companyId,
        amount: 99900,
        currency: 'INR',
        status: 'succeeded',
        payment_provider: 'razorpay',
        provider_payment_id: razorpay_payment_id,
        provider_order_id: razorpay_order_id,
        provider_signature: razorpay_signature,
        provider_subscription_id: razorpay_order_id,
      }

      const result = await supabase.from('billing_transactions').insert(insertPayload).select()

      if (result.error) {
        const isSchemaError = result.error.code === '42703' || /column.*does not exist/i.test(result.error.message)

        if (isSchemaError) {
          console.error('[Billing] PostgREST schema cache stale — refreshing...')

          const { error: reloadError } = await supabase.rpc('pgrst_reload')

          if (reloadError) {
            console.error('[Billing] pgrst_reload failed:', JSON.stringify(reloadError, null, 2))
          }

          const retryResult = await supabase.from('billing_transactions').insert(insertPayload).select()

          if (retryResult.error) {
            console.error('[Billing] retry insert failed — full error:', JSON.stringify(retryResult.error, null, 2))
            return res.status(500).json({
              error: 'Failed to record payment transaction',
            })
          }

        } else {
          console.error('[Billing] transaction insert failed — full error:', JSON.stringify(result.error, null, 2))
          return res.status(500).json({
            error: 'Failed to record payment transaction',
          })
        }
      }
    }

    return res.status(200).json({ success: true, company })
  } catch (error) {
    console.error('[Billing] verify-payment unexpected error:', {
      message: error.message,
      stack: error.stack,
    })
    return res.status(500).json({
      error: 'Payment verification failed',
      details: error.message,
    })
  }
}

export async function registerBillingRoutes(app) {
  app.post('/api/billing/create-order', handleCreateOrder)
  app.post('/api/billing/verify-payment', handleVerifyPayment)
}
