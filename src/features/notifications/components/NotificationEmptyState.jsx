import { Bell } from 'lucide-react'
import EmptyState from '../../../components/common/EmptyState'

export default function NotificationEmptyState({ hasActiveFilters }) {
  return (
    <div className="py-12">
      <EmptyState
        icon={Bell}
        title="No notifications"
        description={
          hasActiveFilters
            ? 'Try adjusting your filters.'
            : 'You have no notifications yet. Notifications will appear here as activity happens.'
        }
      />
    </div>
  )
}
