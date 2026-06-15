import { useState, useEffect } from 'react'

const SLOW_THRESHOLD_MS = 15000

/**
 * FullScreenLoader
 * @param {string} [message] - Optional label shown below the spinner
 * @param {boolean} [showTimeout=true] - Whether to show a "taking longer" fallback after SLOW_THRESHOLD_MS
 */
export default function FullScreenLoader({ message = 'Loading...', showTimeout = true }) {
  const [isSlow, setIsSlow] = useState(false)

  useEffect(() => {
    if (!showTimeout) return
    const id = setTimeout(() => setIsSlow(true), SLOW_THRESHOLD_MS)
    return () => clearTimeout(id)
  }, [showTimeout])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        {!isSlow ? (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">{message}</p>
          </>
        ) : (
          <div className="space-y-3 max-w-xs mx-auto">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto opacity-50" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Taking longer than expected…
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">
              If this persists, please{' '}
              <a
                href="/signin"
                className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300"
              >
                sign in again
              </a>
              {' '}or{' '}
              <button
                onClick={() => window.location.reload()}
                className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300"
              >
                refresh the page
              </button>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
