import { Loader2 } from 'lucide-react'

export default function ReportsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card p-5 animate-pulse">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-5 w-3/5 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="flex gap-2">
                  <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-12 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
              <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
