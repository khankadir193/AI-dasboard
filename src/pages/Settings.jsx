import { useState } from 'react'
import { Sun, Moon, Bell, Shield, User, Key, Check } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

function SettingRow({ icon: Icon, title, description, children }) {
  return (
    <div className="flex items-start justify-between py-4 gap-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
          <Icon size={16} className="text-gray-600 dark:text-gray-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
        enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function Settings() {
  const { theme, toggleTheme } = useTheme()
  const [saved, setSaved] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true,
  })
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
  })

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl space-y-6 stagger">
      {/* Profile */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <User size={16} /> Profile
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Full Name', key: 'name', type: 'text' },
            { label: 'Email Address', key: 'email', type: 'email' },
            { label: 'Role', key: 'role', type: 'text' },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
              <input
                type={field.type}
                value={profile[field.key]}
                onChange={e => setProfile(p => ({ ...p, [field.key]: e.target.value }))}
                className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-600 transition-colors"
              />
            </div>
          ))}
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
          >
            <Toggle enabled={theme === 'dark'} onChange={toggleTheme} />
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
            description="Receive updates via email"
          >
            <Toggle enabled={notifications.email} onChange={v => setNotifications(n => ({ ...n, email: v }))} />
          </SettingRow>
          <SettingRow
            icon={Bell}
            title="Push Notifications"
            description="Browser push notifications"
          >
            <Toggle enabled={notifications.push} onChange={v => setNotifications(n => ({ ...n, push: v }))} />
          </SettingRow>
          <SettingRow
            icon={Bell}
            title="Weekly Digest"
            description="Summary of weekly activity"
          >
            <Toggle enabled={notifications.weekly} onChange={v => setNotifications(n => ({ ...n, weekly: v }))} />
          </SettingRow>
        </div>
      </div>

      {/* API Key */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Key size={16} /> API Configuration
        </h3>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">OpenAI API Key</label>
          <input
            type="password"
            placeholder="sk-••••••••••••••••••••••••••••••••"
            className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white outline-none focus:border-blue-400 transition-colors font-mono"
          />
          <p className="text-xs text-gray-400 mt-1.5">Used for the AI Insights feature. Stored locally only.</p>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-primary flex items-center gap-2 px-6">
          {saved ? (
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
