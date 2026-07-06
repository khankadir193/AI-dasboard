import { useCallback, useState, useEffect } from 'react'

const RANGE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom Range' },
]

function toISO(date) {
  return date.toISOString().split('T')[0]
}

function computeRange(preset) {
  const end = new Date()
  const start = new Date()
  if (preset !== 'today') {
    start.setDate(start.getDate() - parseInt(preset, 10))
  }
  return { startDate: toISO(start), endDate: toISO(end) }
}

function isValidDateRange(startDate, endDate) {
  if (!startDate || !endDate) return false
  const s = new Date(startDate)
  const e = new Date(endDate)
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return false
  return s <= e
}

function isFutureDate(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return d > today
}

export default function DateRangeFilter({ value, onChange }) {
  const preset = value?.preset || '30'
  const isCustom = preset === 'custom'

  const [localStart, setLocalStart] = useState(value?.startDate || '')
  const [localEnd, setLocalEnd] = useState(value?.endDate || '')

  useEffect(() => {
    if (isCustom) {
      setLocalStart(value?.startDate || '')
      setLocalEnd(value?.endDate || '')
    }
  }, [isCustom, value?.startDate, value?.endDate])

  const handleClick = useCallback((newPreset) => {
    if (newPreset === 'custom') {
      onChange({ preset: 'custom', startDate: '', endDate: '', label: 'Custom Range' })
      return
    }
    const range = computeRange(newPreset)
    const label = RANGE_PRESETS.find(p => p.value === newPreset)?.label || ''
    onChange({ preset: newPreset, ...range, label })
  }, [onChange])

  const handleApply = useCallback(() => {
    if (!isValidDateRange(localStart, localEnd)) return
    if (isFutureDate(localStart) || isFutureDate(localEnd)) return
    onChange({ preset: 'custom', startDate: localStart, endDate: localEnd, label: 'Custom Range' })
  }, [localStart, localEnd, onChange])

  const handleReset = useCallback(() => {
    setLocalStart('')
    setLocalEnd('')
    onChange({ preset: '30', ...computeRange('30'), label: 'Last 30 Days' })
  }, [onChange])

  const rangeValid = isValidDateRange(localStart, localEnd)
  const hasFuture = isFutureDate(localStart) || isFutureDate(localEnd)
  const bothFilled = localStart && localEnd
  const validationMessage = !rangeValid && bothFilled
    ? 'End date must be after start date'
    : hasFuture
    ? 'Future dates are not allowed'
    : ''

  return (
    <div className="flex flex-wrap items-center gap-2">
      {RANGE_PRESETS.map(({ value: v, label }) => (
        <button
          key={v}
          onClick={() => handleClick(v)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            preset === v
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {label}
        </button>
      ))}
      {isCustom && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={localStart}
            max={toISO(new Date())}
            onChange={e => setLocalStart(e.target.value)}
            className="px-2 py-1 text-xs border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-gray-100"
          />
          <span className="text-xs text-gray-500">to</span>
          <input
            type="date"
            value={localEnd}
            max={toISO(new Date())}
            onChange={e => setLocalEnd(e.target.value)}
            className="px-2 py-1 text-xs border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-gray-100"
          />
          <button
            onClick={handleApply}
            disabled={!rangeValid || hasFuture || !bothFilled}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Apply
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Reset
          </button>
          {validationMessage && (
            <span className="text-xs text-red-500">{validationMessage}</span>
          )}
        </div>
      )}
    </div>
  )
}
