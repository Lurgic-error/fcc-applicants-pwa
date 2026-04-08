import { describe, expect, it, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

// ---------------------------------------------------------------------------
// Mock sessionStorage for node environment (secureStorage wraps sessionStorage)
// ---------------------------------------------------------------------------
const sessionStore = {}
global.sessionStorage = {
  getItem: (key) => (key in sessionStore ? sessionStore[key] : null),
  setItem: (key, value) => { sessionStore[key] = String(value) },
  removeItem: (key) => { delete sessionStore[key] },
  clear: () => { Object.keys(sessionStore).forEach((k) => delete sessionStore[k]) },
  get length() { return Object.keys(sessionStore).length },
  key: (i) => Object.keys(sessionStore)[i] || null
}

// ---------------------------------------------------------------------------
// Mock API dependencies — we test store logic, not HTTP
// ---------------------------------------------------------------------------
vi.mock('@/services/applicantApi', () => ({
  loginApplicant: vi.fn(),
  registerApplicantAccount: vi.fn(),
  logoutApplicant: vi.fn()
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeSession(overrides = {}) {
  return {
    token: 'tok-abc123',
    user: {
      userId: 'u1',
      email: 'alice@fcc.go.tz',
      fullName: 'Alice Mwamba',
      roles: ['applicant']
    },
    profile: {
      applicantId: 'ap-001',
      email: 'alice@fcc.go.tz',
      fullName: 'Alice Mwamba',
      accountType: 'applicant'
    },
    ...overrides
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Reset fake sessionStorage between tests
    Object.keys(sessionStore).forEach((k) => delete sessionStore[k])
  })

  // ── initial state ─────────────────────────────────────────────────────────

  it('starts unauthenticated with null token', () => {
    const auth = useAuthStore()
    expect(auth.token).toBeNull()
    expect(auth.isAuthenticated).toBe(false)
  })

  it('starts with null user and profile', () => {
    const auth = useAuthStore()
    expect(auth.user).toBeNull()
    expect(auth.profile).toBeNull()
  })

  it('starts with empty roles and permissions', () => {
    const auth = useAuthStore()
    expect(auth.roles).toEqual([])
    expect(auth.permissions).toEqual([])
  })

  it('starts with empty accountType', () => {
    const auth = useAuthStore()
    expect(auth.accountType).toBe('')
  })

  // ── hydrateSession ────────────────────────────────────────────────────────

  it('hydrateSession — extracts token, user, profile, roles and accountType', () => {
    const auth = useAuthStore()
    const session = makeSession()
    auth.hydrateSession(session)

    expect(auth.token).toBe('tok-abc123')
    expect(auth.user).toEqual(session.user)
    expect(auth.profile).toEqual(session.profile)
    expect(auth.roles).toContain('applicant')
    expect(auth.accountType).toBe('applicant')
  })

  it('hydrateSession — sets restored flag to true', () => {
    const auth = useAuthStore()
    expect(auth.restored).toBe(false)
    auth.hydrateSession(makeSession())
    expect(auth.restored).toBe(true)
  })

  it('hydrateSession — handles missing profile gracefully', () => {
    const auth = useAuthStore()
    auth.hydrateSession({ token: 'tok-xyz', user: { userId: 'u2', roles: ['applicant'] } })
    expect(auth.profile).toBeNull()
    expect(auth.token).toBe('tok-xyz')
  })

  it('hydrateSession — handles empty roles array', () => {
    const auth = useAuthStore()
    auth.hydrateSession({ token: 'tok-xyz', user: { userId: 'u2', roles: [] } })
    expect(auth.roles).toEqual([])
  })

  it('hydrateSession — returns the normalized session object', () => {
    const auth = useAuthStore()
    const result = auth.hydrateSession(makeSession())
    expect(result).toHaveProperty('token', 'tok-abc123')
    expect(result).toHaveProperty('hasApplicantPortalAccess')
  })

  // ── restoreSession ────────────────────────────────────────────────────────

  it('restoreSession — reads token from storage and hydrates state', () => {
    // Pre-populate fake sessionStorage as secureStorage would
    const PREFIX = 'fcc_app_'
    sessionStore[`${PREFIX}fcc_applicant_access_token`] = JSON.stringify('tok-stored')
    sessionStore[`${PREFIX}fcc_applicant_user`] = JSON.stringify({
      userId: 'u3',
      roles: ['applicant']
    })
    sessionStore[`${PREFIX}fcc_applicant_profile`] = JSON.stringify({
      applicantId: 'ap-002',
      accountType: 'applicant',
      email: 'bob@fcc.go.tz',
      fullName: 'Bob Kiprotich'
    })

    const auth = useAuthStore()
    auth.restoreSession()

    expect(auth.restored).toBe(true)
    expect(auth.token).toBe('tok-stored')
  })

  it('restoreSession — clears session and marks restored when no token in storage', () => {
    const auth = useAuthStore()
    auth.restoreSession()

    expect(auth.restored).toBe(true)
    expect(auth.token).toBeNull()
  })

  it('restoreSession — is a no-op when already restored', () => {
    const auth = useAuthStore()
    auth.hydrateSession(makeSession()) // sets restored = true
    const tokenBefore = auth.token

    // Should not overwrite with storage values
    auth.restoreSession()
    expect(auth.token).toBe(tokenBefore)
  })

  // ── clearSession ──────────────────────────────────────────────────────────

  it('clearSession — resets all state fields to defaults', () => {
    const auth = useAuthStore()
    auth.hydrateSession(makeSession())

    auth.clearSession()

    expect(auth.token).toBeNull()
    expect(auth.user).toBeNull()
    expect(auth.profile).toBeNull()
    expect(auth.roles).toEqual([])
    expect(auth.permissions).toEqual([])
    expect(auth.accountType).toBe('')
  })

  it('clearSession — removes keys from sessionStorage', () => {
    const PREFIX = 'fcc_app_'
    const auth = useAuthStore()
    auth.hydrateSession(makeSession())

    // Manually seed storage so clearSession has something to remove
    sessionStore[`${PREFIX}fcc_applicant_access_token`] = JSON.stringify('tok-abc123')
    sessionStore[`${PREFIX}fcc_applicant_user`] = JSON.stringify({})
    sessionStore[`${PREFIX}fcc_applicant_profile`] = JSON.stringify({})

    auth.clearSession()

    expect(sessionStore[`${PREFIX}fcc_applicant_access_token`]).toBeUndefined()
    expect(sessionStore[`${PREFIX}fcc_applicant_user`]).toBeUndefined()
    expect(sessionStore[`${PREFIX}fcc_applicant_profile`]).toBeUndefined()
  })

  // ── getters ───────────────────────────────────────────────────────────────

  it('isAuthenticated — returns true when token is set', () => {
    const auth = useAuthStore()
    auth.hydrateSession(makeSession())
    expect(auth.isAuthenticated).toBe(true)
  })

  it('hasApplicantPortalAccess — true when roles include applicant', () => {
    const auth = useAuthStore()
    auth.hydrateSession(makeSession())
    expect(auth.hasApplicantPortalAccess).toBe(true)
  })

  it('fullName — returns fullName from profile', () => {
    const auth = useAuthStore()
    auth.hydrateSession(makeSession())
    expect(auth.fullName).toBe('Alice Mwamba')
  })

  it('email — returns email from profile', () => {
    const auth = useAuthStore()
    auth.hydrateSession(makeSession())
    expect(auth.email).toBe('alice@fcc.go.tz')
  })
})
