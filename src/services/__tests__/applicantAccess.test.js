import { describe, expect, it } from 'vitest'
import {
  extractSessionPermissions,
  extractSessionRoles,
  hasApplicantPortalAccess,
  normalizeApplicantSession,
  resolveSessionAccountType
} from '@/services/applicantAccess'

describe('applicant access', () => {
  it('extracts applicant roles and permissions from mixed session payloads', () => {
    const session = {
      user: {
        accountType: 'applicant',
        roles: ['applicant'],
        permissions: [{ name: 'applications.read' }]
      },
      profile: {
        groups: [{ name: 'applicant' }],
        authorities: ['payments.manage']
      }
    }

    expect(extractSessionRoles(session)).toEqual(['applicant'])
    expect(extractSessionPermissions(session)).toEqual(
      expect.arrayContaining(['applications.read', 'payments.manage'])
    )
    expect(resolveSessionAccountType(session)).toBe('applicant')
    expect(hasApplicantPortalAccess(session)).toBe(true)
  })

  it('rejects non-applicant sessions even when authenticated', () => {
    const session = {
      token: 'token-1',
      user: {
        accountType: 'staff',
        roles: [{ name: 'officer' }]
      }
    }

    const normalized = normalizeApplicantSession(session)

    expect(normalized.accountType).toBe('staff')
    expect(normalized.roles).toEqual(['officer'])
    expect(normalized.hasApplicantPortalAccess).toBe(false)
  })
})
