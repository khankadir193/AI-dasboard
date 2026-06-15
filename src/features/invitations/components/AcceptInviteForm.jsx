import { useState } from 'react'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'

/**
 * AcceptInviteForm - Form for entering password or joining with existing session
 *
 * Render logic:
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ Case A — sessionUser matches invite email:                          │
 * │   → Show "Join Workspace" button only (no password needed)         │
 * │                                                                     │
 * │ Case B — No sessionUser (new user):                                 │
 * │   → Show password + confirm fields + "Accept Invitation" button    │
 * │                                                                     │
 * │ Case C — sessionUser exists but email does NOT match invite:        │
 * │   BUG FIX (Bug 7): Previously the password form was shown but the  │
 * │   submit button was hidden (!sessionUser?.id guard), leaving users  │
 * │   unable to submit. Now we show the submit button whenever the     │
 * │   password form is visible.                                         │
 * └─────────────────────────────────────────────────────────────────────┘
 */
export default function AcceptInviteForm({
  sessionUser,
  sessionEmailMatchesInvite,
  error,
  submitting,
  onSubmit,
  onJoinWorkspace,
  onCancel
}) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleFormSubmit = (e) => {
    e?.preventDefault?.()
    if (submitting) return
    onSubmit(password, confirmPassword)
  }

  // Case A: logged-in user whose email matches the invite — one-click join
  const showJoinButton = Boolean(sessionUser?.id && sessionEmailMatchesInvite)

  // Case B & C: show password form when no user, OR when logged-in email doesn't match
  const showPasswordForm = !showJoinButton

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5">
      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {/* Case A — Join workspace for existing session with matching email */}
      {showJoinButton && (
        <Button
          type="button"
          variant="primary"
          loading={submitting}
          disabled={submitting}
          className="w-full sm:w-auto"
          onClick={onJoinWorkspace}
        >
          Join Workspace
        </Button>
      )}

      {/* Case B & C — Password form for new signup or mismatched session */}
      {showPasswordForm && (
        <>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              disabled={submitting}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Confirm Password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              disabled={submitting}
              autoComplete="new-password"
            />
          </div>
        </>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          disabled={submitting}
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>

        {/* BUG FIX: Show submit whenever the password form is visible.
            Previously: !sessionUser?.id — which hid the button in Case C
            (logged-in user with wrong email), making the form un-submittable. */}
        {showPasswordForm && (
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            Accept Invitation
          </Button>
        )}
      </div>

      {/* Submitting status */}
      {submitting && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Creating your account and joining the workspace...
        </p>
      )}
    </form>
  )
}
