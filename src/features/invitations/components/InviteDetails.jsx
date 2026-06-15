import Button from '../../../components/ui/Button'
import { supabase } from '../../../lib/supabaseClient'

/**
 * InviteDetails - Display invite information and session status
 * Shows: invite header, company name, email, role, and session status banner
 */
export default function InviteDetails({
  invite,
  companyName,
  sessionUser,
  inviteRoleLabel,
  sessionEmailMatchesInvite
}) {
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <>
      {/* Header and company info */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Accept Invitation</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          You&apos;ve been invited to join{' '}
          <span className="font-medium">{companyName || 'your workspace'}</span>
        </p>
      </div>

      {/* Invite and role details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Invited email
          </label>
          <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
            {invite?.email}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Role</label>
          <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
            {inviteRoleLabel || 'Viewer'}
          </div>
        </div>
      </div>

      {/* Session status - Matching email */}
      {sessionUser?.id && sessionEmailMatchesInvite && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-800 dark:bg-blue-950/30">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            You are signed in as <span className="font-medium">{sessionUser.email}</span>. Click
            below to join this workspace.
          </p>
        </div>
      )}

      {/* Session status - Different email */}
      {sessionUser?.id && !sessionEmailMatchesInvite && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            You are signed in as {sessionUser.email}, but this invite was sent to {invite?.email}.
            Sign out or use the correct account.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mt-3"
            onClick={handleSignOut}
          >
            Sign out
          </Button>
        </div>
      )}
    </>
  )
}
