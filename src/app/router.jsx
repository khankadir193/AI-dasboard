import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App.jsx';
import ProtectedRoute from '../components/auth/ProtectedRoute.jsx';

// Lazy load feature components for better performance
const loadDashboard = () => import('../features/dashboard/Dashboard.jsx');
const loadAnalytics = () => import('../features/analytics/Analytics.jsx');
const loadAIInsights = () => import('../features/ai/AIInsights.jsx');
const loadDataTable = () => import('../features/dashboard/DataTable.jsx');
const loadSettings = () => import('../features/organization/Settings.jsx');
const loadProjects = () => import('../features/projects/Projects.jsx');
const loadSignup = () => import('../features/auth/Signup.jsx');
const loadLogin = () => import('../features/auth/Login.jsx');

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: (
          <div>
            {console.log('Router: Navigating to /signup from index route')}
            <Navigate to="/signup" replace />
          </div>
        ),
      },
      {
        path: 'signup',
        lazy: async () => {
          const { default: Signup } = await loadSignup();
          return { Component: Signup };
        },
      },
      {
        path: 'login',
        lazy: async () => {
          const { default: Login } = await loadLogin();
          return { Component: Login };
        },
      },
      {
        path: 'dashboard',
        lazy: async () => {
          const { default: Dashboard } = await loadDashboard();
          return { 
            Component: () => (
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            )
          };
        },
      },
      {
        path: 'analytics',
        lazy: async () => {
          const { default: Analytics } = await loadAnalytics();
          return { 
            Component: () => (
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            )
          };
        },
      },
      {
        path: 'ai-insights',
        lazy: async () => {
          const { default: AIInsights } = await loadAIInsights();
          return { 
            Component: () => (
              <ProtectedRoute>
                <AIInsights />
              </ProtectedRoute>
            )
          };
        },
      },
      {
        path: 'data-table',
        lazy: async () => {
          const { default: DataTable } = await loadDataTable();
          return { 
            Component: () => (
              <ProtectedRoute>
                <DataTable />
              </ProtectedRoute>
            )
          };
        },
      },
      {
        path: 'projects',
        lazy: async () => {
          const { default: Projects } = await loadProjects();
          return { 
            Component: () => (
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            )
          };
        },
      },
      {
        path: 'settings',
        lazy: async () => {
          const { default: Settings } = await loadSettings();
          return { 
            Component: () => (
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            )
          };
        },
      },
    ],
  },
]);
