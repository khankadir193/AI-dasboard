import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth)
  const [authTimeout, setAuthTimeout] = useState(false)

  // Debug logging
  console.log('ProtectedRoute - Auth state:', { isAuthenticated, isLoading, user })

  // Set a timeout for auth initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log('Auth initialization taking too long, forcing redirect')
        setAuthTimeout(true)
      }
    }, 3000) // 3 second timeout

    return () => clearTimeout(timer)
  }, [isLoading])

  // If auth times out or still loading after timeout, redirect to signup
  if (authTimeout || (isLoading && authTimeout)) {
    console.log('Auth timeout, redirecting to signup')
    return <Navigate to="/signup" replace />
  }

  // If we're still loading auth state, show loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, redirect to signup
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to signup')
    return <Navigate to="/signup" replace />
  }

  // If authenticated, render protected content
  console.log('Authenticated, rendering protected content')
  return children
}
