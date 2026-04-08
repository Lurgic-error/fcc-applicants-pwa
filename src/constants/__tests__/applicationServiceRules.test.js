import { describe, expect, it } from 'vitest'
import { calculateServiceFees, getCertificatePolicy } from '@/constants/applicationServiceRules'

describe('applicationServiceRules', () => {
  describe('calculateServiceFees — trademark-recordation (trademark-request model)', () => {
    it('returns trademark-request model identifier', () => {
      const result = calculateServiceFees('trademark-recordation', {})
      expect(result.model).toBe('trademark-request')
    })

    it('defaults to new_recordation fee (200000) when no request type provided', () => {
      const result = calculateServiceFees('trademark-recordation', {})
      expect(result.total).toBe(200000)
    })

    it('uses renewal fee (50000) when requestType is renewal', () => {
      const result = calculateServiceFees('trademark-recordation', {
        trademarkRecordation: { requestType: 'renewal' }
      })
      expect(result.total).toBe(50000)
    })

    it('uses ownership_change fee (150000) when requestType is ownership_change', () => {
      const result = calculateServiceFees('trademark-recordation', {
        trademarkRecordation: { requestType: 'ownership_change' }
      })
      expect(result.total).toBe(150000)
    })

    it('multiplies fee by number of named trademarks', () => {
      const result = calculateServiceFees('trademark-recordation', {
        trademarkRecordation: {
          requestType: 'new_recordation',
          trademarks: [
            { trademarkName: 'Alpha' },
            { trademarkName: 'Beta' }
          ]
        }
      })
      expect(result.total).toBe(400000)
      expect(result.breakdown).toHaveLength(2)
    })

    it('produces a single breakdown line when no trademark rows are provided', () => {
      const result = calculateServiceFees('trademark-recordation', {
        trademarkRecordation: { requestType: 'new_recordation' }
      })
      expect(result.breakdown).toHaveLength(1)
    })

    it('marks agent_appointment breakdown as no payment required', () => {
      // agent_appointment has a configured fee of 0 (falsy); the model falls back
      // to rule.fees.base (200,000) as the per-trademark fee, but the label still
      // carries the "(No payment required)" annotation because paymentRequired is false.
      const result = calculateServiceFees('trademark-recordation', {
        trademarkRecordation: { requestType: 'agent_appointment' }
      })
      expect(result.breakdown[0].label).toContain('No payment required')
      expect(result.breakdown[0].label).toContain('Agent Appointment')
    })

    it('defaults currency to TZS', () => {
      const result = calculateServiceFees('trademark-recordation', {})
      expect(result.currency).toBe('TZS')
    })

    it('respects custom currency input', () => {
      const result = calculateServiceFees('trademark-recordation', { currency: 'USD' })
      expect(result.currency).toBe('USD')
    })

    it('reads requestType from top-level trademarkRequestType field as fallback', () => {
      const result = calculateServiceFees('trademark-recordation', {
        trademarkRequestType: 'alteration'
      })
      expect(result.total).toBe(100000)
    })

    it('filters out trademark rows that have no trademarkName or markName', () => {
      const result = calculateServiceFees('trademark-recordation', {
        trademarkRecordation: {
          requestType: 'new_recordation',
          trademarks: [
            { trademarkName: 'ValidMark' },
            {}
          ]
        }
      })
      expect(result.total).toBe(200000)
      expect(result.breakdown).toHaveLength(1)
    })
  })

  describe('calculateServiceFees — sfcc-registration (per-contract model)', () => {
    it('returns per-contract model identifier', () => {
      const result = calculateServiceFees('sfcc-registration', {})
      expect(result.model).toBe('per-contract')
    })

    it('uses fallback fee of 95000 when no contracts are supplied', () => {
      const result = calculateServiceFees('sfcc-registration', {})
      expect(result.total).toBe(95000)
    })

    it('sums 95000 per contract for multiple contracts', () => {
      const result = calculateServiceFees('sfcc-registration', {
        contracts: [
          { contractId: 'C-1', contractName: 'Distribution Agreement' },
          { contractId: 'C-2', contractName: 'Supply Agreement' }
        ]
      })
      expect(result.total).toBe(190000)
      expect(result.breakdown).toHaveLength(2)
    })

    it('each breakdown line carries the per-contract amount', () => {
      const result = calculateServiceFees('sfcc-registration', {
        contracts: [{ contractId: 'C-1', contractName: 'Franchise' }]
      })
      expect(result.breakdown[0].amount).toBe(95000)
    })

    it('uses contractId as lineId when available', () => {
      const result = calculateServiceFees('sfcc-registration', {
        contracts: [{ contractId: 'MY-C-ID', contractName: 'Test' }]
      })
      expect(result.breakdown[0].lineId).toBe('MY-C-ID')
    })

    it('falls back to contract index lineId when contractId is absent', () => {
      const result = calculateServiceFees('sfcc-registration', {
        contracts: [{ contractName: 'Test' }]
      })
      expect(result.breakdown[0].lineId).toBe('contract-1')
    })
  })

  describe('calculateServiceFees — merger-clearance (single-clearance model)', () => {
    it('returns single-clearance model identifier', () => {
      const result = calculateServiceFees('merger-clearance', {})
      expect(result.model).toBe('single-clearance')
    })

    it('returns base fee of 850000 when transaction value is zero', () => {
      const result = calculateServiceFees('merger-clearance', {})
      expect(result.total).toBe(850000)
    })

    it('adds 50000 for each 1 billion TZS of transaction value', () => {
      const result = calculateServiceFees('merger-clearance', {
        mergerClearance: { transactionValue: 2_000_000_000 }
      })
      expect(result.total).toBe(850000 + 100000)
    })

    it('reads transactionValue from top-level input as fallback', () => {
      const result = calculateServiceFees('merger-clearance', {
        transactionValue: 1_000_000_000
      })
      expect(result.total).toBe(900000)
    })

    it('produces exactly one breakdown line', () => {
      const result = calculateServiceFees('merger-clearance', {})
      expect(result.breakdown).toHaveLength(1)
      expect(result.breakdown[0].lineId).toBe('merger-clearance-fee')
    })
  })

  describe('calculateServiceFees — legal-opinion (fixed model)', () => {
    it('returns fixed model identifier', () => {
      const result = calculateServiceFees('legal-opinion', {})
      expect(result.model).toBe('fixed')
    })

    it('returns base fee of 250000 when no applicationFee override is given', () => {
      const result = calculateServiceFees('legal-opinion', {})
      expect(result.total).toBe(250000)
    })

    it('respects applicationFee override', () => {
      const result = calculateServiceFees('legal-opinion', { applicationFee: 300000 })
      expect(result.total).toBe(300000)
    })

    it('produces a single breakdown line with label Application Processing Fee', () => {
      const result = calculateServiceFees('legal-opinion', {})
      expect(result.breakdown).toHaveLength(1)
      expect(result.breakdown[0].label).toBe('Application Processing Fee')
    })
  })

  describe('calculateServiceFees — exemption (fixed model)', () => {
    it('returns base fee of 180000', () => {
      const result = calculateServiceFees('exemption', {})
      expect(result.total).toBe(180000)
    })

    it('respects applicationFee override', () => {
      const result = calculateServiceFees('exemption', { applicationFee: 200000 })
      expect(result.total).toBe(200000)
    })

    it('lineId in breakdown uses the service key prefix', () => {
      const result = calculateServiceFees('exemption', {})
      expect(result.breakdown[0].lineId).toBe('exemption-base-fee')
    })
  })

  describe('getCertificatePolicy', () => {
    it('trademark-recordation has certificate available with 12 month validity', () => {
      const policy = getCertificatePolicy('trademark-recordation')
      expect(policy.available).toBe(true)
      expect(policy.validityMonths).toBe(12)
    })

    it('sfcc-registration has certificate available with 12 month validity', () => {
      const policy = getCertificatePolicy('sfcc-registration')
      expect(policy.available).toBe(true)
      expect(policy.validityMonths).toBe(12)
    })

    it('merger-clearance has certificate available with null validity (no fixed expiry)', () => {
      const policy = getCertificatePolicy('merger-clearance')
      expect(policy.available).toBe(true)
      expect(policy.validityMonths).toBeNull()
    })

    it('legal-opinion certificate is not available', () => {
      const policy = getCertificatePolicy('legal-opinion')
      expect(policy.available).toBe(false)
      expect(policy.validityMonths).toBeNull()
    })

    it('exemption certificate is not available', () => {
      const policy = getCertificatePolicy('exemption')
      expect(policy.available).toBe(false)
      expect(policy.validityMonths).toBeNull()
    })

    it('always returns an object with available (boolean) and validityMonths', () => {
      for (const key of ['trademark-recordation', 'sfcc-registration', 'merger-clearance', 'legal-opinion', 'exemption']) {
        const policy = getCertificatePolicy(key)
        expect(typeof policy.available).toBe('boolean')
        expect('validityMonths' in policy).toBe(true)
      }
    })

    it('falls back to default service key for unknown service', () => {
      const policy = getCertificatePolicy('does-not-exist')
      expect(typeof policy.available).toBe('boolean')
    })
  })
})
