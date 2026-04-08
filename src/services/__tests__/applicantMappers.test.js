import { describe, expect, it } from 'vitest'
import {
  buildSfccApplicationPayload,
  filterApplicationsByApplicant,
  normalizeApplication,
  normalizePayment,
  normalizeProcessTemplate
} from '@/services/applicantMappers'

describe('applicant mappers', () => {
  it('normalizes process template with fallback values', () => {
    const template = normalizeProcessTemplate({})

    expect(template.code).toBeTruthy()
    expect(template.name).toContain('Registration')
    expect(template.stages.length).toBeGreaterThan(0)
  })

  it('normalizes application using workflow stage title', () => {
    const application = normalizeApplication({
      applicationId: 'APP-1',
      status: 'active',
      dateReceived: '2026-02-24',
      applicant: {
        companyName: 'Acme Ltd',
        email: 'applicant@example.com'
      },
      processAutomation: {
        currentStage: 'awaiting_payment',
        stages: [
          { key: 'application_submitted', title: 'Application Submitted' },
          { key: 'awaiting_payment', title: 'Awaiting Payment' }
        ]
      }
    })

    expect(application.applicationId).toBe('APP-1')
    expect(application.workflowStageTitle).toBe('Awaiting Payment')
    expect(application.applicantEmail).toBe('applicant@example.com')
  })

  it('filters applications by applicant identity', () => {
    const rows = [
      { applicantId: 'APPL-1', applicantEmail: 'one@example.com' },
      { applicantId: 'APPL-2', applicantEmail: 'two@example.com' }
    ]

    const filtered = filterApplicationsByApplicant(rows, {
      applicantId: 'APPL-2',
      email: 'two@example.com'
    })

    expect(filtered).toHaveLength(1)
    expect(filtered[0].applicantId).toBe('APPL-2')
    expect(filtered[0].applicantEmail).toBe('two@example.com')
  })

  it('builds SFCC payload expected by backend create-application endpoint', () => {
    const payload = buildSfccApplicationPayload(
      {
        dateReceived: '2026-02-25',
        sector: 'telecom',
        applicationFee: 450000,
        serviceKey: 'sfcc-registration',
        contractCategory: 'Standard Consumer Agreement',
        targetMarket: 'Retail',
        consumerImpactSummary: 'Standardized rights and obligations',
        applicantType: 'firm',
        companyName: 'Acme Ltd',
        registrationNumber: 'REG-0044',
        countryOfIncorporation: 'Tanzania',
        contactEmail: 'acme@example.com',
        phoneNumber: '+255700000000',
        postalAddress: 'P.O.Box 1',
        physicalAddress: 'Dar es Salaam',
        businessDescription: 'Distribution services'
      },
      {
        fullName: 'Jane Doe',
        email: 'acme@example.com'
      },
      {
        name: 'Registration (Review) of Standard Form Consumer Contract',
        stages: []
      }
    )

    expect(payload.applicant.type).toBe('firm')
    expect(payload.applicant.contactPerson.email).toBe('acme@example.com')
    expect(payload.applicationFee).toBe(450000)
    expect(payload.serviceDetails.contractCategory).toBe('Standard Consumer Agreement')
  })

  it('builds trademark payload with request details and payment block', () => {
    const payload = buildSfccApplicationPayload(
      {
        dateReceived: '2026-02-25',
        sector: 'intellectual_property',
        serviceKey: 'trademark-recordation',
        applicantType: 'firm',
        companyName: 'Mark Owner Ltd',
        registrationNumber: 'REG-2201',
        countryOfIncorporation: 'Tanzania',
        contactEmail: 'owner@example.com',
        phoneNumber: '+255700000001',
        postalAddress: 'P.O.Box 22',
        physicalAddress: 'Dodoma',
        businessDescription: 'Trademark owner',
        fileNumber: 'FCC-TM-1234',
        office: 'OFF-DSM',
        trademarkRecordation: {
          requestType: 'ownership_change',
          trademarkName: 'SautiMax',
          classOfGoods: 'Class 9',
          countryOfOrigin: 'Tanzania',
          registrationReference: 'BRELA-2026-099',
          ownerFullName: 'Mark Owner Ltd',
          ownerBusinessAddress: 'Dodoma',
          ownerNationalityOrJurisdiction: 'Tanzania',
          previousOwnerName: 'Old Owner Ltd',
          newOwnerName: 'Mark Owner Ltd',
          transferReason: 'Corporate transfer',
          attachments: [{ documentType: 'fcc_2_form', fileName: 'fcc2.pdf' }],
          payment: {
            status: 'verified',
            controlNumber: '9911002201',
            referenceNumber: 'GEPG-2201',
            amountPaid: 150000
          },
          declarationAccepted: true
        }
      },
      {
        fullName: 'Jane Doe',
        email: 'owner@example.com'
      }
    )

    expect(payload.applicationFee).toBe(150000)
    expect(payload.payment.status).toBe('PAID')
    expect(payload.trademarkRecordation.requestType).toBe('ownership_change')
    expect(payload.serviceDetails.trademarkRecordation.trademarkName).toBe('SautiMax')
    expect(payload.fileNumber).toBeUndefined()
    expect(payload.office).toBeNull()
  })

  it('builds multi-trademark recordation payload with per-trademark fees and purpose mapping', () => {
    const payload = buildSfccApplicationPayload(
      {
        dateReceived: '2026-03-01',
        sector: 'intellectual_property',
        serviceKey: 'trademark-recordation',
        applicantType: 'firm',
        companyName: 'Multi Marks Ltd',
        registrationNumber: 'REG-8821',
        countryOfIncorporation: 'Tanzania',
        contactEmail: 'multimarks@example.com',
        phoneNumber: '+255755000001',
        postalAddress: 'P.O.Box 88',
        physicalAddress: 'Dar es Salaam',
        businessDescription: 'Brand owner',
        trademarkRecordation: {
          requestType: 'new_recordation',
          applicantRole: 'agent',
          ownerFullName: 'Multi Marks Ltd',
          ownerBusinessAddress: 'Dar es Salaam',
          ownerNationalityOrJurisdiction: 'Tanzania',
          trademarks: [
            {
              submissionId: 'TM-SUB-1',
              trademarkName: 'AlphaMark',
              classOfGoods: 'Class 9',
              countryOfOrigin: 'Tanzania',
              registrationReference: 'BRELA-TM-1',
              owner: {
                ownerCategory: 'Corporate Owner',
                fullName: 'Alpha Owner Ltd',
                businessAddress: 'Dar es Salaam',
                nationalityOrJurisdiction: 'Tanzania'
              },
              agent: {
                name: 'Jane Doe',
                firm: 'Agent Firm',
                email: 'multimarks@example.com',
                phone: '+255700123123',
                powerOfAttorneyNumber: 'POA-001'
              },
              manufacturers: [{ name: 'Alpha Manufacturing Ltd', country: 'Tanzania' }],
              authorizedParties: [{ fullName: 'Alpha Distributor', role: 'Distributor' }],
              affiliatedCompanies: [{ companyName: 'Alpha Holdings', relationship: 'Parent' }],
              visuals: [{ visualType: 'Logo', description: 'Alpha logo', fileName: 'alpha-logo.png' }],
              attachments: [{ documentType: 'trademark_visuals', fileName: 'alpha-logo.png' }]
            },
            {
              submissionId: 'TM-SUB-2',
              trademarkName: 'BetaMark',
              classOfGoods: 'Class 35',
              countryOfOrigin: 'Tanzania',
              registrationReference: 'BRELA-TM-2'
            }
          ],
          payment: {
            status: 'verified',
            controlNumber: '9910022001',
            referenceNumber: 'GEPG-9910022001',
            amountPaid: 400000
          },
          declarationAccepted: true
        }
      },
      {
        fullName: 'Jane Doe',
        email: 'multimarks@example.com'
      }
    )

    expect(payload.purpose).toBe('recordation')
    expect(payload.trademarks).toHaveLength(2)
    expect(payload.applicationFee).toBe(400000)
    expect(payload.payment.status).toBe('PAID')
    expect(payload.paymentRegistration.overallPaymentStatus).toBe('PAID')
    expect(payload.trademarkRecordation.applicantRole).toBe('agent')
    expect(payload.trademarkRecordation.trademarks[0].owner.fullName).toBe('Alpha Owner Ltd')
    expect(payload.trademarkRecordation.trademarks[0].agent.powerOfAttorneyNumber).toBe('POA-001')
    expect(payload.trademarkRecordation.trademarks[0].manufacturers).toHaveLength(1)
    expect(payload.trademarks[0].trademarkDraft.manufacturers).toHaveLength(1)
    expect(payload.trademarks[0].trademarkDraft.visuals).toHaveLength(1)
  })

  it('normalizes GePG payment visibility fields for applicants', () => {
    const payment = normalizePayment({
      paymentId: 'PAY-1001',
      source: { applicationId: 'APP-2026-1001' },
      totalAmount: 150000,
      status: 'control_number_issued',
      amountPaid: 50000,
      controlNumber: '9912345678',
      receiptNumber: 'RCPT-991',
      referenceNumber: 'GEPG-REF-991',
      paidAt: '2026-03-01T09:12:00.000Z',
      metadata: {
        dueDate: '2026-03-10',
        serviceProvider: 'GePG'
      }
    })

    expect(payment.id).toBe('PAY-1001')
    expect(payment.applicationId).toBe('APP-2026-1001')
    expect(payment.amount).toBe(150000)
    expect(payment.amountPaid).toBe(50000)
    expect(payment.balance).toBe(100000)
    expect(payment.billStatus).toBe('control number issued')
    expect(payment.paymentStatus).toBe('control number issued')
    expect(payment.controlNumber).toBe('9912345678')
    expect(payment.receiptNumber).toBe('RCPT-991')
    expect(payment.referenceNumber).toBe('GEPG-REF-991')
    expect(payment.paidAt).toBe('2026-03-01')
    expect(payment.dueDate).toBe('2026-03-10')
    expect(payment.serviceProvider).toBe('GePG')
  })
})

