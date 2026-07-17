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
  ScrollText,
  CreditCard,
  ShieldCheck,
  ChevronRight,
  ChevronsLeft,
  FileText,
} from 'lucide-react'

import clsx from 'clsx'
import { useSubscription } from '../../services/subscriptionService'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/ai-insights', icon: Sparkles, label: 'AI Insights' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/data-table', icon: Table2, label: 'Team Management' },
  { to: '/activity-logs', icon: History, label: 'Activity Logs' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/audit-logs', icon: ScrollText, label: 'Audit Trail' },
]

const supportItems = [
  { to: '/billing', icon: CreditCard, label: 'Billing' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

const authItems = [
  { to: '/signin', icon: Lock, label: 'Sign In' },
  { to: '/signup', icon: Building2, label: 'Sign Up' },
]

const navLinkClass = ({ isActive }) =>
  clsx(
    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
    isActive
      ? 'bg-blue-50 text-blue-700 shadow-[inset_3px_0_0_#2563eb] dark:bg-blue-950/70 dark:text-blue-300'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-white'
  )

export default function Sidebar({ open, onClose }) {
  const { user } = useSelector((state) => state.auth)
  const { profile } = useSelector((state) => state.profile)
  const companyId = profile?.company_id
  const { data: subscription } = useSubscription(companyId)

  const isAuthenticated = Boolean(user && (profile || user.email))
  const displayName =
    profile?.full_name ||
    profile?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'User'
  const email = user?.email || ''
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const showUpgradeCard =
    isAuthenticated &&
    subscription &&
    subscription?.subscription_plan !== 'pro' &&
    subscription?.subscription_plan !== 'enterprise'

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed lg:relative z-30 h-[100vh] overflow-hidden flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 shadow-[1px_0_24px_rgba(15,23,42,0.04)] transition-transform duration-300',
          open
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden'
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex-none">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-500/30">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-semibold text-lg text-gray-950 dark:text-white truncate">
              InsightAI
            </span>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost p-1.5 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.18em] mb-3 px-3 flex-none">
            Main Menu
          </p>

          <div className="flex flex-col space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={navLinkClass}>
                <Icon size={18} className="flex-none" />
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
          </div>

          <div className="mt-5 space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            {showUpgradeCard && (
            <div className="rounded-lg border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-3 shadow-sm dark:border-blue-900/70 dark:from-blue-950/50 dark:via-gray-900 dark:to-violet-950/40">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm dark:bg-gray-800 dark:text-blue-300">
                  <ShieldCheck size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-950 dark:text-white">
                    Upgrade to Pro
                  </p>
                  <p className="mt-0.5 text-xs leading-4 text-gray-600 dark:text-gray-400">
                    Unlock advanced analytics, unlimited projects, and priority support.
                  </p>
                </div>
              </div>
              <NavLink
                to="/billing"
                className="mt-2.5 inline-flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-blue-800 dark:bg-gray-900 dark:text-blue-300 dark:hover:bg-blue-950/60"
              >
                Upgrade Now
                <ChevronRight size={14} />
              </NavLink>
            </div>
            )}

            <div className="space-y-1">
              {supportItems.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} className={navLinkClass}>
                  <Icon size={18} className="flex-none" />
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
              <button
                type="button"
                onClick={onClose}
                className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-gray-50 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-white"
              >
                <ChevronsLeft size={18} className="flex-none" />
                <span className="truncate">Collapse</span>
              </button>
            </div>
          </div>
        </div>

        {isAuthenticated && (
          <div className="flex-none border-t border-gray-100 p-3 dark:border-gray-800">
            <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-3 dark:border-gray-800 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold shadow-sm shadow-blue-500/25">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-950 dark:text-white truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {email || 'No email'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isAuthenticated && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex-none">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
              Account
            </p>
            {authItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={navLinkClass}>
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
