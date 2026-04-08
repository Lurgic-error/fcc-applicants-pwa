import { describe, expect, it } from 'vitest'
import { SERVICE_PREPARATION, getServicePreparation } from '@/constants/servicePreparation'

const ALL_SERVICE_KEYS = [
  'trademark-recordation',
  'merger-clearance',
  'sfcc-registration',
  'legal-opinion',
  'exemption'
]

describe('servicePreparation', () => {
  it('defines preparation for all 5 services', () => {
    for (const key of ALL_SERVICE_KEYS) {
      expect(SERVICE_PREPARATION).toHaveProperty(key)
    }
    expect(Object.keys(SERVICE_PREPARATION)).toHaveLength(5)
  })

  it('is frozen (immutable)', () => {
    expect(Object.isFrozen(SERVICE_PREPARATION)).toBe(true)
  })

  it('each service has title, description, estimatedTime', () => {
    for (const key of ALL_SERVICE_KEYS) {
      const service = SERVICE_PREPARATION[key]
      expect(typeof service.title).toBe('string')
      expect(service.title.length).toBeGreaterThan(0)
      expect(typeof service.description).toBe('string')
      expect(service.description.length).toBeGreaterThan(0)
      expect(typeof service.estimatedTime).toBe('string')
      expect(service.estimatedTime.length).toBeGreaterThan(0)
    }
  })

  it('each service has a checklist array', () => {
    for (const key of ALL_SERVICE_KEYS) {
      const service = SERVICE_PREPARATION[key]
      expect(Array.isArray(service.checklist)).toBe(true)
      expect(service.checklist.length).toBeGreaterThan(0)
    }
  })

  it('each checklist item has label, required, tip', () => {
    for (const key of ALL_SERVICE_KEYS) {
      const { checklist } = SERVICE_PREPARATION[key]
      for (const item of checklist) {
        expect(typeof item.label).toBe('string')
        expect(item.label.length).toBeGreaterThan(0)
        expect(typeof item.required).toBe('boolean')
        expect(typeof item.tip).toBe('string')
        expect(item.tip.length).toBeGreaterThan(0)
      }
    }
  })

  it('trademark-recordation has downloadable forms', () => {
    const service = SERVICE_PREPARATION['trademark-recordation']
    expect(Array.isArray(service.forms)).toBe(true)
    expect(service.forms.length).toBeGreaterThan(0)
    for (const form of service.forms) {
      expect(typeof form.label).toBe('string')
      expect(form.label.length).toBeGreaterThan(0)
      expect(typeof form.filename).toBe('string')
      expect(form.filename).toMatch(/\.pdf$/i)
    }
  })

  it('trademark-recordation has FCC Form 1 and FCC Form 2 downloads', () => {
    const { forms } = SERVICE_PREPARATION['trademark-recordation']
    const filenames = forms.map((f) => f.filename)
    expect(filenames).toContain('FCC_Form_1.pdf')
    expect(filenames).toContain('FCC_Form_2.pdf')
  })

  it('merger-clearance has 9+ checklist items', () => {
    const { checklist } = SERVICE_PREPARATION['merger-clearance']
    expect(checklist.length).toBeGreaterThanOrEqual(9)
  })

  it('merger-clearance includes at least one optional checklist item', () => {
    const { checklist } = SERVICE_PREPARATION['merger-clearance']
    const optionalItems = checklist.filter((item) => item.required === false)
    expect(optionalItems.length).toBeGreaterThan(0)
  })

  it('getServicePreparation returns correct service object', () => {
    for (const key of ALL_SERVICE_KEYS) {
      const result = getServicePreparation(key)
      expect(result).toBe(SERVICE_PREPARATION[key])
    }
  })

  it('getServicePreparation returns null for unknown service key', () => {
    expect(getServicePreparation('not-a-real-service')).toBeNull()
    expect(getServicePreparation('')).toBeNull()
    expect(getServicePreparation(undefined)).toBeNull()
  })

  it('fee schedules have type and amount', () => {
    for (const key of ALL_SERVICE_KEYS) {
      const { fees } = SERVICE_PREPARATION[key]
      expect(Array.isArray(fees)).toBe(true)
      expect(fees.length).toBeGreaterThan(0)
      for (const fee of fees) {
        expect(typeof fee.type).toBe('string')
        expect(fee.type.length).toBeGreaterThan(0)
        expect(typeof fee.amount).toBe('string')
        expect(fee.amount.length).toBeGreaterThan(0)
      }
    }
  })

  it('trademark-recordation fee schedule covers all 7 request types', () => {
    const { fees } = SERVICE_PREPARATION['trademark-recordation']
    expect(fees).toHaveLength(7)
  })

  it('trademark-recordation fee schedule includes TZS amounts for paid types', () => {
    const { fees } = SERVICE_PREPARATION['trademark-recordation']
    const paidFees = fees.filter((f) => f.amount.includes('TZS'))
    expect(paidFees.length).toBeGreaterThan(0)
  })

  it('trademark-recordation fee schedule marks agent_appointment and discontinuation as No fee', () => {
    const { fees } = SERVICE_PREPARATION['trademark-recordation']
    const agentFee = fees.find((f) => f.type === 'Agent Appointment')
    const discFee = fees.find((f) => f.type === 'Discontinuation')
    expect(agentFee).toBeDefined()
    expect(agentFee.amount).toBe('No fee')
    expect(discFee).toBeDefined()
    expect(discFee.amount).toBe('No fee')
  })

  it('sfcc-registration has an empty forms array', () => {
    const { forms } = SERVICE_PREPARATION['sfcc-registration']
    expect(Array.isArray(forms)).toBe(true)
    expect(forms).toHaveLength(0)
  })

  it('legal-opinion has an empty forms array', () => {
    const { forms } = SERVICE_PREPARATION['legal-opinion']
    expect(Array.isArray(forms)).toBe(true)
    expect(forms).toHaveLength(0)
  })

  it('exemption has an empty forms array', () => {
    const { forms } = SERVICE_PREPARATION['exemption']
    expect(Array.isArray(forms)).toBe(true)
    expect(forms).toHaveLength(0)
  })

  it('merger-clearance has exactly one downloadable form (FCC-8)', () => {
    const { forms } = SERVICE_PREPARATION['merger-clearance']
    expect(forms).toHaveLength(1)
    expect(forms[0].filename).toBe('FCC_Form_8.pdf')
  })
})
