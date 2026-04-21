import { subDays, format } from 'date-fns'

// Generate last N days of revenue data
export function generateRevenueData(days = 30) {
  return Array.from({ length: days }, (_, i) => {
    const date = subDays(new Date(), days - 1 - i)
    return {
      date: format(date, 'MMM dd'),
      revenue: Math.floor(Math.random() * 8000 + 4000),
      expenses: Math.floor(Math.random() * 3000 + 1500),
    }
  })
}

// Generate user growth data
export function generateUserData(months = 12) {
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  let users = 1200
  return monthNames.slice(0, months).map(month => {
    users += Math.floor(Math.random() * 300 + 100)
    return {
      month,
      users,
      newUsers: Math.floor(Math.random() * 300 + 100),
    }
  })
}

// Category distribution
export function generateCategoryData() {
  return [
    { name: 'Enterprise', value: 4200, fill: '#3b82f6' },
    { name: 'Professional', value: 3100, fill: '#8b5cf6' },
    { name: 'Starter', value: 1800, fill: '#10b981' },
    { name: 'Trial', value: 900, fill: '#f59e0b' },
  ]
}

// Format currency
export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value)
}

// Format large numbers
export function formatNumber(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toString()
}
