import { Loader2 } from 'lucide-react'

const TasksList = ({ todos, loading, completedCount, totalCount }) => {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">Recent Tasks</h2>
          <p className="text-sm text-gray-500">
            {loading ? 'Loading...' : `${completedCount} of ${totalCount} completed`}
          </p>
        </div>
        <span className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium px-2.5 py-1 rounded-full">
          Live API
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {todos?.slice(0, 6).map(todo => (
            <div
              key={todo.id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                todo.completed
                  ? 'bg-green-500 border-green-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {todo.completed && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-sm flex-1 ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                {todo.title}
              </span>
              <span className="text-xs text-gray-400">User #{todo.userId}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TasksList

