/**
 * UserTableRow Component - Single user row with actions
 */
import { MoreVertical, Eye, Edit2, Ban, Trash2 } from 'lucide-react'

export function UserTableRow({
  user,
  isActionMenuOpen,
  onActionMenuToggle,
  onActionMenuRef,
  onView,
  onEditRole,
  onToggleStatus,
  onDelete
}) {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      {/* ID */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
        {user?.formattedId || 'N/A'}
      </td>

      {/* User with Avatar */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full bg-gradient-to-br ${
              user?.avatarGradient || 'from-gray-400 to-gray-600'
            } flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}
          >
            {user?.initials || 'U'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.displayName || 'Unknown'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user?.email?.split('@')[0] || ''}
            </p>
          </div>
        </div>
      </td>

      {/* Email */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
        {user?.email || 'N/A'}
      </td>

      {/* Company */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          {user?.companyName || 'No Company'}
        </span>
      </td>

      {/* Role */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            user?.roleClass || 'bg-blue-100 text-blue-800'
          }`}
        >
          {user?.role || 'Viewer'}
        </span>
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            user?.statusClass || 'bg-green-100 text-green-800'
          }`}
        >
          {user?.status || 'Active'}
        </span>
      </td>

      {/* Joined At */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {user?.joinedAt || 'N/A'}
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right relative" ref={onActionMenuRef}>
        <button
          onClick={() => onActionMenuToggle(isActionMenuOpen === user?.id ? null : user?.id)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <MoreVertical size={18} />
        </button>

        {/* Action Menu Dropdown */}
        {isActionMenuOpen === user?.id && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
            <button
              onClick={() => onView(user)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Eye size={14} />
              View User
            </button>
            <button
              onClick={() => onEditRole(user)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Edit2 size={14} />
              Edit Role
            </button>
            <button
              onClick={() => onToggleStatus(user)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Ban size={14} />
              {user.isActive ? 'Suspend User' : 'Activate User'}
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            <button
              onClick={() => onDelete(user)}
              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
            >
              <Trash2 size={14} />
              Delete User
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}
