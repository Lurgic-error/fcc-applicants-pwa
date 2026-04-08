import { describe, expect, it } from 'vitest'
import { assessApplicationCompleteness } from '@/services/applicationCompleteness'

describe('ApplicationCompletenessDrawer data', () => {
  it('completeness engine returns correct section structure for trademark', () => {
    const result = assessApplicationCompleteness('trademark-recordation', {
      dateReceived: '2026-01-01',
      sector: 'Manufacturing',
      trademarkRecordation: { requestType: 'new_recordation' }
    })
    expect(result.sections).toHaveLength(5)
    expect(result.sections[0].status).toBe('complete')
    expect(result.percentage).toBeGreaterThan(0)
  })

  it('returns 3 sections for generic service', () => {
    const result = assessApplicationCompleteness('sfcc-registration', {})
    expect(result.sections).toHaveLength(3)
    expect(result.complete).toBe(false)
  })

  it('correctly identifies partial sections', () => {
    const result = assessApplicationCompleteness('sfcc-registration', {
      dateReceived: '2026-01-01'
    })
    expect(result.sections[0].status).toBe('partial')
    expect(result.sections[0].missingFields.length).toBeGreaterThan(0)
  })
})
