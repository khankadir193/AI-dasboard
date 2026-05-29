/**
 * Table configuration and constants for Users DataTable
 */

export const PAGE_SIZE = 5

// Role color mappings - matching schema: admin, manager, analyst, viewer
export const ROLE_COLORS = {
  'admin': 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100',
'manager': 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
  'analyst': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100',
  'viewer': 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
}

// Status color mappings
export const STATUS_COLORS = {
  'Active': 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
  'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
  'Inactive': 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
  'Removed': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
  'Suspended': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
}


// Avatar gradient options - deterministic based on index
export const AVATAR_GRADIENTS = [
  'from-blue-400 to-blue-600',
  'from-indigo-400 to-indigo-600',
  'from-teal-400 to-teal-600',
  'from-amber-400 to-amber-600',
  'from-rose-400 to-rose-600',
  'from-violet-400 to-violet-600'
]

// Table column definitions
export const TABLE_COLUMNS = [
  { key: 'formattedId', label: 'ID', sortable: true },
  { key: 'user', label: 'User', sortable: true, sortKey: 'user' },
  { key: 'email', label: 'Email', sortable: true, sortKey: 'email' },
  { key: 'company', label: 'Company', sortable: true, sortKey: 'company' },
  { key: 'role', label: 'Role', sortable: true, sortKey: 'role' },
  { key: 'status', label: 'Status', sortable: true, sortKey: 'status' },
  { key: 'joinedAt', label: 'Joined At', sortable: true, sortKey: 'joinedAt' },
  { key: 'actions', label: 'Actions', sortable: false }
]

// Export format configurations
export const EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'xlsx',
  PDF: 'pdf'
}

export const EXPORT_COLUMNS = [
  { key: 'formattedId', label: 'ID' },
  { key: 'displayName', label: 'User' },
  { key: 'email', label: 'Email' },
  { key: 'companyName', label: 'Company' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'joinedAt', label: 'Joined At' }
]
