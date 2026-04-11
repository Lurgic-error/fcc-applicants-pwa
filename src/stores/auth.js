import { defineStore } from 'pinia'
import {
  loginApplicant,
  logoutApplicant,
  registerApplicantAccount
} from '@/services/applicantApi'
import { normalizeApplicantSession } from '@/services/applicantAccess'
import { APPLICANT_TOKEN_KEY } from '@/services/http'
import * as secureStorage from '@/utils/secureStorage'

const APPLICANT_USER_KEY = 'fcc_applicant_user'
const APPLICANT_PROFILE_KEY = 'fcc_applicant_profile'

function readStoredJson(key) {
  // secureStorage.getItem already handles JSON.parse; returns null on miss/error
  return secureStorage.getItem(key)
}

export const useAuthStore = defineStore('applicant-auth', {
  state: () => ({
    token: null,
    user: null,
    profile: null,
    roles: [],
    permissions: [],
    accountType: '',
    loading: false,
    restored: false
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    isSessionReady: (state) => state.restored,
    userId: (state) => state.user?.userId || state.profile?.userId || null,
    applicantId: (state) =>
      state.profile?.applicantId ||
      state.profile?.attributes?.custom?.applicantId ||
      state.user?.applicantId ||
      state.user?.attributes?.custom?.applicantId ||
      null,
    email: (state) => state.profile?.email || state.user?.email || null,
    fullName: (state) => state.profile?.fullName || state.user?.fullName || null,
    organizationName: (state) =>
      state.profile?.companyName ||
      state.profile?.attributes?.custom?.companyName ||
      state.user?.companyName ||
      null,
    applicantType: (state) => {
      return state.profile?.applicant?.type ||
        state.profile?.applicantType ||
        state.user?.attributes?.custom?.accountType ||
        null
    },
    isCompanyApplicant() { return this.applicantType === 'company' },
    isIndividualApplicant() { return this.applicantType === 'individual' || this.applicantType === null },
    displayName: (state) => {
      const a = state.profile?.applicant
      if (!a) return state.profile?.fullName || state.user?.fullName || 'Applicant'
      if (a.type === 'company') {
        return a.company?.name || a.companyName || 'Company'
      }
      const first = a.individual?.firstName || a.firstName || ''
      const last = a.individual?.surname || a.surname || ''
      return `${first} ${last}`.trim() || state.profile?.fullName || 'Applicant'
    },
    representativeName: (state) => {
      const r = state.profile?.applicant?.representative
      if (r?.firstName) return `${r.firstName} ${r.surname || ''}`.trim()
      const cp = state.profile?.applicant?.contactPerson
      if (cp?.name) return cp.name
      return state.profile?.fullName || state.user?.fullName || ''
    },
    hasApplicantPortalAccess: (state) =>
      Boolean(state.token) && (state.accountType === 'applicant' || state.roles.includes('applicant'))
  },
  actions: {
    hydrateSession(session = {}) {
      const normalized = normalizeApplicantSession(session)

      this.token = normalized.token
      this.user = normalized.user
      this.profile = normalized.profile
      this.roles = normalized.roles
      this.permissions = normalized.permissions
      this.accountType = normalized.accountType
      this.restored = true

      return normalized
    },
    clearSession() {
      this.token = null
      this.user = null
      this.profile = null
      this.roles = []
      this.permissions = []
      this.accountType = ''
      this.restored = true

      secureStorage.removeItem(APPLICANT_TOKEN_KEY)
      secureStorage.removeItem(APPLICANT_USER_KEY)
      secureStorage.removeItem(APPLICANT_PROFILE_KEY)
    },
    restoreSession() {
      if (this.restored) {
        return
      }

      const token = secureStorage.getItem(APPLICANT_TOKEN_KEY)
      const user = readStoredJson(APPLICANT_USER_KEY)
      const profile = readStoredJson(APPLICANT_PROFILE_KEY)

      if (!token) {
        this.restored = true
        return
      }

      const normalized = this.hydrateSession({
        token,
        user,
        profile
      })

      if (!normalized.hasApplicantPortalAccess) {
        this.clearSession()
      }
    },
    setSession({ token, user, profile }) {
      const normalized = this.hydrateSession({ token, user, profile })
      if (!normalized.token) {
        throw new Error('Login succeeded but no access token was returned.')
      }
      if (!normalized.hasApplicantPortalAccess) {
        this.clearSession()
        throw new Error('This account is not authorized for the applicant portal.')
      }

      secureStorage.setItem(APPLICANT_TOKEN_KEY, normalized.token)
      secureStorage.setItem(APPLICANT_USER_KEY, normalized.user || {})
      secureStorage.setItem(APPLICANT_PROFILE_KEY, normalized.profile || {})
    },
    async login(credentials) {
      this.loading = true
      try {
        const { token, user, profile } = await loginApplicant(credentials)
        this.setSession({ token, user, profile })
      } finally {
        this.loading = false
      }
    },
    async register(payload) {
      this.loading = true
      try {
        await registerApplicantAccount(payload)
        await this.login({
          email: payload.email,
          password: payload.password
        })
      } finally {
        this.loading = false
      }
    },
    async logout() {
      try {
        await logoutApplicant()
      } catch {
        // Token may already be expired or revoked; local cleanup is still required.
      }

      this.clearSession()
    }
  }
})
