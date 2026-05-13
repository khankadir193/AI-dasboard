import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

export default function SignUp() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return
    setError('')
    setInfo('')
    setIsSubmitting(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { company_name: companyName },
      },
    })

    setIsSubmitting(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    // Tenant provisioning is handled centrally in App.jsx AuthProvider to avoid
    // duplicate inserts caused by multiple concurrent signup/auth events.

    if (!data?.session) {
      setInfo(
        'Account created. Check your email to confirm, then sign in. Company and profile will be created automatically on first login.'
      )
    }

    // Always redirect to signin after signup
    navigate('/signin', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="relative isolate">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 left-1/2 h-72 w-[38rem] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute top-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute bottom-0 -right-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 sm:px-6 lg:flex-row lg:items-stretch lg:px-8">
          {/* Left branding (desktop) */}
          <div className="hidden flex-1 lg:flex lg:flex-col lg:justify-center">
            <div className="relative px-6 pr-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/60 px-3 py-1 text-xs font-medium text-gray-700 backdrop-blur dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-200">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.15)]" />
                Launch your workspace
              </div>

              <h2 className="mt-6 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                Create your account
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-gray-600 dark:text-gray-300">
                Get started in minutes. Configure your team, connect projects, and ship faster with a clean SaaS experience.
              </p>

              <div className="mt-7 grid gap-3">
                {[
                  {
                    title: 'Role-ready by default',
                    desc: 'Teams and permissions stay organized from day one.',
                  },
                  {
                    title: 'Production UX polish',
                    desc: 'Premium layout, accessible inputs, smooth focus states.',
                  },
                  {
                    title: 'Smooth onboarding',
                    desc: 'Clear feedback for errors and confirmations.',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white/60 p-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/35"
                  >
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700 ring-1 ring-blue-600/15 dark:text-blue-300">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-700" />
                <span className="whitespace-nowrap">No setup headaches</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-700" />
              </div>
            </div>
          </div>

          {/* Right auth */}
          <div className="flex w-full flex-1 items-center justify-center py-10 sm:py-14 lg:py-0">
            <div className="w-full max-w-md">
              <div
                className="rounded-3xl border border-gray-200 bg-white/70 p-7 shadow-xl shadow-blue-900/5 backdrop-blur dark:border-gray-800 dark:bg-gray-900/40 dark:shadow-none"
                style={{ animation: 'fadeInUp 420ms ease-out both' }}
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Create account</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Start using your dashboard.</p>
                  </div>

                  <div className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white/80 text-gray-700 backdrop-blur dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-200 sm:flex">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                </div>

                {error && (
                  <div className="mb-4">
                    <div className="p-3 bg-red-50/60 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3">
                      <div className="mt-0.5 h-8 w-8 rounded-xl bg-red-600/10 text-red-700 dark:text-red-300 ring-1 ring-red-600/15 dark:ring-red-600/20 flex items-center justify-center">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <path d="M12 9v4" />
                          <path d="M12 17h.01" />
                        </svg>
                      </div>
                      <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                    </div>
                  </div>
                )}

                {info && (
                  <div className="mb-4">
                    <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-start gap-3">
                      <div className="mt-0.5 h-8 w-8 rounded-xl bg-blue-600/10 text-blue-700 dark:text-blue-300 ring-1 ring-blue-600/15 dark:ring-blue-600/20 flex items-center justify-center">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </div>
                      <p className="text-sm text-blue-800 dark:text-blue-200">{info}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" aria-label="Sign up form">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white" htmlFor="signup-company">
                      Company
                    </label>
                    <input
                      id="signup-company"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Company name"
                      className="h-11 w-full rounded-2xl border border-gray-200 bg-white/80 px-4 text-sm text-gray-900 shadow-inner-sm backdrop-blur transition-all duration-200 placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-gray-700 dark:bg-gray-900/60 dark:text-white dark:focus-visible:ring-offset-gray-950"
                      required
                      autoComplete="organization"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white" htmlFor="signup-email">
                      Email
                    </label>
                    <input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-11 w-full rounded-2xl border border-gray-200 bg-white/80 px-4 text-sm text-gray-900 shadow-inner-sm backdrop-blur transition-all duration-200 placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-gray-700 dark:bg-gray-900/60 dark:text-white dark:focus-visible:ring-offset-gray-950"
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white" htmlFor="signup-password">
                      Password
                    </label>
                    <input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="h-11 w-full rounded-2xl border border-gray-200 bg-white/80 px-4 text-sm text-gray-900 shadow-inner-sm backdrop-blur transition-all duration-200 placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-gray-700 dark:bg-gray-900/60 dark:text-white dark:focus-visible:ring-offset-gray-950"
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative mt-2 flex h-11 w-full items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-all duration-200 hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-60 disabled:hover:bg-blue-600 dark:focus-visible:ring-offset-gray-950"
                  >
                    <span className="absolute inset-0 overflow-hidden rounded-2xl">
                      <span className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                    </span>
                    <span className="relative">{isSubmitting ? 'Creating account...' : 'Sign up'}</span>
                  </button>

                  <p className="text-center text-sm text-gray-600 dark:text-gray-300">
                    Already have an account?{' '}
                    <Link
                      to="/signin"
                      className="font-medium text-gray-900 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-white dark:focus-visible:ring-offset-gray-950"
                    >
                      Sign in
                    </Link>
                  </p>
                </form>
              </div>

              <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
              `}</style>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