describe('normalizeApplication — extended', () => {
  it('extracts applicationId from various paths', () => {
    const byId = normalizeApplication({ id: 'ID-001', applicant: {} })
    expect(byId.applicationId).toBe('ID-001')

    const byMongo = normalizeApplication({ _id: 'MONGO-001', applicant: {} })
    expect(byMongo.applicationId).toBe('MONGO-001')

    const byField = normalizeApplication({ applicationId: 'APP-FIELD-001', applicant: {} })
    expect(byField.applicationId).toBe('APP-FIELD-001')
  })

  it('handles application with no processAutomation', () => {
    const app = normalizeApplication({
      applicationId: 'APP-NO-PA',
      status: 'active',
      applicant: { companyName: 'Test Co', email: 'test@example.com' }
    })

    expect(app.applicationId).toBe('APP-NO-PA')
    expect(app.workflowStages).toBeDefined()
    expect(app.workflowStages.length).toBeGreaterThan(0)
    expect(app.workflowStageKey).toBeTruthy()
  })

  it('preserves raw data on normalized result', () => {
    const raw = {
      applicationId: 'APP-RAW-1',
      status: 'active',
      applicant: { companyName: 'Raw Co', email: 'raw@example.com' },
      someCustomField: 'custom-value'
    }

    const app = normalizeApplication(raw)
    expect(app.raw).toBeDefined()
    expect(app.raw.someCustomField).toBe('custom-value')
    expect(app.raw.applicationId).toBe('APP-RAW-1')
  })

  it('extracts service key from metadata', () => {
    const app = normalizeApplication({
      applicationId: 'APP-TM-1',
      status: 'active',
      applicant: { companyName: 'TM Co', email: 'tm@example.com' },
      processAutomation: {
        processName: 'Trademark Recordation Process',
        currentStage: 'application_submitted',
        stages: []
      }
    })

    expect(app.serviceKey).toBe('trademark-recordation')
  })
})

