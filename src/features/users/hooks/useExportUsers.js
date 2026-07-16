import { useCallback } from 'react'
import { exportUsers } from '../tableExportService'

export function useExportUsers(sortedUsers) {
  const handleExportCSV = useCallback(() => {
    exportUsers('csv', sortedUsers)
  }, [sortedUsers])

  const handleExportExcel = useCallback(() => {
    exportUsers('xlsx', sortedUsers)
  }, [sortedUsers])

  const handleExportPDF = useCallback(() => {
    exportUsers('pdf', sortedUsers)
  }, [sortedUsers])

  return { handleExportCSV, handleExportExcel, handleExportPDF }
}
