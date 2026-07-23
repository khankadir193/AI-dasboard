import { memo, useMemo } from 'react'
import { Activity, RotateCcw } from 'lucide-react'
import EmptyState from '../../../components/common/EmptyState'

// ─── Colour scale ─────────────────────────────────────────────────────────────
// Thresholds are relative to the dataset's max count so the palette looks
// meaningful for both low-activity (max = 3) and high-activity (max = 50+) orgs.
// Each level has a light-mode and dark-mode Tailwind class pair.
const LEVELS = [
  { min: 0, max: 0, bg: 'bg-gray-100 dark:bg-gray-800', label: 'No activity' },
  { min: 1, max: 0.25, bg: 'bg-green-100 dark:bg-green-900', label: 'Low' },
  { min: 0.25, max: 0.5, bg: 'bg-green-300 dark:bg-green-700', label: 'Moderate' },
  { min: 0.5, max: 0.75, bg: 'bg-green-500 dark:bg-green-600', label: 'Active' },
  { min: 0.75, max: Infinity, bg: 'bg-green-700 dark:bg-green-500', label: 'Very active' },
]

function getLevel(count, maxCount) {
  if (count === 0 || maxCount === 0) return LEVELS[0]
  const ratio = count / maxCount
  // Walk threshold levels (skip the 0-count entry)
  for (let i = LEVELS.length - 1; i >= 1; i--) {
    if (ratio >= LEVELS[i].min) return LEVELS[i]
  }
  return LEVELS[1]
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function HeatmapSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="mb-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-44" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-60 mt-1.5" />
      </div>
      <div className="h-28 bg-gray-100 dark:bg-gray-800 rounded-lg" />
    </div>
  )
}

/**
 * ActivityHeatmap — GitHub-style 90-day contribution heatmap.
 *
 * Implementation: CSS grid + Tailwind classes (no external library).
 * Justification: a 7-row × ~13-column grid of colored divs is entirely
 * achievable with Tailwind and native CSS grid — adding a third-party
 * heatmap library would have no benefit for this use case.
 *
 * Layout:
 *   Rows = days of week (Mon=0 … Sun=6 in grid terms)
 *   Columns = weeks (oldest left, newest right)
 *   Cells are 12×12px with a 2px gap. overflow-x-auto for mobile.
 *
 * Color scale:
 *   Thresholds are relative to the max day-count in the dataset so the
 *   gradient is always meaningful regardless of absolute activity volume.
 *
 * Dark mode: every Tailwind bg class has a `dark:` counterpart.
 *
 * Props:
 *   data     — Array<{ date: string, count: number, dayOfWeek: number }>
 *              (90-element contiguous array from activityHeatmapService)
 *   loading  — boolean
 *   error    — Error | null
 *   onRetry  — () => void
 */
const ActivityHeatmap = memo(({ data = [], loading = false, error = null, onRetry, dateRange }) => {
  if (loading) return <HeatmapSkeleton />

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-red-600 dark:text-red-400 mb-3 text-sm">
          Failed to load activity heatmap
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RotateCcw size={14} />
            Retry
          </button>
        )}
      </div>
    )
  }

  const isEmpty = !data || data.length === 0 || data.every((d) => d.count === 0)

  const rangeLabel = dateRange?.label ?? 'selected range'

  if (isEmpty) {
    return (
      <div className="card p-8 flex justify-center">
        <EmptyState
          icon={Activity}
          title={`No activity in ${rangeLabel.toLowerCase()}`}
          description="Actions logged by your team will appear here as a contribution heatmap."
        />
      </div>
    )
  }

  // ── Build week columns ──────────────────────────────────────────────────────
  // Group contiguous days into weeks (Mon-anchored). The first partial week
  // is padded at the top with null cells.
  const { weeks, maxCount } = useMemo(() => {
    let mx = 0
    data.forEach((d) => { if (d.count > mx) mx = d.count })

    // Determine what day-of-week index Monday maps to in our grid rows (0=Mon)
    const toGridRow = (dow) => (dow === 0 ? 6 : dow - 1) // Sun→6, Mon→0, …, Sat→5

    // Pad start so first day aligns to its grid row
    const firstDow = data[0]?.dayOfWeek ?? 1
    const startPad = toGridRow(firstDow) // number of empty cells before day 0

    const cells = [
      ...Array(startPad).fill(null),
      ...data,
    ]

    // Split into columns of 7
    const wks = []
    for (let i = 0; i < cells.length; i += 7) {
      wks.push(cells.slice(i, i + 7))
    }

    return { weeks: wks, maxCount: mx }
  }, [data])

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const totalActions = data.reduce((sum, d) => sum + d.count, 0)

  // Month labels: pick one label per month change along the column axis
  const monthLabels = useMemo(() => {
    const labels = []
    let lastMonth = null
    weeks.forEach((week, colIdx) => {
      const firstReal = week.find((c) => c !== null)
      if (firstReal) {
        const d = new Date(firstReal.date)
        const m = d.getMonth()
        if (m !== lastMonth) {
          labels.push({
            colIdx,
            label: d.toLocaleDateString('en-US', { month: 'short' }),
          })
          lastMonth = m
        }
      }
    })
    return labels
  }, [weeks])

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Activity Heatmap</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {totalActions.toLocaleString()} action{totalActions !== 1 ? 's' : ''} in {(dateRange?.label ?? '90 Days').toLowerCase()}
          </p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          <span>Less</span>
          {LEVELS.map((l, i) => (
            <span
              key={i}
              className={`w-3 h-3 rounded-sm ${l.bg}`}
              title={l.label}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col gap-0">
          {/* Month labels row */}
          <div
            className="flex mb-1"
            style={{ paddingLeft: '28px' }}
          >
            {weeks.map((_, colIdx) => {
              const monthLabel = monthLabels.find((m) => m.colIdx === colIdx)
              return (
                <div
                  key={colIdx}
                  className="text-[9px] text-gray-400 dark:text-gray-600"
                  style={{ width: '14px', marginRight: '2px', flexShrink: 0 }}
                >
                  {monthLabel?.label || ''}
                </div>
              )
            })}
          </div>

          {/* Day rows */}
          {DAY_LABELS.map((dayLabel, rowIdx) => (
            <div key={rowIdx} className="flex items-center gap-0">
              {/* Day label */}
              <span
                className="text-[9px] text-gray-400 dark:text-gray-600 text-right flex-none"
                style={{ width: '24px', marginRight: '4px' }}
              >
                {rowIdx % 2 === 0 ? dayLabel : ''}
              </span>

              {/* Week cells for this row */}
              {weeks.map((week, colIdx) => {
                const cell = week[rowIdx]
                if (!cell) {
                  return (
                    <span
                      key={colIdx}
                      style={{ width: '12px', height: '12px', marginRight: '2px', marginBottom: '2px', flexShrink: 0 }}
                    />
                  )
                }
                const level = getLevel(cell.count, maxCount)
                const formattedDate = new Date(cell.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
                return (
                  <div
                    key={colIdx}
                    className={`rounded-sm transition-opacity hover:opacity-75 ${level.bg}`}
                    style={{ width: '12px', height: '12px', marginRight: '2px', marginBottom: '2px', flexShrink: 0 }}
                    title={`${formattedDate}: ${cell.count} action${cell.count !== 1 ? 's' : ''}`}
                    aria-label={`${formattedDate}: ${cell.count} actions`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

ActivityHeatmap.displayName = 'ActivityHeatmap'
export default ActivityHeatmap
