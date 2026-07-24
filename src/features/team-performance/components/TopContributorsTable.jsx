import { memo, useMemo } from 'react'
import { Users, RotateCcw } from 'lucide-react'
import EmptyState from '../../../components/common/EmptyState'

/**
 * Skeleton row for loading state — matches the animate-pulse pattern from KPISection.jsx
 */
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 animate-pulse">
      <div className="w-7 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="w-14 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="w-14 h-4 bg-gray-200 dark:bg-gray-700 rounded hidden sm:block" />
      <div className="w-14 h-4 bg-gray-200 dark:bg-gray-700 rounded hidden md:block" />
      <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded hidden lg:block" />
    </div>
  )
}

/**
 * TopContributorsTable
 *
 * Displays a ranked list of team members by total action count,
 * derived from activity_logs grouped by user. Zero hardcoded rows.
 *
 * Columns: Rank · Member · Actions · Created · Updated · Contribution %
 *
 * Tie handling: two users with the same totalActions receive the same rank number.
 * The next distinct rank skips appropriately (e.g. 1, 2, 2, 4 — not 1, 2, 2, 3).
 * Tie assignment is done in computeTeamActivity (service layer); this component
 * renders the rank value as-is.
 *
 * Contribution %: each user's share of total team actions, pre-computed by
 * computeTeamActivity as `contributionPct`. Displayed with one decimal place.
 *
 * Props:
 *   data      — array from computeTeamActivity (topContributors)
 *   loading   — boolean
 *   error     — Error | null
 *   onRetry   — () => void
 */
const TopContributorsTable = memo(({ data = [], loading = false, error = null, onRetry }) => {
  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-56 mt-1.5 animate-pulse" />
          </div>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-red-600 dark:text-red-400 mb-3 text-sm">
          Failed to load contributor data
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

  if (!data || data.length === 0) {
    return (
      <div className="card p-8 flex justify-center">
        <EmptyState
          icon={Users}
          title="No contributor data yet"
          description="Activity logs will appear here once team members start using the platform."
        />
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Top Contributors</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Ranked by total actions in the selected period
          </p>
        </div>
        <span className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium px-2.5 py-1 rounded-full">
          {data.length} member{data.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
              <th className="pb-2 pr-4 w-8">#</th>
              <th className="pb-2 pr-4">Member</th>
              <th className="pb-2 pr-4 text-right">Actions</th>
              <th className="pb-2 pr-4 text-right hidden sm:table-cell">Created</th>
              <th className="pb-2 pr-4 text-right hidden md:table-cell">Updated</th>
              <th className="pb-2 text-right hidden lg:table-cell">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {data.map((contributor) => (
              <tr
                key={contributor.userId || contributor.rank}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
              >
                {/* Rank */}
                <td className="py-3 pr-4">
                  <span className={`
                    inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                    ${contributor.rank === 1
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                      : contributor.rank === 2
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        : contributor.rank === 3
                          ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                    }
                  `}>
                    {contributor.rank}
                  </span>
                </td>

                {/* Member avatar + name */}
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold flex-none">
                      {contributor.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white truncate max-w-[140px]">
                      {contributor.name}
                    </span>
                  </div>
                </td>

                {/* Total actions */}
                <td className="py-3 pr-4 text-right">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {contributor.totalActions.toLocaleString()}
                  </span>
                </td>

                {/* Projects created */}
                <td className="py-3 pr-4 text-right hidden sm:table-cell">
                  <span className="text-gray-600 dark:text-gray-400">
                    {contributor.projectsCreated}
                  </span>
                </td>

                {/* Projects updated */}
                <td className="py-3 pr-4 text-right hidden md:table-cell">
                  <span className="text-gray-600 dark:text-gray-400">
                    {contributor.projectsUpdated}
                  </span>
                </td>

                {/* Contribution % */}
                <td className="py-3 text-right hidden lg:table-cell">
                  <div className="flex items-center justify-end gap-2">
                    {/* Mini progress bar */}
                    <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden hidden xl:block">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(contributor.contributionPct ?? 0, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 tabular-nums">
                      {(contributor.contributionPct ?? 0).toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
})

TopContributorsTable.displayName = 'TopContributorsTable'
export default TopContributorsTable
