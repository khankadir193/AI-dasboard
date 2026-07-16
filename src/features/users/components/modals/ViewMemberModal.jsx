import Modal from '../../../../components/common/Modal'
import Button from '../../../../components/ui/Button'

export function ViewMemberModal({ isOpen, onClose, user }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Details">
      {user && (
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</p>
            <p className="text-gray-900 dark:text-white">{user.email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Role</p>
            <p className="text-gray-900 dark:text-white">{user.role || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</p>
            <p className="text-gray-900 dark:text-white">{user.status || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Joined</p>
            <p className="text-gray-900 dark:text-white">{user.joinedAt || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Company</p>
            <p className="text-gray-900 dark:text-white">{user.companyName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Invited by</p>
            <p className="text-gray-900 dark:text-white font-mono text-xs">
              {user.invited_by || 'N/A'}
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
