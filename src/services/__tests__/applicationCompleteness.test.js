import { describe, expect, it } from 'vitest'
import { assessApplicationCompleteness } from '@/services/applicationCompleteness'

describe('assessApplicationCompleteness', () => {
  describe('generic services (sfcc-registration)', () => {
    it('returns 0% for empty form', () => {
      const result = assessApplicationCompleteness('sfcc-registration', {})
      expect(result.complete).toBe(false)
      expect(result.percentage).toBe(0)
      expect(result.sections.length).toBe(3)
      expect(result.sections[0].status).toBe('empty')
    })

    it('returns partial when some fields filled', () => {
      const result = assessApplicationCompleteness('sfcc-registration', {
        dateReceived: '2026-04-05',
        sector: 'Retail',
        contractCategory: 'Distribution',
        targetMarket: 'Tanzania',
        consumerImpactSummary: 'Low impact expected'
      })
      expect(result.percentage).toBeGreaterThan(0)
      expect(result.sections[0].status).toBe('complete')
    })

    it('returns 100% when all required fields filled', () => {
      const result = assessApplicationCompleteness('sfcc-registration', {
        dateReceived: '2026-04-05',
        sector: 'Retail',
        contractCategory: 'Distribution',
        targetMarket: 'Tanzania',
        consumerImpactSummary: 'Low impact',
        applicantType: 'firm',
        companyName: 'Acme Ltd',
        registrationNumber: 'REG-001',
        contactPersonName: 'Jane Doe',
        contactPersonEmail: 'jane@acme.com',
        contactPersonPhone: '+255700000000',
        contactEmail: 'contact@acme.com',
        phoneNumber: '+255700000001',
        postalAddress: 'P.O. Box 123',
        physicalAddress: 'Dar es Salaam',
        businessDescription: 'Retail distribution'
      })
      expect(result.complete).toBe(true)
      expect(result.percentage).toBe(100)
    })
  })

  describe('trademark-recordation', () => {
    it('returns sections matching 5 wizard steps', () => {
      const result = assessApplicationCompleteness('trademark-recordation', {})
      expect(result.sections.length).toBe(5)
      expect(result.sections[0].label).toBe('Request Type')
    })

    it('marks request type section complete when filled', () => {
      const result = assessApplicationCompleteness('trademark-recordation', {
        dateReceived: '2026-04-05',
        sector: 'Manufacturing',
        trademarkRecordation: {
          requestType: 'new_recordation'
        }
      })
      expect(result.sections[0].status).toBe('complete')
    })

    it('reports missing owner fields in step 2', () => {
      const result = assessApplicationCompleteness('trademark-recordation', {
        trademarkRecordation: { requestType: 'new_recordation' }
      })
      const ownerSection = result.sections[1]
      expect(ownerSection.status).not.toBe('complete')
      expect(ownerSection.missingFields.length).toBeGreaterThan(0)
    })
  })

  describe('merger-clearance (generic wizard)', () => {
    it('returns 3 sections for merger generic wizard', () => {
      const result = assessApplicationCompleteness('merger-clearance', {})
      expect(result.sections.length).toBe(3)
    })
  })

  describe('edge cases', () => {
    it('handles unknown service key gracefully', () => {
      const result = assessApplicationCompleteness('unknown-service', {})
      expect(result.sections.length).toBeGreaterThan(0)
    })

    it('handles null/undefined form data', () => {
      const result = assessApplicationCompleteness('sfcc-registration', null)
      expect(result.complete).toBe(false)
      expect(result.percentage).toBe(0)
    })
  })
})

// ---------------------------------------------------------------------------
// Extended test groups
// ---------------------------------------------------------------------------

describe('individual applicant type', () => {
  it('uses firstName/surname fields for individual', () => {
    // For applicantType 'individual', step 1 should require firstName and surname
    const result = assessApplicationCompleteness('sfcc-registration', { applicantType: 'individual' })
    const applicantSection = result.sections[1]
    const fieldKeys = applicantSection.missingFields.map((f) => f.key)
    expect(fieldKeys).toContain('firstName')
    expect(fieldKeys).toContain('surname')
    // Firm-only fields should NOT appear
    expect(fieldKeys).not.toContain('companyName')
    expect(fieldKeys).not.toContain('registrationNumber')
  })

  it('reports fewer required fields for individual than firm', () => {
    const individual = assessApplicationCompleteness('sfcc-registration', { applicantType: 'individual' })
    const firm = assessApplicationCompleteness('sfcc-registration', { applicantType: 'firm' })
    // Individual step 1 has 2 fields; firm step 1 has 5 fields
    expect(individual.totalRequired).toBeLessThan(firm.totalRequired)
  })
})

