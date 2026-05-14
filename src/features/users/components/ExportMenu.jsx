/**
 * ExportMenu Component
 */
import { Download, FileText, FileSpreadsheet } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'

export function ExportMenu({
  isAdmin,
  hasData,
  onExportCSV,
  onExportExcel,
  onExportPDF
}) {
  const [isOpen, setIsOpen] = useState(false)
  const exportDropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = event => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const isDisabled = !isAdmin || !hasData

  const handleExport = (exportFn) => {
    exportFn()
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={exportDropdownRef}>
      <button
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        disabled={isDisabled}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm font-medium transition-colors ${
          isDisabled
            ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
        title={
          !isAdmin
            ? 'Only admins can export data'
            : !hasData
              ? 'No data to export'
              : ''
        }
      >
        <Download size={16} />
        Export
      </button>

      {isOpen && !isDisabled && (
        <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
          <button
            onClick={() => handleExport(onExportCSV)}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <FileText size={14} />
            CSV
          </button>
          <button
            onClick={() => handleExport(onExportExcel)}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <FileSpreadsheet size={14} />
            Excel
          </button>
          <button
            onClick={() => handleExport(onExportPDF)}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <FileText size={14} />
            PDF
          </button>
        </div>
      )}
    </div>
  )
}
