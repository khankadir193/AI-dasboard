import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useSelector } from 'react-redux'

export default function ProtectedRoute({ children }) {
  const { user, loading, profile } = useSelector((state) => state.auth)

  // FIX: If we're still loading auth state OR profile is not ready, show loading
  // This ensures profile is loaded before allowing access to protected routes
  if (loading || !profile) {
    console.log("PROTECTED_ROUTE -> Loading:", loading, "Profile:", profile ? "ready" : "not ready")
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, redirect to signin
  if (!user) {
    return <Navigate to="/signin" replace />
  }

  // If authenticated and profile loaded, render protected content
  return children
}
