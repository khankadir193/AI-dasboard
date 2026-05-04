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

    console.log('Signup data:', { email, companyName })
    console.log('Metadata to send:', { company_name: companyName })

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { company_name: companyName },
      },
    })

    console.log('Signup result:', { data, signUpError })

    setIsSubmitting(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    // Tenant provisioning is handled centrally in App.jsx AuthProvider to avoid
    // duplicate inserts caused by multiple concurrent signup/auth events.

    if (!data?.session) {
      console.log('No session after signup - email verification required')
      setInfo('Account created. Check your email to confirm, then sign in. Company and profile will be created automatically on first login.')
    }

    console.log('Redirecting to signin after signup')
    // Always redirect to signin after signup
    navigate('/signin', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Create account</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Start using your dashboard.</p>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {info && <p className="text-sm text-blue-600 dark:text-blue-400">{info}</p>}

        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Company name"
          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm"
          required
          minLength={6}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60"
        >
          {isSubmitting ? 'Creating account...' : 'Sign up'}
        </button>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/signin" className="text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}