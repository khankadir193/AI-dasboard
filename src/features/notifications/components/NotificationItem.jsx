import { Clock, CheckCircle2, Dot } from 'lucide-react'
import { Badge } from '../../../components/ui'
import { formatDateTime, timeAgo, NOTIFICATION_STYLES, PRIORITY_STYLES } from '../utils/notificationHelpers'

export default function NotificationItem({ notification, onMarkAsRead, isMarking }) {
  const typeStyle = NOTIFICATION_STYLES[notification.type] || { label: notification.type, badgeVariant: 'default' }
  const priorityStyle = PRIORITY_STYLES[notification.priority] || PRIORITY_STYLES.medium

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isMarking}
      className={`w-full text-left px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors flex items-start gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
        !notification.is_read ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
      }`}
    >
      <div className="pt-1">
        {notification.is_read ? (
          <CheckCircle2 className="text-green-500" size={18} />
        ) : (
          <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-red-500 mt-1" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={typeStyle.badgeVariant} size="sm">{typeStyle.label}</Badge>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${priorityStyle.className}`}>
            {priorityStyle.label}
          </span>
          {!notification.is_read && (
            <Badge variant="outline" size="sm">New</Badge>
          )}
        </div>

        <p className="mt-1.5 text-sm font-medium text-gray-900 dark:text-white">
          {notification.title}
        </p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {notification.message}
        </p>

        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
          <Clock size={12} />
          <span>{timeAgo(notification.created_at)}</span>
          <span>•</span>
          <span>{formatDateTime(notification.created_at)}</span>
        </div>
      </div>

      <div className="flex-shrink-0">
        {!notification.is_read && (
          <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
            <Dot size={14} />
            Unread
          </span>
        )}
      </div>
    </button>
  )
}
