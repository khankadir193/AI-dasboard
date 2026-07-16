import Modal from '../../../../components/common/Modal'
import Button from '../../../../components/ui/Button'

export function SuspendMemberModal({ isOpen, onClose, user, isLoading, onConfirm }) {
  const isInactive =
    user?.status === 'Inactive' || user?.membership_status === 'inactive'

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isLoading && onClose()}
      title={isInactive ? 'Activate User' : 'Suspend User'}
    >
      {user && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {isInactive
              ? `Activate ${user.displayName}? They will regain dashboard access.`
              : `Are you sure you want to suspend ${user.displayName}? They will lose dashboard access.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button type="button" variant="secondary" disabled={isLoading} onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" variant="primary" loading={isLoading} disabled={isLoading} onClick={onConfirm}>
              Confirm
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
