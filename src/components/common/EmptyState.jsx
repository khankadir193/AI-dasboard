/**
 * EmptyState - Reusable empty state component
 * For displaying when no data is found
 */
export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center">
      {Icon && (
        <Icon className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
      )}
      <p className="font-medium text-gray-900 dark:text-white">{title}</p>
      {description && (
        <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </div>
  )
}
