import { describe, expect, it } from 'vitest'
import {
  TRADEMARK_REQUEST_TYPE_OPTIONS,
  TRADEMARK_DOCUMENT_OPTIONS,
  getTrademarkFeeByRequestType,
  isTrademarkPaymentRequired,
  getTrademarkRequiredDocuments,
  labelTrademarkRequestType,
  formatTzs
} from '@/constants/trademarkRecordation'

describe('trademarkRecordation', () => {
  describe('TRADEMARK_REQUEST_TYPE_OPTIONS', () => {
    it('defines 7 request types', () => {
      expect(TRADEMARK_REQUEST_TYPE_OPTIONS).toHaveLength(7)
    })

    it('every option has key, label, shortLabel, description, feeTzs, paymentRequired', () => {
      for (const option of TRADEMARK_REQUEST_TYPE_OPTIONS) {
        expect(option).toHaveProperty('key')
        expect(option).toHaveProperty('label')
        expect(option).toHaveProperty('shortLabel')
        expect(option).toHaveProperty('description')
        expect(option).toHaveProperty('feeTzs')
        expect(option).toHaveProperty('paymentRequired')
      }
    })

    it('is frozen (immutable)', () => {
      expect(Object.isFrozen(TRADEMARK_REQUEST_TYPE_OPTIONS)).toBe(true)
    })

    it('contains new_recordation as the first entry', () => {
      expect(TRADEMARK_REQUEST_TYPE_OPTIONS[0].key).toBe('new_recordation')
    })

    it('agent_appointment has zero fee and paymentRequired false', () => {
      const option = TRADEMARK_REQUEST_TYPE_OPTIONS.find((o) => o.key === 'agent_appointment')
      expect(option).toBeDefined()
      expect(option.feeTzs).toBe(0)
      expect(option.paymentRequired).toBe(false)
    })

    it('discontinuation has zero fee and paymentRequired false', () => {
      const option = TRADEMARK_REQUEST_TYPE_OPTIONS.find((o) => o.key === 'discontinuation')
      expect(option).toBeDefined()
      expect(option.feeTzs).toBe(0)
      expect(option.paymentRequired).toBe(false)
    })
  })

  describe('TRADEMARK_DOCUMENT_OPTIONS', () => {
    it('defines 14 document options', () => {
      expect(TRADEMARK_DOCUMENT_OPTIONS).toHaveLength(14)
    })

    it('every document option has key and label', () => {
      for (const doc of TRADEMARK_DOCUMENT_OPTIONS) {
        expect(typeof doc.key).toBe('string')
        expect(doc.key.length).toBeGreaterThan(0)
        expect(typeof doc.label).toBe('string')
        expect(doc.label.length).toBeGreaterThan(0)
      }
    })

    it('includes proof_of_payment as an option', () => {
      const doc = TRADEMARK_DOCUMENT_OPTIONS.find((d) => d.key === 'proof_of_payment')
      expect(doc).toBeDefined()
    })

    it('includes power_of_attorney as an option', () => {
      const doc = TRADEMARK_DOCUMENT_OPTIONS.find((d) => d.key === 'power_of_attorney')
      expect(doc).toBeDefined()
    })
  })

  describe('getTrademarkFeeByRequestType', () => {
    it('returns 200000 for new_recordation', () => {
      expect(getTrademarkFeeByRequestType('new_recordation')).toBe(200000)
    })

    it('returns 50000 for renewal', () => {
      expect(getTrademarkFeeByRequestType('renewal')).toBe(50000)
    })

    it('returns 100000 for alteration', () => {
      expect(getTrademarkFeeByRequestType('alteration')).toBe(100000)
    })

    it('returns 150000 for ownership_change', () => {
      expect(getTrademarkFeeByRequestType('ownership_change')).toBe(150000)
    })

    it('returns 100000 for name_change', () => {
      expect(getTrademarkFeeByRequestType('name_change')).toBe(100000)
    })

    it('returns 0 for agent_appointment', () => {
      expect(getTrademarkFeeByRequestType('agent_appointment')).toBe(0)
    })

    it('returns 0 for discontinuation', () => {
      expect(getTrademarkFeeByRequestType('discontinuation')).toBe(0)
    })

    it('defaults to new_recordation fee for unknown type', () => {
      expect(getTrademarkFeeByRequestType('completely_unknown')).toBe(200000)
    })

    it('defaults to new_recordation fee when called with no arguments', () => {
      expect(getTrademarkFeeByRequestType()).toBe(200000)
    })
  })

  describe('isTrademarkPaymentRequired', () => {
    it('returns true for new_recordation', () => {
      expect(isTrademarkPaymentRequired('new_recordation')).toBe(true)
    })

    it('returns true for renewal', () => {
      expect(isTrademarkPaymentRequired('renewal')).toBe(true)
    })

    it('returns true for alteration', () => {
      expect(isTrademarkPaymentRequired('alteration')).toBe(true)
    })

    it('returns true for ownership_change', () => {
      expect(isTrademarkPaymentRequired('ownership_change')).toBe(true)
    })

    it('returns true for name_change', () => {
      expect(isTrademarkPaymentRequired('name_change')).toBe(true)
    })

    it('returns false for agent_appointment', () => {
      expect(isTrademarkPaymentRequired('agent_appointment')).toBe(false)
    })

    it('returns false for discontinuation', () => {
      expect(isTrademarkPaymentRequired('discontinuation')).toBe(false)
    })

    it('always returns a boolean', () => {
      for (const type of ['new_recordation', 'renewal', 'agent_appointment', 'discontinuation']) {
        expect(typeof isTrademarkPaymentRequired(type)).toBe('boolean')
      }
    })
  })

  describe('getTrademarkRequiredDocuments', () => {
    it('returns an array for every known request type', () => {
      const types = ['new_recordation', 'renewal', 'alteration', 'ownership_change', 'name_change', 'agent_appointment', 'discontinuation']
      for (const type of types) {
        const docs = getTrademarkRequiredDocuments(type)
        expect(Array.isArray(docs)).toBe(true)
        expect(docs.length).toBeGreaterThan(0)
      }
    })

    it('includes fcc_1_form for new_recordation', () => {
      const docs = getTrademarkRequiredDocuments('new_recordation')
      const keys = docs.map((d) => d.key)
      expect(keys).toContain('fcc_1_form')
    })

    it('includes fcc_2_form for ownership_change', () => {
      const docs = getTrademarkRequiredDocuments('ownership_change')
      const keys = docs.map((d) => d.key)
      expect(keys).toContain('fcc_2_form')
    })

    it('appends power_of_attorney when requiresAgent is true', () => {
      const docs = getTrademarkRequiredDocuments('new_recordation', { requiresAgent: true })
      const keys = docs.map((d) => d.key)
      expect(keys).toContain('power_of_attorney')
    })

    it('does not duplicate power_of_attorney for agent_appointment with requiresAgent true', () => {
      const docs = getTrademarkRequiredDocuments('agent_appointment', { requiresAgent: true })
      const keys = docs.map((d) => d.key)
      const poaCount = keys.filter((k) => k === 'power_of_attorney').length
      expect(poaCount).toBe(1)
    })

    it('appends proof_of_payment when includePaymentProof is true and payment is required', () => {
      const docs = getTrademarkRequiredDocuments('new_recordation', { includePaymentProof: true })
      const keys = docs.map((d) => d.key)
      expect(keys).toContain('proof_of_payment')
    })

    it('does not append proof_of_payment for agent_appointment even when includePaymentProof is true', () => {
      const docs = getTrademarkRequiredDocuments('agent_appointment', { includePaymentProof: true })
      const keys = docs.map((d) => d.key)
      expect(keys).not.toContain('proof_of_payment')
    })

    it('every returned document has key and label properties', () => {
      const docs = getTrademarkRequiredDocuments('new_recordation', { includePaymentProof: true, requiresAgent: true })
      for (const doc of docs) {
        expect(doc).toHaveProperty('key')
        expect(doc).toHaveProperty('label')
      }
    })
  })

  describe('labelTrademarkRequestType', () => {
    it('returns shortLabel for new_recordation', () => {
      expect(labelTrademarkRequestType('new_recordation')).toBe('New Recordation')
    })

    it('returns shortLabel for ownership_change', () => {
      expect(labelTrademarkRequestType('ownership_change')).toBe('Ownership Change')
    })

    it('returns shortLabel for agent_appointment', () => {
      expect(labelTrademarkRequestType('agent_appointment')).toBe('Agent Appointment')
    })

    it('falls back to new_recordation shortLabel for unknown type', () => {
      expect(labelTrademarkRequestType('not_a_real_type')).toBe('New Recordation')
    })

    it('falls back to new_recordation shortLabel when called with no arguments', () => {
      expect(labelTrademarkRequestType()).toBe('New Recordation')
    })
  })

  describe('formatTzs', () => {
    it('formats zero as TZS 0', () => {
      expect(formatTzs(0)).toBe('TZS 0')
    })

    it('formats 200000 with locale separators', () => {
      const result = formatTzs(200000)
      expect(result).toMatch(/^TZS /)
      expect(result).toContain('200')
    })

    it('formats 50000 starting with TZS', () => {
      expect(formatTzs(50000)).toMatch(/^TZS /)
    })

    it('defaults to 0 when called with no arguments', () => {
      expect(formatTzs()).toBe('TZS 0')
    })

    it('handles null-like values gracefully', () => {
      expect(formatTzs(null)).toBe('TZS 0')
      expect(formatTzs(undefined)).toBe('TZS 0')
    })

    it('returns a string', () => {
      expect(typeof formatTzs(150000)).toBe('string')
    })
  })
})
