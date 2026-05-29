/**
 * UserTableRow Component - Single user row with actions
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical, Eye, Edit2, Ban, Trash2 } from 'lucide-react'
import { canManageTeam, buildTeamActions } from '../../../utils/teamPermissions'

const MENU_WIDTH = 220
const menuItemClass =
  'w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 whitespace-nowrap'

export function UserTableRow({
  user,
  isActionMenuOpen,
  onActionMenuToggle,
  currentUserId,
  actorRole,
  onView,
  onEditRole,
  onToggleStatus,
  onDelete,
  onResendInviteUI,
  onCancelPendingInviteUI,
  onCopyInviteLinkUI
}) {
  const triggerRef = useRef(null)
  const [menuStyle, setMenuStyle] = useState(null)

  const isPending = user?.status === 'Pending'
  const isSelf = Boolean(
    currentUserId && user?.id && String(currentUserId) === String(user.id)
  )
  const targetRole = user?.roleKey || String(user?.role || '').toLowerCase()
  const canManage = canManageTeam(actorRole) && !isPending
  const showFullTeamMenu = canManage && !isSelf && !isPending
  const isInactive = user?.status === 'Inactive' || user?.membership_status === 'inactive'
  const isMenuOpen = isActionMenuOpen === user?.id

  const actions = useMemo(
    () => buildTeamActions({ actorRole, targetRole, isSelf, isPending }),
    [actorRole, targetRole, isSelf, isPending]
  )

  useLayoutEffect(() => {
    if (!isMenuOpen) {
      setMenuStyle(null)
      return
    }

    const placeMenu = () => {
      const trigger = triggerRef.current
      if (!trigger) return

      const rect = trigger.getBoundingClientRect()
      const menuHeight = showFullTeamMenu ? 200 : 56
      const openUpward = rect.bottom + menuHeight > window.innerHeight - 8
      let top = openUpward ? rect.top - menuHeight - 4 : rect.bottom + 4
      let left = rect.right - MENU_WIDTH

      left = Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8))
      top = Math.max(8, Math.min(top, window.innerHeight - menuHeight - 8))

      setMenuStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${MENU_WIDTH}px`,
        zIndex: 9999
      })
    }

    placeMenu()
    window.addEventListener('scroll', placeMenu, true)
    window.addEventListener('resize', placeMenu)

    return () => {
      window.removeEventListener('scroll', placeMenu, true)
      window.removeEventListener('resize', placeMenu)
    }
  }, [isMenuOpen, showFullTeamMenu])

  useEffect(() => {
    if (!isMenuOpen) return
    console.log('[TeamActions] currentUserRole:', actorRole)
    console.log('[TeamActions] targetUserRole:', targetRole)
    console.log('[TeamActions] availableActions:', actions)
    console.log('[TeamActions] showFullTeamMenu:', showFullTeamMenu)
  }, [isMenuOpen, actorRole, targetRole, actions, showFullTeamMenu])

  const handleToggleMenu = () => {
    onActionMenuToggle(isMenuOpen ? null : user?.id)
  }

  const closeMenu = () => onActionMenuToggle(null)

  const menuContent = isMenuOpen && menuStyle && (
    <div
      data-team-action-menu
      role="menu"
      className="rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
      style={menuStyle}
    >
      {isPending ? (
        <>
          <button
            type="button"
            onClick={() => {
              closeMenu()
              onResendInviteUI?.(user)
            }}
            className={menuItemClass}
          >
            <Eye size={14} className="shrink-0" />
            Resend Invite
          </button>
          <button
            type="button"
            onClick={() => {
              closeMenu()
              onCancelPendingInviteUI?.(user)
            }}
            className={menuItemClass}
          >
            <Ban size={14} className="shrink-0" />
            Cancel Invite
          </button>
          <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
          <button
            type="button"
            onClick={() => {
              closeMenu()
              onCopyInviteLinkUI?.(user)
            }}
            className={menuItemClass}
          >
            <Edit2 size={14} className="shrink-0" />
            Copy Invite Link
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              closeMenu()
              onView(user)
            }}
            className={menuItemClass}
          >
            <Eye size={14} className="shrink-0" />
            View User
          </button>
          {showFullTeamMenu && (
            <>
              <button
                type="button"
                onClick={() => {
                  closeMenu()
                  onEditRole(user)
                }}
                className={menuItemClass}
              >
                <Edit2 size={14} className="shrink-0" />
                Edit Role
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMenu()
                  onToggleStatus(user)
                }}
                className={menuItemClass}
              >
                <Ban size={14} className="shrink-0" />
                {isInactive ? 'Activate User' : 'Suspend User'}
              </button>
              <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
              <button
                type="button"
                onClick={() => {
                  closeMenu()
                  onDelete(user)
                }}
                className={`${menuItemClass} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20`}
              >
                <Trash2 size={14} className="shrink-0" />
                Remove User
              </button>
            </>
          )}
        </>
      )}
    </div>
  )

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
        {user?.formattedId || 'N/A'}
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
              isPending
                ? 'bg-yellow-50 text-yellow-800 ring-1 ring-yellow-200/70 dark:bg-yellow-900/40 dark:text-yellow-200 dark:ring-yellow-800/30'
                : `bg-gradient-to-br text-white ${user?.avatarGradient || 'from-gray-400 to-gray-600'}`
            }`}
          >
            {isPending ? 'P' : user?.initials || 'U'}
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

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
        {user?.email || 'N/A'}
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          {user?.companyName || 'No Company'}
        </span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
            user?.roleClass || 'bg-blue-100 text-blue-800'
          }`}
        >
          {user?.role || 'Viewer'}
        </span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
            user?.statusClass || 'bg-green-100 text-green-800'
          }`}
        >
          {user?.status || 'Active'}
        </span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {user?.joinedAt || 'N/A'}
      </td>

      <td className="px-6 py-4 text-right align-middle">
        <div className="inline-flex justify-end" data-team-actions-root>
          {(canManage || isPending) && (
            <button
              ref={triggerRef}
              type="button"
              onClick={handleToggleMenu}
              className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
            >
              <MoreVertical size={18} />
            </button>
          )}
        </div>
        {menuContent && createPortal(menuContent, document.body)}
      </td>
    </tr>
  )
}
