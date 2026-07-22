import { LABEL_MAP } from '../api/generators/reportGeneratorUtils'

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function getTypeLabel(type) {
  const map = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    team_productivity: 'Team Productivity',
    executive_summary: 'Executive Summary',
  }
  return map[type] || type || 'Report'
}

export function getMetricLabel(key) {
  return LABEL_MAP[key] || key.replace(/_/g, ' ')
}

export const TYPE_ICONS_MAP = {
  weekly: { icon: 'Clock', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
  monthly: { icon: 'BarChart3', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40' },
  team_productivity: { icon: 'Target', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/40' },
  executive_summary: { icon: 'FileText', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
}
