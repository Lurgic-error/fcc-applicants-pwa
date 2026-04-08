function normalizeText(value = '') {
  return String(value || '').trim().toLowerCase()
}

function toNameList(value) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => toNameList(item))
  }

  if (!value) {
    return []
  }

  if (typeof value === 'string') {
    return [value]
  }

  if (typeof value === 'object') {
    return [
      value.name,
      value.key,
      value.code,
      value.id,
      value.role,
      value.permission,
      value.scope
    ].filter(Boolean)
  }

  return []
}

function uniqueNormalized(items = []) {
  const seen = new Set()
  const normalizedItems = []

  for (const item of items) {
    const normalized = normalizeText(item)
    if (!normalized || seen.has(normalized)) {
      continue
    }

    seen.add(normalized)
    normalizedItems.push(normalized)
  }

  return normalizedItems
}

export function extractSessionRoles(session = {}) {
  return uniqueNormalized([
    ...toNameList(session.profile?.roles),
    ...toNameList(session.profile?.roleNames),
    ...toNameList(session.profile?.groups),
    ...toNameList(session.profile?.role),
    ...toNameList(session.user?.roles),
    ...toNameList(session.user?.roleNames),
    ...toNameList(session.user?.groups),
    ...toNameList(session.user?.role)
  ])
}

export function extractSessionPermissions(session = {}) {
  return uniqueNormalized([
    ...toNameList(session.profile?.permissions),
    ...toNameList(session.profile?.permissionNames),
    ...toNameList(session.profile?.authorities),
    ...toNameList(session.profile?.scopes),
    ...toNameList(session.user?.permissions),
    ...toNameList(session.user?.permissionNames),
    ...toNameList(session.user?.authorities),
    ...toNameList(session.user?.scopes)
  ])
}

export function resolveSessionAccountType(session = {}) {
  const candidates = [
    session.profile?.accountType,
    session.user?.accountType,
    session.profile?.userType,
    session.user?.userType,
    session.profile?.account?.type,
    session.user?.account?.type
  ]

  for (const candidate of candidates) {
    const normalized = normalizeText(candidate)
    if (normalized) {
      return normalized
    }
  }

  const roles = extractSessionRoles(session)
  if (roles.includes('applicant')) {
    return 'applicant'
  }

  return ''
}

export function hasApplicantPortalAccess(session = {}) {
  const accountType = resolveSessionAccountType(session)
  const roles = extractSessionRoles(session)

  return accountType === 'applicant' || roles.includes('applicant')
}

export function normalizeApplicantSession(session = {}) {
  const roles = extractSessionRoles(session)
  const permissions = extractSessionPermissions(session)
  const accountType = resolveSessionAccountType(session)

  return {
    token: session.token || null,
    user: session.user || null,
    profile: session.profile || null,
    roles,
    permissions,
    accountType,
    hasApplicantPortalAccess: hasApplicantPortalAccess(session)
  }
}
