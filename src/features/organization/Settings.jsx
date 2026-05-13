import { useState, useEffect } from 'react'
import { Sun, Moon, Bell, Shield, User, Key, Check, Building, Lock, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useSelector } from 'react-redux'
import ToggleSwitch from '../../components/ui/ToggleSwitch'

function SettingRow({ icon: Icon, title, description, children, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between py-4 gap-4 transition-all duration-150 ${
        onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 active:scale-[0.99] rounded-lg px-2 -mx-2' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
          <Icon size={16} className="text-gray-600 dark:text-gray-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  )
}


export default function Settings() {
  const { theme, toggleTheme } = useTheme()
  const profileData = useSelector(state => state.profile.profile)
  const authUser = useSelector(state => state.auth.user)
  
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    weeklyAnalytics: true,
    projectActivity: false,
  })
  const [analytics, setAnalytics] = useState({
    trackDashboard: true,
    trackProjects: true,
    weeklySummary: true,
  })
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    role: '',
  })

  // Load profile data from Redux
  useEffect(() => {
    if (profileData) {
      setProfile({
        name: profileData.first_name && profileData.last_name 
          ? `${profileData.first_name} ${profileData.last_name}`.trim()
          : profileData.email?.split('@')[0] || '',
        email: profileData.email || '',
        role: profileData.role || '',
      })
    }
  }, [profileData])

  // Load settings from localStorage
  useEffect(() => {
    const savedNotifications = localStorage.getItem('settings_notifications')
    const savedAnalytics = localStorage.getItem('settings_analytics')
    const savedApiKey = localStorage.getItem('settings_apiKey')
    
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications))
      } catch (e) {
        console.error('Failed to parse notifications:', e)
      }
    }
    if (savedAnalytics) {
      try {
        setAnalytics(JSON.parse(savedAnalytics))
      } catch (e) {
        console.error('Failed to parse analytics:', e)
      }
    }
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
  }, [])

  // Save settings to localStorage
  const saveToLocalStorage = () => {
    localStorage.setItem('settings_notifications', JSON.stringify(notifications))
    localStorage.setItem('settings_analytics', JSON.stringify(analytics))
    if (apiKey) {
      localStorage.setItem('settings_apiKey', apiKey)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    saveToLocalStorage()
    
    // Simulate save delay for UX
    await new Promise(resolve => setTimeout(resolve, 800))
    
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleClearApiKey = () => {
    if (confirm('Are you sure you want to remove your API key?')) {
      setApiKey('')
      localStorage.removeItem('settings_apiKey')
    }
  }

  const handleClearAnalytics = () => {
    if (confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
      localStorage.removeItem('analytics_data')
      alert('Analytics data cleared successfully')
    }
  }

  const maskApiKey = (key) => {
    if (!key) return ''
    if (key.length <= 8) return '••••••••'
    return key.slice(0, 3) + '•'.repeat(Math.min(key.length - 6, 20)) + key.slice(-3)
  }

  return (
    <div className="max-w-2xl space-y-6 stagger">
      {/* Profile */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <User size={16} /> Profile
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
            <input
              type="text"
              value={profile.name || ''}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-600 transition-colors"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email Address</label>
            <input
              type="email"
              value={profile.email || ''}
              readOnly
              className="w-full text-sm bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
            <input
              type="text"
              value={profile.role && profile.role.length > 0 ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1).toLowerCase() : ''}
              readOnly
              className="w-full text-sm bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />} Appearance
        </h3>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <SettingRow
            icon={theme === 'dark' ? Moon : Sun}
            title="Dark Mode"
            description="Switch between light and dark themes"
            onClick={toggleTheme}
          >
            <ToggleSwitch checked={theme === 'dark'} onChange={toggleTheme} />
          </SettingRow>
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Bell size={16} /> Notifications
        </h3>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <SettingRow
            icon={Bell}
            title="Email Notifications"
            description="Receive important updates via email"
            onClick={() => setNotifications(n => ({ ...n, email: !n.email }))}
          >
            <ToggleSwitch checked={notifications.email} onChange={v => setNotifications(n => ({ ...n, email: v }))} />
          </SettingRow>
          <SettingRow
            icon={Bell}
            title="Weekly Analytics Report"
            description="Get weekly summary of your analytics"
            onClick={() => setNotifications(n => ({ ...n, weeklyAnalytics: !n.weeklyAnalytics }))}
          >
            <ToggleSwitch checked={notifications.weeklyAnalytics} onChange={v => setNotifications(n => ({ ...n, weeklyAnalytics: v }))} />
          </SettingRow>
          <SettingRow
            icon={Bell}
            title="Project Activity Alerts"
            description="Notifications for project updates"
            onClick={() => setNotifications(n => ({ ...n, projectActivity: !n.projectActivity }))}
          >
            <ToggleSwitch checked={notifications.projectActivity} onChange={v => setNotifications(n => ({ ...n, projectActivity: v }))} />
          </SettingRow>
        </div>
      </div>

      {/* AI Integration */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Key size={16} /> AI Integration
        </h3>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">OpenAI API Key</label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 pr-10 text-gray-900 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-600 transition-colors font-mono"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Used for AI Insights feature. Stored locally only. {apiKey && `Current: ${maskApiKey(apiKey)}`}</p>
          {apiKey && (
            <button
              onClick={handleClearApiKey}
              className="mt-2 text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
            >
              <Trash2 size={12} /> Remove API Key
            </button>
          )}
        </div>
      </div>

      {/* Workspace Settings */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Building size={16} /> Workspace Settings
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Company Name</label>
            <input
              type="text"
              value={profileData?.companies?.name || ''}
              readOnly
              className="w-full text-sm bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Workspace Email</label>
            <input
              type="email"
              value={profileData?.email || ''}
              readOnly
              className="w-full text-sm bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield size={16} /> Security
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Last Login</label>
            <input
              type="text"
              value={(() => {
                if (!authUser?.last_sign_in_at) return 'N/A'
                try {
                  const date = new Date(authUser.last_sign_in_at)
                  if (isNaN(date.getTime())) return 'N/A'
                  return date.toLocaleString()
                } catch (e) {
                  return 'N/A'
                }
              })()}
              readOnly
              className="w-full text-sm bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed"
            />
          </div>
          <button
            onClick={() => alert('Password change feature coming soon')}
            className="w-full text-sm px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl transition-colors"
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Analytics Preferences */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Bell size={16} /> Analytics Preferences
        </h3>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <SettingRow
            icon={Bell}
            title="Track Dashboard Views"
            description="Allow tracking of dashboard usage"
            onClick={() => setAnalytics(a => ({ ...a, trackDashboard: !a.trackDashboard }))}
          >
            <ToggleSwitch checked={analytics.trackDashboard} onChange={v => setAnalytics(a => ({ ...a, trackDashboard: v }))} />
          </SettingRow>
          <SettingRow
            icon={Bell}
            title="Track Project Activity"
            description="Allow tracking of project interactions"
            onClick={() => setAnalytics(a => ({ ...a, trackProjects: !a.trackProjects }))}
          >
            <ToggleSwitch checked={analytics.trackProjects} onChange={v => setAnalytics(a => ({ ...a, trackProjects: v }))} />
          </SettingRow>
          <SettingRow
            icon={Bell}
            title="Weekly Analytics Summary"
            description="Receive weekly analytics summaries"
            onClick={() => setAnalytics(a => ({ ...a, weeklySummary: !a.weeklySummary }))}
          >
            <ToggleSwitch checked={analytics.weeklySummary} onChange={v => setAnalytics(a => ({ ...a, weeklySummary: v }))} />
          </SettingRow>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-red-200 dark:border-red-900">
        <h3 className="font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
          <AlertTriangle size={16} /> Danger Zone
        </h3>
        <div className="space-y-3">
          <button
            onClick={handleClearAnalytics}
            className="w-full text-sm px-4 py-2.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={14} /> Clear Analytics Data
          </button>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            'Saving...'
          ) : saved ? (
            <>
              <Check size={16} />
              Saved!
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </div>
  )
}