describe('normalizePayment — extended', () => {
  it('normalizes payment with all fields present', () => {
    const payment = normalizePayment({
      paymentId: 'PAY-FULL-1',
      source: { applicationId: 'APP-FULL-1' },
      totalAmount: 300000,
      amountPaid: 300000,
      status: 'verified',
      controlNumber: '9900001111',
      receiptNumber: 'RCPT-001',
      referenceNumber: 'GEPG-001',
      paidAt: '2026-03-15T10:00:00.000Z',
      metadata: {
        dueDate: '2026-03-20',
        serviceProvider: 'GePG'
      }
    })

    expect(payment.id).toBe('PAY-FULL-1')
    expect(payment.applicationId).toBe('APP-FULL-1')
    expect(payment.amount).toBe(300000)
    expect(payment.amountPaid).toBe(300000)
    expect(payment.balance).toBe(0)
    expect(payment.controlNumber).toBe('9900001111')
    expect(payment.receiptNumber).toBe('RCPT-001')
    expect(payment.referenceNumber).toBe('GEPG-001')
    expect(payment.paidAt).toBe('2026-03-15')
    expect(payment.dueDate).toBe('2026-03-20')
    expect(payment.serviceProvider).toBe('GePG')
  })

  it('handles missing payment fields with defaults', () => {
    const payment = normalizePayment({})

    expect(payment.id).toBeUndefined()
    expect(payment.applicationId).toBe('N/A')
    expect(payment.amount).toBe(0)
    expect(payment.amountPaid).toBe(0)
    expect(payment.balance).toBe(0)
    expect(payment.controlNumber).toBeNull()
    expect(payment.receiptNumber).toBeNull()
    expect(payment.serviceProvider).toBe('FCC')
  })

  it('calculates balance from amount minus amountPaid', () => {
    const payment = normalizePayment({
      totalAmount: 500000,
      amountPaid: 200000
    })

    expect(payment.amount).toBe(500000)
    expect(payment.amountPaid).toBe(200000)
    expect(payment.balance).toBe(300000)
  })
})

