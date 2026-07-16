import Modal from '../../../../components/common/Modal'
import Button from '../../../../components/ui/Button'

export function EditRoleModal({
  isOpen,
  onClose,
  user,
  roleValue,
  onRoleChange,
  editableRoles,
  isLoading,
  onSave,
}) {
  return (
    <Modal isOpen={isOpen} onClose={() => !isLoading && onClose()} title="Edit Role">
      {user && (
        <form onSubmit={onSave} className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Update role for <span className="font-medium">{user.displayName}</span>
          </p>
          <select
            value={roleValue}
            onChange={(e) => onRoleChange(e.target.value)}
            disabled={isLoading}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            {editableRoles.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button type="button" variant="secondary" disabled={isLoading} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isLoading} disabled={isLoading}>
              Save
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
