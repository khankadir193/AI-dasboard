import { Loader2 } from 'lucide-react'

export default function NotificationSkeleton() {
  return (
    <div className="flex items-center justify-center h-64 gap-3 text-gray-500">
      <Loader2 className="animate-spin h-6 w-6" />
      <span>Loading notifications...</span>
    </div>
  )
}
