import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App.jsx';

// Lazy load feature components for better performance
const loadDashboard = () => import('../features/dashboard/Dashboard.jsx');
const loadAnalytics = () => import('../features/analytics/Analytics.jsx');
const loadAIInsights = () => import('../features/ai/AIInsights.jsx');
const loadDataTable = () => import('../features/dashboard/DataTable.jsx');
const loadSettings = () => import('../features/organization/Settings.jsx');

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        lazy: async () => {
          const { default: Dashboard } = await loadDashboard();
          return { Component: Dashboard };
        },
      },
      {
        path: 'analytics',
        lazy: async () => {
          const { default: Analytics } = await loadAnalytics();
          return { Component: Analytics };
        },
      },
      {
        path: 'ai-insights',
        lazy: async () => {
          const { default: AIInsights } = await loadAIInsights();
          return { Component: AIInsights };
        },
      },
      {
        path: 'data-table',
        lazy: async () => {
          const { default: DataTable } = await loadDataTable();
          return { Component: DataTable };
        },
      },
      {
        path: 'settings',
        lazy: async () => {
          const { default: Settings } = await loadSettings();
          return { Component: Settings };
        },
      },
    ],
  },
]);
