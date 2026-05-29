const normalizeRole = (role) => String(role || '').toLowerCase().trim()

export const TEAM_ROLES = ['admin', 'manager', 'analyst', 'viewer']

export function canManageTeam(actorRole) {
  const role = normalizeRole(actorRole)
  return role === 'admin' || role === 'manager'
}

export function canEditTargetMember(actorRole, targetRole) {
  const actor = normalizeRole(actorRole)
  const target = normalizeRole(targetRole)
  if (actor === 'admin') return true
  if (actor === 'manager') return target === 'analyst' || target === 'viewer'
  return false
}

export function canRemoveTargetMember(actorRole, targetRole) {
  const actor = normalizeRole(actorRole)
  const target = normalizeRole(targetRole)
  if (actor !== 'admin' && actor !== 'manager') return false
  if (actor === 'manager' && target === 'admin') return false
  return canEditTargetMember(actor, target)
}

export function getEditableRolesForActor(actorRole, targetRole) {
  const actor = normalizeRole(actorRole)
  if (actor === 'admin') return [...TEAM_ROLES]
  if (actor === 'manager') {
    const target = normalizeRole(targetRole)
    if (target === 'admin' || target === 'manager') return []
    return ['analyst', 'viewer']
  }
  return []
}

/** Actions available in the row action menu */
export function buildTeamActions({ actorRole, targetRole, isSelf, isPending }) {
  if (isPending) {
    return ['resend', 'cancel', 'copyLink']
  }

  const actions = ['view']
  const actor = normalizeRole(actorRole)
  const target = normalizeRole(targetRole)

  if (isSelf || !canManageTeam(actorRole)) {
    return actions
  }

  if (actor === 'admin') {
    return ['view', 'editRole', 'suspend', 'remove']
  }

  if (canEditTargetMember(actor, target)) {
    actions.push('editRole', 'suspend')
  }
  if (canRemoveTargetMember(actor, target)) {
    actions.push('remove')
  }

  return actions
}
