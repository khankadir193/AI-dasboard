import { Menu, Bell, Sun, Moon, Search } from 'lucide-react'

import { useTheme } from '../../context/ThemeContext'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { clearUser } from '../../store/slices/authSlice'
import { clearProfile } from '../../store/slices/profileSlice'
import { clearTenant } from '../../store/slices/tenantSlice'
import { clearProjects } from '../../store/slices/projectsSlice'
import { useSearch } from '../../hooks/useSearch'
import { useUnreadCount } from '../../features/notifications/hooks/useNotifications'
import SearchResults from '../common/SearchResults'

const pageTitles = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Welcome back, John Doe' },
  '/analytics': { title: 'Analytics', subtitle: 'Deep dive into your metrics' },
  '/ai-insights': { title: 'AI Insights', subtitle: 'Powered by GPT-4' },
  '/projects': { title: 'Projects', subtitle: 'Manage all your projects' },
  '/data-table': { title: 'Team Management', subtitle: 'Manage members, roles, and access' },
  '/activity-logs': { title: 'Activity Logs', subtitle: 'Track your recent activities' },
  '/notifications': { title: 'Notifications', subtitle: 'View your recent notifications' },
  '/audit-logs': { title: 'Audit Trail', subtitle: 'View workspace activity history' },
  '/settings': { title: 'Settings', subtitle: 'Manage your preferences' },
  '/billing': { title: 'Billing', subtitle: 'Manage your subscription plan' },
}


function NotificationBell() {
  const navigate = useNavigate()
  const { data: unreadCount = 0 } = useUnreadCount()

  return (
    <button
      onClick={() => navigate('/notifications')}
      className="btn-ghost p-2 relative"
      type="button"
      title="Notifications"
    >
      <Bell size={18} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}

export default function Header({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme()
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { user, loading } = useSelector((state) => state.auth)
  const { profile } = useSelector((state) => state.profile)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const page = pageTitles[pathname] || { title: 'Dashboard', subtitle: '' }

  const [searchQuery, setSearchQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef(null)

  const { data: results, isLoading: searchLoading, error: searchError } = useSearch(profile?.company_id, searchQuery)

  useEffect(() => {
    if (!showResults) return
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showResults])

  const displayName = user?.email?.split('@')[0] || 'User'
  const subtitle = pathname === '/dashboard' ? `Welcome back, ${displayName}` : page.subtitle

  const handleSignOut = async () => {
    try {
      dispatch(clearUser())
      dispatch(clearProfile())
      dispatch(clearTenant())
      dispatch(clearProjects())
      queryClient.removeQueries({ queryKey: ['subscription'] })
      queryClient.removeQueries({ queryKey: ['featureFlags'] })

      await supabase.auth.signOut()

      navigate('/signin', { replace: true })
    } catch (error) {
      console.error('Sign out error:', error)
      navigate('/signin', { replace: true })
    }
  }

  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center gap-4">
      <button onClick={onMenuClick} className="btn-ghost p-2 -ml-2">
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white leading-none">
          {page.title}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>

      {/* Search */}
      <div className="hidden md:block relative" ref={searchRef}>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2 w-64">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setShowResults(true) }}
            onFocus={() => setShowResults(true)}
            onKeyDown={e => { if (e.key === 'Escape') setShowResults(false) }}
            className="bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none flex-1"
          />
        </div>
        {showResults && searchQuery.trim().length >= 2 && (
          <SearchResults
            data={results}
            isLoading={searchLoading}
            error={searchError}
            onSelect={() => { setShowResults(false); setSearchQuery('') }}
            onClose={() => setShowResults(false)}
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button onClick={toggleTheme} className="btn-ghost p-2" title="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <NotificationBell />

        <button
          onClick={handleSignOut}
          disabled={loading}
          className="ml-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-60"
        >
          {loading ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </header>
  )
}
