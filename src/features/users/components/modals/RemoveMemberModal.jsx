import Modal from '../../../../components/common/Modal'
import Button from '../../../../components/ui/Button'

export function RemoveMemberModal({ isOpen, onClose, user, isLoading, onConfirm }) {
  return (
    <Modal isOpen={isOpen} onClose={() => !isLoading && onClose()} title="Remove User">
      {user && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Remove <span className="font-medium">{user.displayName}</span> from this
            workspace? This does not delete their auth account.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button type="button" variant="secondary" disabled={isLoading} onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              loading={isLoading}
              disabled={isLoading}
              onClick={onConfirm}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500/30"
            >
              Remove
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
