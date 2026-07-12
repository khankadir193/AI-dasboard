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

export async function registerBillingRoutes(app) {
  app.post('/api/billing/create-order', async (req, res) => {
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
  })

  app.post('/api/billing/verify-payment', async (req, res) => {
    try {
      const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        companyId,
      } = req.body

      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing payment verification fields' })
      }

      const body = razorpay_order_id + '|' + razorpay_payment_id
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex')

      if (expectedSignature !== razorpay_signature) {
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
        console.error('[Billing] verify-payment update error:', updateError)
        return res.status(500).json({ error: 'Failed to update subscription' })
      }

      const { error: txError } = await supabase.from('billing_transactions').insert({
        company_id: companyId,
        amount: 99900,
        currency: 'INR',
        status: 'succeeded',
        payment_provider: 'razorpay',
        provider_payment_id: razorpay_payment_id,
        provider_subscription_id: razorpay_order_id,
      })

      if (txError) {
        console.error('[Billing] verify-payment transaction insert error:', txError)
      }

      return res.status(200).json({ success: true, company })
    } catch (error) {
      console.error('[Billing] verify-payment error:', error)
      return res.status(500).json({ error: 'Payment verification failed' })
    }
  })
}
