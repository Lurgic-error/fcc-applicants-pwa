import { describe, expect, it } from 'vitest'
import { getApplicationServiceExperience } from '@/constants/applicationServiceExperience'

describe('getApplicationServiceExperience', () => {
  it('builds a fee range for trademark recordation', () => {
    const experience = getApplicationServiceExperience('trademark-recordation')

    expect(experience.feeLabel).toContain('TZS 0')
    expect(experience.feeLabel).toContain('TZS 200,000')
    expect(experience.outcomeChipLabel).toBe('Certificate on approval')
  })

  it('describes per-contract SFCC fees and required fields', () => {
    const experience = getApplicationServiceExperience('sfcc-registration')

    expect(experience.feeLabel).toContain('per contract')
    expect(experience.requiredFieldCount).toBeGreaterThan(0)
    expect(experience.workflowLabel).toContain('workflow milestone')
  })

  it('marks non-certificate services as decision notices', () => {
    const experience = getApplicationServiceExperience('legal-opinion')

    expect(experience.certificatePolicy.available).toBe(false)
    expect(experience.outcomeChipLabel).toBe('Decision notice')
    expect(experience.outcomeLabel).toContain('decision or opinion notice')
  })
})
