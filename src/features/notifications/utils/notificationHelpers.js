export function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString([], {
    year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = Date.now()
  const d = new Date(dateStr).getTime()
  if (isNaN(d)) return ''
  const diff = Math.max(0, now - d)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export const NOTIFICATION_STYLES = {
  project_created: { label: 'Project Created', badgeVariant: 'success' },
  project_updated: { label: 'Project Updated', badgeVariant: 'primary' },
  project_deleted: { label: 'Project Deleted', badgeVariant: 'danger' },
  project_deadline_approaching: { label: 'Deadline Approaching', badgeVariant: 'warning' },
  user_invited: { label: 'User Invited', badgeVariant: 'info' },
  user_joined: { label: 'User Joined', badgeVariant: 'success' },
  high_productivity: { label: 'High Productivity', badgeVariant: 'success' },
  low_productivity: { label: 'Low Productivity', badgeVariant: 'warning' },
  analytics_alert: { label: 'Analytics Alert', badgeVariant: 'info' },
}

export const PRIORITY_STYLES = {
  low: { label: 'Low', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  medium: { label: 'Medium', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300' },
  critical: { label: 'Critical', className: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' },
}
