/**
 * Export service for users data
 * Handles CSV, Excel, and PDF export formats
 */

import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { EXPORT_COLUMNS } from './tableConstants'
import { buildExportData } from './tableUtils'

/**
 * Export users to CSV format
 */
export const exportToCSV = (users, filename = 'users-export.csv') => {
  if (!users || users.length === 0) return

  const exportData = buildExportData(users, EXPORT_COLUMNS)

  const headers = Object.keys(exportData[0] || {}).join(',')
  const rows = exportData
    .map(row => Object.values(row).map(val => `"${val}"`).join(','))
    .join('\n')
  const csv = headers + '\n' + rows

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  downloadFile(blob, filename)
}

/**
 * Export users to Excel format
 */
export const exportToExcel = (users, filename = 'users-export.xlsx') => {
  if (!users || users.length === 0) return

  const exportData = buildExportData(users, EXPORT_COLUMNS)

  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Users')
  XLSX.writeFile(workbook, filename)
}

/**
 * Export users to PDF format
 */
export const exportToPDF = (users, filename = 'users-export.pdf') => {
  if (!users || users.length === 0) return

  const exportData = users.map(user => [
    user?.formattedId || 'N/A',
    user?.displayName || 'Unknown',
    user?.email || '',
    user?.companyName || 'No Company',
    user?.role || 'Viewer',
    user?.status || 'Active',
    user?.joinedAt || 'N/A'
  ])

  const doc = new jsPDF()
  autoTable(doc, {
    head: [['ID', 'User', 'Email', 'Company', 'Role', 'Status', 'Joined At']],
    body: exportData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] }
  })
  doc.save(filename)
}

/**
 * Generic export function
 */
export const exportUsers = (format, users, filename) => {
  switch (format) {
    case 'csv':
      exportToCSV(users, filename)
      break
    case 'xlsx':
      exportToExcel(users, filename)
      break
    case 'pdf':
      exportToPDF(users, filename)
      break
    default:
      console.warn(`Unknown export format: ${format}`)
  }
}

/**
 * Helper function to download file
 */
const downloadFile = (blob, filename) => {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}
