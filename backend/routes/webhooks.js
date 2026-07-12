// TODO: Webhook verification is not yet active.
// To enable, set RAZORPAY_WEBHOOK_SECRET in .env and implement
// signature verification using the raw request body (req.rawBody).
//
// This file is a placeholder for future Razorpay webhook processing.
// The route is registered but returns 200 without processing when
// RAZORPAY_WEBHOOK_SECRET is not configured.

import crypto from 'crypto'
import supabase from '../lib/supabaseAdmin.js'

// TODO: Uncomment and use when RAZORPAY_WEBHOOK_SECRET is configured
/*
function verifyWebhookSignature(body, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  return expected === signature
}
*/

export async function registerWebhookRoutes(app) {
  app.post('/api/webhooks/razorpay', async (req, res) => {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      // Webhook processing is disabled until RAZORPAY_WEBHOOK_SECRET is set
      return res.status(200).json({ status: 'webhooks not configured' })
    }

    // TODO: Implement webhook handling below
    // 1. Verify webhook signature using req.rawBody
    // 2. Parse event from req.body
    // 3. Handle events:
    //    - payment.captured: insert billing_transactions record
    //    - payment.failed: insert failed billing_transactions record
    //    - subscription.activated: update subscription_status='active'
    //    - subscription.charged: extend current_period_end
    //    - subscription.completed: update subscription_status='expired'
    //    - subscription.cancelled: update subscription_status='cancelled'
    // 4. Check provider_payment_id for idempotency before inserts

    return res.status(200).json({ status: 'ok' })
  })
}