describe('field value detection', () => {
  // Build a fully-filled sfcc-registration (firm) form and then override individual fields to check isProvided logic
  const fullFirmForm = {
    applicantType: 'firm',
    dateReceived: '2026-04-05',
    sector: 'Retail',
    contractCategory: 'Distribution',
    targetMarket: 'Tanzania',
    consumerImpactSummary: 'Low impact',
    companyName: 'Acme Ltd',
    registrationNumber: 'REG-001',
    contactPersonName: 'Jane Doe',
    contactPersonEmail: 'jane@acme.com',
    contactPersonPhone: '+255700000000',
    contactEmail: 'contact@acme.com',
    phoneNumber: '+255700000001',
    postalAddress: 'P.O. Box 123',
    physicalAddress: 'Dar es Salaam',
    businessDescription: 'Retail distribution'
  }

  it('treats empty string as not provided', () => {
    const result = assessApplicationCompleteness('sfcc-registration', { ...fullFirmForm, sector: '' })
    expect(result.complete).toBe(false)
  })

  it('treats null as not provided', () => {
    const result = assessApplicationCompleteness('sfcc-registration', { ...fullFirmForm, sector: null })
    expect(result.complete).toBe(false)
  })

  it('treats undefined as not provided', () => {
    const form = { ...fullFirmForm }
    delete form.sector
    const result = assessApplicationCompleteness('sfcc-registration', form)
    expect(result.complete).toBe(false)
  })

  it('treats 0 as provided for numbers', () => {
    // Use merger-clearance which has a number field: estimatedTurnover
    // Build a fully-filled merger form; set estimatedTurnover = 0 — should still count as provided
    const mergerForm = {
      applicantType: 'firm',
      dateReceived: '2026-04-05',
      sector: 'Manufacturing',
      transactionType: 'Merger',
      partiesInvolved: 'Firm A and Firm B',
      estimatedTurnover: 0,        // number — zero is provided
      transactionValue: 5000000,
      targetFirmName: 'Firm B',
      targetFirmBusiness: 'Steel production',
      acquisitionDescription: 'Full acquisition',
      commercialRationale: 'Market expansion',
      relevantMarketDefinition: 'Steel market in TZ',
      companyName: 'Firm A',
      registrationNumber: 'REG-MA-001',
      contactPersonName: 'John Smith',
      contactPersonEmail: 'john@firma.com',
      contactPersonPhone: '+255700000002',
      contactEmail: 'info@firma.com',
      phoneNumber: '+255700000003',
      postalAddress: 'P.O. Box 999',
      physicalAddress: 'Arusha',
      businessDescription: 'Steel manufacturing'
    }
    const result = assessApplicationCompleteness('merger-clearance', mergerForm)
    // estimatedTurnover=0 must be treated as provided, so it should not appear in step 0 missingFields
    const step0Missing = result.sections[0].missingFields.map((f) => f.key)
    expect(step0Missing).not.toContain('estimatedTurnover')
  })

  it('treats false as not provided for declarationAccepted', () => {
    // trademark-recordation paymentDeclaration step requires declarationAccepted
    const result = assessApplicationCompleteness('trademark-recordation', {
      trademarkRecordation: { declarationAccepted: false }
    })
    const paymentSection = result.sections[4]
    const missing = paymentSection.missingFields.map((f) => f.key)
    expect(missing).toContain('trademarkRecordation.declarationAccepted')
  })

  it('treats true as provided for declarationAccepted', () => {
    const result = assessApplicationCompleteness('trademark-recordation', {
      trademarkRecordation: { declarationAccepted: true }
    })
    const paymentSection = result.sections[4]
    expect(paymentSection.status).toBe('complete')
  })

  it('treats empty array as not provided', () => {
    // Use a field whose value is an empty array; isProvided([]) === false
    // Patch sector field (string normally) with an array to test array branch
    const result = assessApplicationCompleteness('sfcc-registration', { ...fullFirmForm, sector: [] })
    expect(result.complete).toBe(false)
    const step0Missing = result.sections[0].missingFields.map((f) => f.key)
    expect(step0Missing).toContain('sector')
  })

  it('treats non-empty array as provided', () => {
    const result = assessApplicationCompleteness('sfcc-registration', { ...fullFirmForm, sector: ['Retail'] })
    expect(result.complete).toBe(true)
  })
})

describe('percentage edge cases', () => {
  it('returns 0 for completely empty form', () => {
    const result = assessApplicationCompleteness('sfcc-registration', {})
    expect(result.percentage).toBe(0)
    expect(result.complete).toBe(false)
  })

  it('returns 100 when every required field filled', () => {
    const result = assessApplicationCompleteness('sfcc-registration', {
      applicantType: 'firm',
      dateReceived: '2026-04-05',
      sector: 'Retail',
      contractCategory: 'Distribution',
      targetMarket: 'Tanzania',
      consumerImpactSummary: 'Low impact',
      companyName: 'Acme Ltd',
      registrationNumber: 'REG-001',
      contactPersonName: 'Jane Doe',
      contactPersonEmail: 'jane@acme.com',
      contactPersonPhone: '+255700000000',
      contactEmail: 'contact@acme.com',
      phoneNumber: '+255700000001',
      postalAddress: 'P.O. Box 123',
      physicalAddress: 'Dar es Salaam',
      businessDescription: 'Retail distribution'
    })
    expect(result.complete).toBe(true)
    expect(result.percentage).toBe(100)
  })

  it('rounds percentage to nearest integer', () => {
    // sfcc-registration firm has 15 required fields total.
    // Providing exactly 1 of 15 => Math.round(1/15 * 100) = Math.round(6.66…) = 7
    const result = assessApplicationCompleteness('sfcc-registration', {
      applicantType: 'firm',
      dateReceived: '2026-04-05'
    })
    expect(result.percentage).toBe(Math.round((result.totalProvided / result.totalRequired) * 100))
    expect(Number.isInteger(result.percentage)).toBe(true)
  })
})
