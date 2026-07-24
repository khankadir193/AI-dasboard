import { memo, useMemo } from 'react'
import { Activity, RotateCcw } from 'lucide-react'
import EmptyState from '../../../components/common/EmptyState'

// ─── Colour scale ─────────────────────────────────────────────────────────────
// Absolute thresholds per the spec (0/1-2/3-5/6+).
// Both light-mode and dark-mode Tailwind classes provided.
const COLOR_LEVELS = [
  { max: 0,        bg: 'bg-gray-100 dark:bg-gray-800',   label: 'No activity' },
  { max: 2,        bg: 'bg-green-100 dark:bg-green-900', label: '1–2 actions' },
  { max: 5,        bg: 'bg-green-300 dark:bg-green-700', label: '3–5 actions' },
  { max: Infinity, bg: 'bg-green-600 dark:bg-green-500', label: '6+ actions' },
]

function getCellColor(count) {
  for (const level of COLOR_LEVELS) {
    if (count <= level.max) return level.bg
  }
  return COLOR_LEVELS[COLOR_LEVELS.length - 1].bg
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

// ─── Detect display mode from range ──────────────────────────────────────────
function getDisplayMode(data, dateRange) {
  const preset = dateRange?.preset
  // Preset-based detection
  if (preset === 'today' || preset === '1') return 'hourly'
  if (preset === '7') return 'daily'
  if (preset === '30') return 'monthly'

  // Fallback: infer from data length
  const days = data?.length ?? 0
  if (days <= 1) return 'hourly'
  if (days <= 7) return 'daily'
  if (days <= 35) return 'monthly'
  return 'github' // 90-day GitHub-style contribution grid
}

// ─── Sub-renderers by mode ────────────────────────────────────────────────────

/**
 * Hourly view (Today / 1-day range).
 * 24 horizontal blocks, one per hour.
 * Data prop is expected to be the heatmapDays array for a single day
 * (1 element). We treat the existing day-level data as a best-effort render
 * since activity_logs records are grouped by day, not hour, in the current
 * service — the single block shows total activity for that day.
 *
 * If hourly data is eventually needed, the service can be extended
 * independently without changing this component interface.
 */
function HourlyView({ data, maxCount }) {
  // For now we render a single-day summary as a full-width colored bar
  const totalCount = data.reduce((s, d) => s + d.count, 0)
  const bg = getCellColor(totalCount)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {Array.from({ length: 24 }, (_, h) => {
          // Distribute total count roughly across hours — service currently
          // doesn't store per-hour breakdowns, so we render uniform intensity.
          const bg = getCellColor(totalCount > 0 ? Math.max(1, Math.round(totalCount / 24)) : 0)
          return (
            <div
              key={h}
              className={`rounded-sm ${bg} flex-none`}
              style={{ width: 20, height: 28 }}
              title={`${h.toString().padStart(2, '0')}:00 — ${h + 1 === 24 ? '23:59' : `${(h + 1).toString().padStart(2, '0')}:00`}`}
              aria-label={`Hour ${h}`}
            />
          )
        })}
      </div>
      <div className="flex justify-between text-[9px] text-gray-400 dark:text-gray-600">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:59</span>
      </div>
    </div>
  )
}

/**
 * Daily view (Last 7 days).
 * 7 vertical bars labelled by day name.
 */
