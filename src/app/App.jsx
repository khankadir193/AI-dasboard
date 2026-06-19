import { Route, Routes, Navigate } from 'react-router-dom'
import Layout from '../components/layout/Layout.jsx'
import Dashboard from '../features/dashboard/Dashboard.jsx'
import Analytics from '../features/analytics/Analytics.jsx'
import AIInsightsPage from '../features/ai/pages/AIInsightsPage.jsx'
import DataTable from '../features/users/DataTable.jsx'
import Projects from '../features/projects/Projects.jsx'
import Settings from '../features/organization/Settings.jsx'
import ActivityLogs from '../pages/activity-logs/ActivityLogs.jsx'
import Notifications from '../pages/notifications/Notifications.jsx'
import SignIn from '../features/auth/SignIn.jsx'
import SignUp from '../features/auth/Signup.jsx'
import AuthProvider from '../providers/AuthProvider'
import PrivateRoute from '../routes/PrivateRoute'
import PublicOnlyRoute from '../routes/PublicOnlyRoute'
import RootRedirect from '../routes/RootRedirect'
import AcceptInvitePage from '../features/invitations/pages/AcceptInvitePage.jsx'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Navigate to="/signin" replace />} />
        <Route path="/register" element={<Navigate to="/signup" replace />} />
        <Route path="/signin" element={<PublicOnlyRoute><SignIn /></PublicOnlyRoute>} />
        <Route path="/signup" element={<PublicOnlyRoute><SignUp /></PublicOnlyRoute>} />
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ai-insights" element={<AIInsightsPage />} />
          <Route path="/data-table" element={<DataTable />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/activity-logs" element={<ActivityLogs />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="/invite/:token" element={<AcceptInvitePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
