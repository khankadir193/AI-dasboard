import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '../components/layout/Layout.jsx'
import Dashboard from '../features/dashboard/Dashboard.jsx'
import Analytics from '../features/analytics/Analytics.jsx'
import AIInsights from '../features/ai/AIInsights.jsx'
import DataTable from '../features/dashboard/DataTable.jsx'
import Projects from '../features/projects/Projects.jsx'
import Settings from '../features/organization/Settings.jsx'
import SignIn from '../features/auth/SignIn.jsx'
import SignUp from '../features/auth/Signup.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  )
}

function PrivateRoute({ children }) {
  try {
    const { session, isLoading } = useAuth()

    if (isLoading) return <FullScreenLoader />
    if (!session) return <Navigate to="/signin" replace />

    return children
  } catch (error) {
    console.error('PrivateRoute error:', error)
    return <Navigate to="/signin" replace />
  }
}

function PublicOnlyRoute({ children }) {
  try {
    const { session, isLoading } = useAuth()

    if (isLoading) return <FullScreenLoader />
    if (session) return <Navigate to="/dashboard" replace />

    return children
  } catch (error) {
    console.error('PublicOnlyRoute error:', error)
    return children // Allow access on error to prevent infinite redirects
  }
}

function RootRedirect() {
  try {
    const { session, isLoading } = useAuth()

    if (isLoading) return <FullScreenLoader />
    return <Navigate to={session ? '/dashboard' : '/signin'} replace />
  } catch (error) {
    console.error('RootRedirect error:', error)
    return <Navigate to="/signin" replace />
  }
}

function ProtectedLayout() {
  return <Layout />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route
        path="/signin"
        element={(
          <PublicOnlyRoute>
            <SignIn />
          </PublicOnlyRoute>
        )}
      />
      <Route path="/login" element={<Navigate to="/signin" replace />} />
      <Route
        path="/signup"
        element={(
          <PublicOnlyRoute>
            <SignUp />
          </PublicOnlyRoute>
        )}
      />
      <Route path="/register" element={<Navigate to="/signup" replace />} />

      <Route
        path="/dashboard"
        element={(
          <PrivateRoute>
            <ProtectedLayout />
          </PrivateRoute>
        )}
      >
        <Route index element={<Dashboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="ai-insights" element={<AIInsights />} />
        <Route path="data-table" element={<DataTable />} />
        <Route path="projects" element={<Projects />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