function DailyView({ data }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((day) => {
        const heightPct = maxCount > 0 ? Math.max(4, Math.round((day.count / maxCount) * 100)) : 4
        const bg = getCellColor(day.count)
        const label = new Date(day.date + 'T00:00:00Z').toLocaleDateString('en-US', {
          weekday: 'short', timeZone: 'UTC',
        })
        const fullDate = new Date(day.date + 'T00:00:00Z').toLocaleDateString('en-US', {
          weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC',
        })
        const tooltip = [
          fullDate,
          `Actions: ${day.count}`,
          day.contributors > 0 ? `Contributors: ${day.contributors}` : null,
          day.topAction ? `Top action: ${day.topAction}` : null,
        ].filter(Boolean).join('\n')

        return (
          <div
            key={day.date}
            className="flex flex-col items-center gap-1 flex-1"
          >
            <div
              className={`w-full rounded-t-sm ${bg} transition-all`}
              style={{ height: `${heightPct}%` }}
              title={tooltip}
              aria-label={tooltip}
            />
            <span className="text-[9px] text-gray-400 dark:text-gray-600">{label}</span>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Monthly calendar view (Last 30 days).
 * Calendar-style grid: rows = weeks, columns = days of week (Mon–Sun).
 */
function MonthlyView({ data }) {
  const { weeks, maxCount } = useMemo(() => {
    let mx = 0
    data.forEach((d) => { if (d.count > mx) mx = d.count })
    const toGridRow = (dow) => (dow === 0 ? 6 : dow - 1)
    const firstDow = data[0]?.dayOfWeek ?? 1
    const startPad = toGridRow(firstDow)
    const cells = [...Array(startPad).fill(null), ...data]
    const wks = []
    for (let i = 0; i < cells.length; i += 7) wks.push(cells.slice(i, i + 7))
    return { weeks: wks, maxCount: mx }
  }, [data])

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="overflow-x-auto pb-1">
      <div className="inline-flex flex-col gap-0">
        {/* Day-of-week header */}
        <div className="flex mb-1" style={{ paddingLeft: '0px' }}>
          {DAY_LABELS.map((d) => (
            <div
              key={d}
              className="text-[9px] text-gray-400 dark:text-gray-600 text-center"
              style={{ width: 24, marginRight: 2 }}
            >
              {d[0]}
            </div>
          ))}
        </div>
        {/* Week rows */}
        {weeks.map((week, rowIdx) => (
          <div key={rowIdx} className="flex items-center gap-0">
            {week.map((cell, colIdx) => {
              if (!cell) {
                return (
                  <span
                    key={colIdx}
                    style={{ width: 22, height: 22, marginRight: 2, marginBottom: 2 }}
                  />
                )
              }
              const bg = getCellColor(cell.count)
              const fullDate = new Date(cell.date + 'T00:00:00Z').toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
              })
              const tooltip = [
                fullDate,
                `Actions: ${cell.count}`,
                cell.contributors > 0 ? `Contributors: ${cell.contributors}` : null,
                cell.topAction ? `Top action: ${cell.topAction}` : null,
              ].filter(Boolean).join('\n')

              return (
                <div
                  key={colIdx}
                  className={`rounded-sm transition-opacity hover:opacity-75 ${bg}`}
                  style={{ width: 22, height: 22, marginRight: 2, marginBottom: 2, flexShrink: 0 }}
                  title={tooltip}
                  aria-label={tooltip}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * GitHub-style contribution grid (90-day / large ranges).
 * Rows = days of week (Mon=top), columns = weeks (oldest→newest).
 * Month labels rendered above columns.
 */
function GitHubView({ data, dateRange }) {
  const { weeks, maxCount, monthLabels } = useMemo(() => {
    let mx = 0
    data.forEach((d) => { if (d.count > mx) mx = d.count })

    const toGridRow = (dow) => (dow === 0 ? 6 : dow - 1)
    const firstDow = data[0]?.dayOfWeek ?? 1
    const startPad = toGridRow(firstDow)
    const cells = [...Array(startPad).fill(null), ...data]
    const wks = []
    for (let i = 0; i < cells.length; i += 7) wks.push(cells.slice(i, i + 7))

    // Month labels: label placed at the column where a new month starts
    const labels = []
    let lastMonth = null
    wks.forEach((week, colIdx) => {
      const firstReal = week.find((c) => c !== null)
      if (firstReal) {
        const d = new Date(firstReal.date + 'T00:00:00Z')
        const m = d.getUTCMonth()
        if (m !== lastMonth) {
          labels.push({
            colIdx,
            label: d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
          })
          lastMonth = m
        }
      }
    })

    return { weeks: wks, maxCount: mx, monthLabels: labels }
  }, [data])

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="overflow-x-auto pb-1">
      <div className="inline-flex flex-col gap-0">
        {/* Month labels row */}
        <div className="flex mb-1" style={{ paddingLeft: '28px' }}>
          {weeks.map((_, colIdx) => {
            const monthLabel = monthLabels.find((m) => m.colIdx === colIdx)
            return (
              <div
                key={colIdx}
                className="text-[9px] text-gray-400 dark:text-gray-600"
                style={{ width: 14, marginRight: 2, flexShrink: 0 }}
              >
                {monthLabel?.label || ''}
              </div>
            )
          })}
        </div>

        {/* Day rows */}
        {DAY_LABELS.map((dayLabel, rowIdx) => (
          <div key={rowIdx} className="flex items-center gap-0">
            <span
              className="text-[9px] text-gray-400 dark:text-gray-600 text-right flex-none"
              style={{ width: 24, marginRight: 4 }}
            >
              {rowIdx % 2 === 0 ? dayLabel : ''}
            </span>
            {weeks.map((week, colIdx) => {
              const cell = week[rowIdx]
              if (!cell) {
                return (
                  <span
                    key={colIdx}
                    style={{ width: 12, height: 12, marginRight: 2, marginBottom: 2, flexShrink: 0 }}
                  />
                )
              }
              const bg = getCellColor(cell.count)
              const fullDate = new Date(cell.date + 'T00:00:00Z').toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
              })
              const tooltip = [
                fullDate,
                `Actions: ${cell.count}`,
                cell.contributors > 0 ? `Contributors: ${cell.contributors}` : null,
                cell.topAction ? `Top action: ${cell.topAction}` : null,
              ].filter(Boolean).join('\n')

              return (
                <div
                  key={colIdx}
                  className={`rounded-sm transition-opacity hover:opacity-75 ${bg}`}
                  style={{ width: 12, height: 12, marginRight: 2, marginBottom: 2, flexShrink: 0 }}
                  title={tooltip}
                  aria-label={`${fullDate}: ${cell.count} actions`}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * ActivityHeatmap
 *
 * Dynamically adapts its display mode based on the active date range:
 *   Today / 1-day → hourly blocks (24 columns)
 *   7 days        → daily vertical bars
 *   30 days       → calendar month grid
 *   90 days / any → GitHub-style contribution grid
 *   Custom        → auto-detected from data length
 *
 * Empty state rule (per spec):
 *   Show "No activity" ONLY when activity_logs contains zero events.
 *   Do NOT show empty state if records exist but all daily counts happen to be zero
 *   (e.g. all activity was on a single day so other days show 0).
 *   The correct check is data.length === 0, not data.every(d => d.count === 0).
 *
 * Tooltip (per spec): Date, Contributor Count, Action Count, Top Action.
 *
 * Props:
 *   data      — Array<{ date, count, dayOfWeek, contributors, topAction }>
 *   loading   — boolean
 *   error     — Error | null
 *   onRetry   — () => void
 *   dateRange — { preset, startDate, endDate, label }
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

  // ── Empty state: ONLY when zero records exist in activity_logs ─────────────
  // data.length === 0 means the service returned no log rows at all.
  // data.every(d => d.count === 0) is intentionally NOT used — that would hide
  // the heatmap even when logs exist (e.g. sparse activity across many days).
  if (!data || data.length === 0) {
    return (
      <div className="card p-8 flex justify-center">
        <EmptyState
          icon={Activity}
          title={`No activity in ${(dateRange?.label ?? 'selected range').toLowerCase()}`}
          description="Actions logged by your team will appear here as a contribution heatmap."
        />
      </div>
    )
  }

  const mode = getDisplayMode(data, dateRange)
  const totalActions = data.reduce((sum, d) => sum + d.count, 0)
  const rangeLabel = dateRange?.label ?? '90 Days'

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Activity Heatmap</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {totalActions.toLocaleString()} action{totalActions !== 1 ? 's' : ''} in {rangeLabel.toLowerCase()}
          </p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          <span>Less</span>
          {COLOR_LEVELS.map((l, i) => (
            <span
              key={i}
              className={`w-3 h-3 rounded-sm ${l.bg}`}
              title={l.label}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Dynamic grid */}
      {mode === 'hourly' && <HourlyView data={data} />}
      {mode === 'daily' && <DailyView data={data} />}
      {mode === 'monthly' && <MonthlyView data={data} />}
      {(mode === 'github' || !['hourly', 'daily', 'monthly'].includes(mode)) && (
        <GitHubView data={data} dateRange={dateRange} />
      )}
    </div>
  )
})

ActivityHeatmap.displayName = 'ActivityHeatmap'
export default ActivityHeatmap
