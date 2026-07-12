import { useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useSubscription } from '../../services/subscriptionService'
import { useCreateOrder, useVerifyPayment } from '../../hooks/useBilling'
import { getTrialDaysRemaining, isTrialExpired } from '../../utils/subscriptionAccess'

const PRO_FEATURES = [
  'AI Insights',
  'Notifications',
  'Audit Trail',
  'Unlimited Projects',
  'Priority Support',
]

const ENTERPRISE_FEATURES = [
  'Everything in Pro',
  'Custom integrations',
  'Dedicated support',
]

const PLAN_LABELS = {
  trial: 'Trial',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

const STATUS_LABELS = {
  active: 'Active',
  cancelled: 'Cancelled',
  expired: 'Expired',
}

function formatDate(value) {
  if (!value) return 'Not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'

  return date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

function CheckItem({ children }) {
  return (
    <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <svg className="w-4 h-4 text-green-500 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      {children}
    </li>
  )
}

export default function Billing() {
  const { profile } = useSelector((state) => state.profile)
  const companyId = profile?.company_id

  const { data: subscription, isLoading, isError } = useSubscription(companyId)

  const createOrderMut = useCreateOrder()
  const verifyPaymentMut = useVerifyPayment()

  const [upgradeError, setUpgradeError] = useState(null)

  const plan = subscription?.subscription_plan || 'trial'
  const status = subscription?.subscription_status || 'active'
  const planLabel = PLAN_LABELS[plan] || 'Trial'
  const statusLabel = STATUS_LABELS[status] || status
  const daysRemaining = getTrialDaysRemaining(subscription)
  const expired = isTrialExpired(subscription)

  const handleUpgrade = useCallback(async () => {
    if (!companyId) return
    setUpgradeError(null)

    try {
      const { orderId, amount, currency } = await createOrderMut.mutateAsync(companyId)

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        order_id: orderId,
        name: 'InsightAI',
        description: 'Pro Plan - ₹999/month',
        currency: currency,
        amount: amount,
        prefill: {},
        theme: { color: '#2563eb' },
        handler: async function (response) {
          try {
            await verifyPaymentMut.mutateAsync({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              companyId,
            })
          } catch {
            setUpgradeError('Payment was processed but verification failed. Please contact support.')
          }
        },
        modal: {
          ondismiss: function () {
            // User closed the Razorpay modal without completing payment
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.on('payment.failed', function () {
        setUpgradeError('Payment failed. Please try again.')
      })
      razorpay.open()
    } catch (err) {
      setUpgradeError(err.message || 'Failed to initiate upgrade. Please try again.')
    }
  }, [companyId, createOrderMut, verifyPaymentMut])

  const isProcessing = createOrderMut.isPending || verifyPaymentMut.isPending

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Billing</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your subscription plan.
        </p>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Current Plan</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Plan</p>
            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
              {isLoading ? 'Loading...' : planLabel}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Status</p>
            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
              {isLoading ? 'Loading...' : statusLabel}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {plan === 'trial' ? 'Trial Days Remaining' : 'Next Billing Date'}
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
              {isLoading
                ? 'Loading...'
                : plan === 'trial' && daysRemaining !== null
                  ? daysRemaining
                  : plan !== 'trial'
                    ? formatDate(subscription?.current_period_end)
                    : 'Not applicable'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Trial End Date</p>
            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
              {isLoading ? 'Loading...' : subscription?.trial_ends_at ? formatDate(subscription.trial_ends_at) : 'N/A'}
            </p>
          </div>
        </div>
        {isError && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">
            Subscription details could not be loaded. Please refresh and try again.
          </p>
        )}
      </div>

      {plan === 'trial' && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            expired
              ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
              : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300'
          }`}
        >
          {expired
            ? 'Your trial has expired. Choose a plan to continue using premium features.'
            : `Trial active: ${daysRemaining ?? 0} day${daysRemaining === 1 ? '' : 's'} remaining.`}
        </div>
      )}

      {upgradeError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {upgradeError}
        </div>
      )}

      {isProcessing && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
          {createOrderMut.isPending ? 'Setting up checkout...' : 'Verifying payment...'}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Available Plans</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`card p-6 ${plan === 'trial' ? 'ring-2 ring-blue-500' : ''}`}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Trial</h2>
          <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
            Full access during your trial period
          </p>
          <ul className="mt-4 space-y-2">
            <CheckItem>All premium features</CheckItem>
            <CheckItem>Trial workspace access</CheckItem>
            <CheckItem>Upgrade any time</CheckItem>
          </ul>
          <p className="mt-4 text-sm text-blue-600 font-medium">
            {plan === 'trial' ? 'Your current plan' : 'Included for new workspaces'}
          </p>
        </div>

        <div className={`card p-6 ${plan === 'pro' ? 'ring-2 ring-blue-500' : ''}`}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pro</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {'\u20B9'}999<span className="text-base font-normal text-gray-500">/month</span>
          </p>
          <ul className="mt-4 space-y-2">
            {PRO_FEATURES.map((feature) => (
              <CheckItem key={feature}>{feature}</CheckItem>
            ))}
          </ul>
          {plan === 'pro' ? (
            <p className="mt-4 text-sm text-blue-600 font-medium">Your current plan</p>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={isProcessing}
              className="btn-primary mt-4 w-full text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createOrderMut.isPending ? 'Processing...' : 'Upgrade Now'}
            </button>
          )}
        </div>

        <div className={`card p-6 ${plan === 'enterprise' ? 'ring-2 ring-blue-500' : ''}`}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Enterprise</h2>
          <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
            Contact Sales
          </p>
          <ul className="mt-4 space-y-2">
            {ENTERPRISE_FEATURES.map((feature) => (
              <CheckItem key={feature}>{feature}</CheckItem>
            ))}
          </ul>
          {plan === 'enterprise' ? (
            <p className="mt-4 text-sm text-blue-600 font-medium">Your current plan</p>
          ) : (
            <button
              onClick={() => window.location.href = 'mailto:sales@insightai.com?subject=Enterprise Plan'}
              className="btn-outline mt-4 w-full text-center"
            >
              Contact Sales
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
