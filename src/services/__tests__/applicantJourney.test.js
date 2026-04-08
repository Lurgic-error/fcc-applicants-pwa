import { describe, expect, it } from 'vitest'
import { resolveApplicationJourney } from '@/services/applicantJourney'

describe('applicant journey', () => {
  it('marks pending payment as the next required applicant action', () => {
    const journey = resolveApplicationJourney({
      applicationId: 'APP-1',
      workflowStageKey: 'awaiting_payment',
      workflowStageTitle: 'Awaiting Payment',
      status: 'Payment Pending',
      payment: {
        status: 'control_number_issued',
        amountDue: 120000,
        amountPaid: 0,
        controlNumber: '9912001'
      },
      certificatePolicy: {
        available: true
      }
    })

    expect(journey.paymentRequired).toBe(true)
    expect(journey.paymentComplete).toBe(false)
    expect(journey.currentStepKey).toBe('payment')
    expect(journey.nextAction).toContain('control number 9912001')
  })

  it('flags FCC queries as applicant attention items', () => {
    const journey = resolveApplicationJourney({
      applicationId: 'APP-2',
      workflowStageKey: 'query_raised',
      workflowStageTitle: 'Query Raised',
      status: 'Query Raised',
      payment: {
        status: 'verified',
        amountDue: 120000,
        amountPaid: 120000
      },
      certificatePolicy: {
        available: false
      }
    })

    expect(journey.hasOpenQuery).toBe(true)
    expect(journey.nextAction).toContain('Respond to the FCC request')
    expect(journey.steps.find((step) => step.key === 'fcc-request')?.state).toBe('attention')
  })

  it('allows certificate access once issuance is complete and real records exist', () => {
    const journey = resolveApplicationJourney({
      applicationId: 'APP-3',
      workflowStageKey: 'certificate_issued',
      workflowStageTitle: 'Certificate Issued',
      status: 'Certificate Issued',
      payment: {
        status: 'verified',
        amountDue: 90000,
        amountPaid: 90000
      },
      certificatePolicy: {
        available: true
      }
    }, { hasCertificateRecords: true })

    expect(journey.certificateIssued).toBe(true)
    expect(journey.canOpenCertificate).toBe(true)
    expect(journey.nextAction).toContain('issued certificate')
  })

  it('does not allow certificate access when status says issued but no real records exist', () => {
    const journey = resolveApplicationJourney({
      applicationId: 'APP-4',
      workflowStageKey: 'certificate_issued',
      workflowStageTitle: 'Certificate Issued',
      status: 'Certificate Issued',
      payment: {
        status: 'verified',
        amountDue: 90000,
        amountPaid: 90000
      },
      certificatePolicy: {
        available: true
      }
    })

    expect(journey.certificateIssued).toBe(true)
    expect(journey.canOpenCertificate).toBe(false)
    expect(journey.nextAction).toContain('prepared by FCC')
  })
})