describe('filterApplicationsByApplicant — extended', () => {
  const makeNormalizedApp = (overrides) => ({
    applicantId: null,
    applicantEmail: null,
    raw: {},
    ...overrides
  })

  it('returns only matching applications', () => {
    const apps = [
      makeNormalizedApp({ applicantId: 'APPL-10', applicantEmail: 'alice@example.com' }),
      makeNormalizedApp({ applicantId: 'APPL-11', applicantEmail: 'bob@example.com' }),
      makeNormalizedApp({ applicantId: 'APPL-10', applicantEmail: 'alice@example.com' })
    ]

    const result = filterApplicationsByApplicant(apps, { applicantId: 'APPL-10', email: 'alice@example.com' })

    expect(result).toHaveLength(2)
    result.forEach((app) => expect(app.applicantId).toBe('APPL-10'))
  })

  it('returns empty array when no matches', () => {
    const apps = [
      makeNormalizedApp({ applicantId: 'APPL-20', applicantEmail: 'carol@example.com' })
    ]

    const result = filterApplicationsByApplicant(apps, { applicantId: 'APPL-99', email: 'nobody@example.com' })

    expect(result).toHaveLength(0)
  })

  it('handles null applicant ID by falling back to email matching', () => {
    const apps = [
      makeNormalizedApp({ applicantId: null, applicantEmail: 'diana@example.com' }),
      makeNormalizedApp({ applicantId: null, applicantEmail: 'other@example.com' })
    ]

    const result = filterApplicationsByApplicant(apps, { applicantId: null, email: 'diana@example.com' })

    expect(result).toHaveLength(1)
    expect(result[0].applicantEmail).toBe('diana@example.com')
  })

  it('handles empty applications array', () => {
    const result = filterApplicationsByApplicant([], { applicantId: 'APPL-1', email: 'test@example.com' })
    expect(result).toHaveLength(0)
    expect(Array.isArray(result)).toBe(true)
  })
})
