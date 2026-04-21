import { Menu, Bell, Sun, Moon, Search } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useLocation } from 'react-router-dom'

const pageTitles = {
  '/dashboard':   { title: 'Dashboard',    subtitle: 'Welcome back, John 👋' },
  '/analytics':   { title: 'Analytics',    subtitle: 'Deep dive into your metrics' },
  '/ai-insights': { title: 'AI Insights',  subtitle: 'Powered by GPT-4' },
  '/data':        { title: 'Data Table',   subtitle: 'Manage and explore your data' },
  '/settings':    { title: 'Settings',     subtitle: 'Manage your preferences' },
}

export default function Header({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme()
  const { pathname } = useLocation()
  const page = pageTitles[pathname] || { title: 'Dashboard', subtitle: '' }

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
        <p className="text-sm text-gray-500 mt-0.5">{page.subtitle}</p>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2 w-64">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none flex-1"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button onClick={toggleTheme} className="btn-ghost p-2" title="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="btn-ghost p-2 relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  )
}