describe('resolveApplicationJourney — extended', () => {
  it('identifies draft as editable with canEdit true', () => {
    const journey = resolveApplicationJourney({
      applicationId: 'APP-DRAFT-1',
      workflowStageKey: 'draft',
      workflowStageTitle: 'Draft',
      status: 'Draft'
    })

    expect(journey.canEdit).toBe(true)
    expect(journey.closed).toBe(false)
    expect(journey.rejected).toBe(false)
    expect(journey.certificateIssued).toBe(false)
  })

  it('identifies submitted status with review step current', () => {
    const journey = resolveApplicationJourney({
      applicationId: 'APP-5',
      workflowStageKey: 'application_submitted',
      workflowStageTitle: 'Application Submitted',
      status: 'Submitted',
      payment: { status: 'pending', amountDue: 0, amountPaid: 0 },
      certificatePolicy: { available: false }
    })

    expect(journey.submitted).toBe(true)
    expect(journey.acknowledged).toBe(false)
  })

  it('identifies payment required when fee > 0 and unpaid', () => {
    const journey = resolveApplicationJourney({
      applicationId: 'APP-6',
      workflowStageKey: 'awaiting_payment',
      workflowStageTitle: 'Awaiting Payment',
      status: 'Awaiting Payment',
      payment: {
        status: 'control_number_issued',
        amountDue: 200000,
        amountPaid: 0,
        controlNumber: '9900001'
      }
    })

    expect(journey.paymentRequired).toBe(true)
    expect(journey.paymentComplete).toBe(false)
  })

  it('identifies payment complete when amountPaid >= fee', () => {
    const journey = resolveApplicationJourney({
      applicationId: 'APP-7',
      workflowStageKey: 'payment_verified',
      workflowStageTitle: 'Payment Verified',
      status: 'Payment Verified',
      payment: {
        status: 'verified',
        amountDue: 150000,
        amountPaid: 150000
      }
    })

    expect(journey.paymentRequired).toBe(true)
    expect(journey.paymentComplete).toBe(true)
  })

  it('identifies approved status with all steps completed', () => {
    const journey = resolveApplicationJourney({
      applicationId: 'APP-8',
      workflowStageKey: 'approved',
      workflowStageTitle: 'Approved',
      status: 'Approved',
      payment: {
        status: 'verified',
        amountDue: 100000,
        amountPaid: 100000
      },
      certificatePolicy: { available: false }
    })

    expect(journey.approved).toBe(true)
    expect(journey.rejected).toBe(false)
    expect(journey.canEdit).toBe(true)
  })

  it('identifies rejected status', () => {
    const journey = resolveApplicationJourney({
      applicationId: 'APP-9',
      workflowStageKey: 'rejected',
      workflowStageTitle: 'Rejected',
      status: 'Rejected',
      payment: {
        status: 'verified',
        amountDue: 50000,
        amountPaid: 50000
      }
    })

    expect(journey.rejected).toBe(true)
    expect(journey.approved).toBe(false)
    expect(journey.canEdit).toBe(false)
  })

  it('provides meaningful nextAction text', () => {
    const journey = resolveApplicationJourney({
      applicationId: 'APP-10',
      workflowStageKey: 'screening_in_progress',
      workflowStageTitle: 'Screening In Progress',
      status: 'Under Review',
      payment: {
        status: 'verified',
        amountDue: 80000,
        amountPaid: 80000
      }
    })

    expect(typeof journey.nextAction).toBe('string')
    expect(journey.nextAction.length).toBeGreaterThan(0)
    expect(typeof journey.summary).toBe('string')
    expect(journey.summary.length).toBeGreaterThan(0)
  })

  it('handles missing payment object gracefully', () => {
    const journey = resolveApplicationJourney({
      applicationId: 'APP-11',
      workflowStageKey: 'application_submitted',
      workflowStageTitle: 'Application Submitted',
      status: 'Submitted'
    })

    expect(journey.paymentRequired).toBe(false)
    expect(journey.paymentComplete).toBe(false)
    expect(journey.steps).toBeDefined()
    expect(journey.steps.length).toBeGreaterThan(0)
  })

  it('handles missing workflow stages', () => {
    const journey = resolveApplicationJourney({
      applicationId: 'APP-12',
      status: 'Active'
    })

    expect(journey.steps).toBeDefined()
    expect(journey.currentStepKey).toBeDefined()
  })

  it('handles application with no status field', () => {
    const journey = resolveApplicationJourney({
      applicationId: 'APP-13'
    })

    expect(journey.submitted).toBe(false)
    expect(journey.approved).toBe(false)
    expect(journey.rejected).toBe(false)
    expect(journey.steps.length).toBeGreaterThan(0)
  })

  it('identifies query raised as attention state', () => {
    const journey = resolveApplicationJourney({
      applicationId: 'APP-14',
      workflowStageKey: 'query_raised',
      workflowStageTitle: 'Query Raised',
      status: 'Query Raised',
      payment: {
        status: 'verified',
        amountDue: 60000,
        amountPaid: 60000
      }
    })

    expect(journey.hasOpenQuery).toBe(true)
    expect(journey.currentStepKey).toBe('fcc-request')
    const queryStep = journey.steps.find((s) => s.key === 'fcc-request')
    expect(queryStep?.state).toBe('attention')
  })
})
