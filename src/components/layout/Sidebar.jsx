import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  LayoutDashboard,
  BarChart3,
  Sparkles,
  Table2,
  Settings,
  Zap,
  X,
  Lock,
  Building2,
  FolderKanban,
  Bell,
  History,
} from 'lucide-react'

import clsx from 'clsx'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/ai-insights', icon: Sparkles, label: 'AI Insights' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/data-table', icon: Table2, label: 'Team Management' },
  { to: '/activity-logs', icon: History, label: 'Activity Logs' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]



const authItems = [
  { to: '/signin', icon: Lock, label: 'Sign In' },
  { to: '/signup', icon: Building2, label: 'Sign Up' },
]

export default function Sidebar({ open, onClose }) {
  const { user } = useSelector((state) => state.auth)
  const { profile } = useSelector((state) => state.profile)

  const isAuthenticated = Boolean(user && (profile || user.email))

  const displayName = user?.email?.split('@')[0] || 'User'
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const email = user?.email || ''

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed lg:relative z-30 h-[100vh] overflow-hidden flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-transform duration-300',
          open
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 flex-none">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">
              InsightAI
            </span>
          </div>
          <button onClick={onClose} className="lg:hidden btn-ghost p-1.5">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-hidden flex flex-col">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3 flex-none">
            Main Menu
          </p>

          <div className="flex-1 flex flex-col justify-center space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx('sidebar-link', isActive && 'active')
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User profile (pinned to bottom) */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex-none">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {displayName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {email || 'No email'}
              </p>
            </div>
          </div>
        </div>

        {/* Auth links (hidden when authenticated) */}
        {!isAuthenticated && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex-none">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
              Account
            </p>
            {authItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx('sidebar-link', isActive && 'active')
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </aside>
    </>
  )
}
