import { describe, expect, it } from 'vitest'
import { FIELD_HELP, getFieldHelp } from '@/constants/fieldHelpText'

describe('fieldHelpText', () => {
  it('FIELD_HELP is frozen', () => {
    expect(Object.isFrozen(FIELD_HELP)).toBe(true)
  })

  it('has help text for sector', () => {
    expect(typeof FIELD_HELP.sector).toBe('string')
    expect(FIELD_HELP.sector.length).toBeGreaterThan(0)
  })

  it('has help text for transactionType', () => {
    expect(typeof FIELD_HELP.transactionType).toBe('string')
    expect(FIELD_HELP.transactionType.length).toBeGreaterThan(0)
  })

  it('getFieldHelp returns text for known key', () => {
    const help = getFieldHelp('sector')
    expect(typeof help).toBe('string')
    expect(help.length).toBeGreaterThan(0)
  })

  it('getFieldHelp returns null for unknown key', () => {
    expect(getFieldHelp('nonExistentKey')).toBeNull()
    expect(getFieldHelp('')).toBeNull()
    expect(getFieldHelp(undefined)).toBeNull()
  })

  it('all values are non-empty strings', () => {
    for (const [key, value] of Object.entries(FIELD_HELP)) {
      expect(typeof value).toBe('string', `Expected string for key "${key}"`)
      expect(value.length).toBeGreaterThan(0, `Expected non-empty string for key "${key}"`)
    }
  })

  it('covers merger-specific fields', () => {
    const mergerFields = [
      'transactionType',
      'partiesInvolved',
      'estimatedTurnover',
      'transactionValue',
      'targetFirmName',
      'targetFirmBusiness',
      'acquisitionDescription',
      'commercialRationale',
      'relevantMarketDefinition',
      'confidentialityStatement'
    ]
    for (const field of mergerFields) {
      expect(FIELD_HELP).toHaveProperty(field)
      expect(typeof FIELD_HELP[field]).toBe('string')
      expect(FIELD_HELP[field].length).toBeGreaterThan(0)
    }
  })

  it('covers trademark-specific fields', () => {
    const trademarkFields = [
      'requestType',
      'ownerFullName',
      'ownerBusinessAddress',
      'ownerNationalityOrJurisdiction',
      'declarationAccepted'
    ]
    for (const field of trademarkFields) {
      expect(FIELD_HELP).toHaveProperty(field)
      expect(typeof FIELD_HELP[field]).toBe('string')
      expect(FIELD_HELP[field].length).toBeGreaterThan(0)
    }
  })

  it('covers general application fields', () => {
    const generalFields = ['dateReceived', 'applicationFee', 'businessDescription', 'sector']
    for (const field of generalFields) {
      expect(FIELD_HELP).toHaveProperty(field)
    }
  })

  it('covers SFCC-specific fields', () => {
    const sfccFields = ['contractCategory', 'targetMarket', 'consumerImpactSummary']
    for (const field of sfccFields) {
      expect(FIELD_HELP).toHaveProperty(field)
      expect(typeof FIELD_HELP[field]).toBe('string')
    }
  })

  it('covers legal opinion fields', () => {
    const legalFields = ['legalIssueCategory', 'questionSummary', 'supportingFacts']
    for (const field of legalFields) {
      expect(FIELD_HELP).toHaveProperty(field)
    }
  })

  it('covers exemption fields', () => {
    const exemptionFields = ['exemptionType', 'legalBasis', 'validityPeriodMonths']
    for (const field of exemptionFields) {
      expect(FIELD_HELP).toHaveProperty(field)
    }
  })

  it('transactionType help text mentions Merger, Acquisition, and Joint Venture', () => {
    const text = FIELD_HELP.transactionType
    expect(text).toMatch(/Merger/i)
    expect(text).toMatch(/Acquisition/i)
    expect(text).toMatch(/Joint Venture/i)
  })

  it('requestType help text describes trademark actions', () => {
    const text = FIELD_HELP.requestType
    expect(text.toLowerCase()).toMatch(/trademark/)
  })

  it('getFieldHelp returns identical value to direct property access', () => {
    const keys = Object.keys(FIELD_HELP)
    for (const key of keys) {
      expect(getFieldHelp(key)).toBe(FIELD_HELP[key])
    }
  })
})
