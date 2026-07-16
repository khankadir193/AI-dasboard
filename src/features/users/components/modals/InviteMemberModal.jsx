import Modal from '../../../../components/common/Modal'
import Input from '../../../../components/ui/Input'
import Button from '../../../../components/ui/Button'

export function InviteMemberModal({
  isOpen,
  onClose,
  onSendInvite,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  inviteMessage,
  setInviteMessage,
  isSending,
  inviteEmailError,
  isAdmin,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Member"
      size="md"
      closeOnBackdrop
      showCloseButton
    >
      <div className="max-h-[calc(100vh-10rem)] overflow-y-auto pr-0.5">
        <form onSubmit={onSendInvite} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Email Address
            </label>
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="john@company.com"
              disabled={isSending}
              error={inviteEmailError || undefined}
              aria-invalid={!!inviteEmailError}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {inviteEmailError
                ? inviteEmailError
                : 'Send an invitation email to add a new member.'}
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              disabled={isSending}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {isAdmin && <option value="Admin">Admin</option>}
              <option value="Manager">Manager</option>
              <option value="Analyst">Analyst</option>
              <option value="Viewer">Viewer</option>
            </select>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/30 p-3">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-2">
                Role access (what they can do)
              </p>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200">
                    Admin
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Full workspace access</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                    Manager
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Manage projects and team operations</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                    Analyst
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Access analytics, dashboards, and reports</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
                    Viewer
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Read-only workspace access</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Optional Message
            </label>

            <textarea
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              disabled={isSending}
              placeholder="You've been invited to join the InsightAI workspace."
              rows={2}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              disabled={isSending}
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSending}
              disabled={isSending || !inviteEmail || !!inviteEmailError}
              className="w-full sm:w-auto"
            >
              Send Invite
            </Button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
            An email with an acceptance link will be sent. Invites expire after 7 days.
          </p>
        </form>
      </div>
    </Modal>
  )
}
