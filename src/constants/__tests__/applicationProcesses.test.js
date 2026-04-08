import { describe, expect, it } from 'vitest'
import {
  getApplicationProcessConfig,
  getApplicationProcessName,
  getApplicationProcessStages,
  getApplicationServiceFields
} from '@/constants/applicationProcesses'

describe('applicationProcesses', () => {
  // ── getApplicationProcessConfig ────────────────────────────────────────────

  it('returns config for trademark-recordation', () => {
    const config = getApplicationProcessConfig('trademark-recordation')
    expect(config).toBeDefined()
    expect(config.processName).toBe('Trademark Recordation')
    expect(Array.isArray(config.stages)).toBe(true)
    expect(Array.isArray(config.fields)).toBe(true)
  })

  it('returns config for merger-clearance', () => {
    const config = getApplicationProcessConfig('merger-clearance')
    expect(config).toBeDefined()
    expect(config.processName).toBe('Merger Clearance')
    expect(Array.isArray(config.stages)).toBe(true)
    expect(Array.isArray(config.fields)).toBe(true)
  })

  it('returns config for sfcc-registration', () => {
    const config = getApplicationProcessConfig('sfcc-registration')
    expect(config).toBeDefined()
    expect(config.processName).toBe('SFCC Registration')
    expect(Array.isArray(config.stages)).toBe(true)
    expect(Array.isArray(config.fields)).toBe(true)
  })

  it('returns config for legal-opinion', () => {
    const config = getApplicationProcessConfig('legal-opinion')
    expect(config).toBeDefined()
    expect(config.processName).toBe('Legal Opinion')
    expect(Array.isArray(config.stages)).toBe(true)
    expect(Array.isArray(config.fields)).toBe(true)
  })

  it('returns config for exemption', () => {
    const config = getApplicationProcessConfig('exemption')
    expect(config).toBeDefined()
    expect(config.processName).toBe('Exemption')
    expect(Array.isArray(config.stages)).toBe(true)
    expect(Array.isArray(config.fields)).toBe(true)
  })

  it('returns default config for unknown service', () => {
    const config = getApplicationProcessConfig('unknown-service-xyz')
    // Falls back to DEFAULT_APPLICATION_SERVICE_KEY = 'sfcc-registration'
    expect(config).toBeDefined()
    expect(config.processName).toBe('SFCC Registration')
    expect(Array.isArray(config.stages)).toBe(true)
  })

  // ── getApplicationProcessName ──────────────────────────────────────────────

  it('getApplicationProcessName returns process name string', () => {
    expect(getApplicationProcessName('trademark-recordation')).toBe('Trademark Recordation')
    expect(getApplicationProcessName('merger-clearance')).toBe('Merger Clearance')
    expect(getApplicationProcessName('sfcc-registration')).toBe('SFCC Registration')
    expect(getApplicationProcessName('legal-opinion')).toBe('Legal Opinion')
    expect(getApplicationProcessName('exemption')).toBe('Exemption')
  })

  // ── getApplicationProcessStages ────────────────────────────────────────────

  it('getApplicationProcessStages returns array of stages', () => {
    const stages = getApplicationProcessStages('sfcc-registration')
    expect(Array.isArray(stages)).toBe(true)
    expect(stages.length).toBeGreaterThan(0)
  })

  it('each stage has key, title, and actor', () => {
    const serviceKeys = [
      'trademark-recordation',
      'merger-clearance',
      'sfcc-registration',
      'legal-opinion',
      'exemption'
    ]

    for (const key of serviceKeys) {
      const stages = getApplicationProcessStages(key)
      for (const stage of stages) {
        expect(stage).toHaveProperty('key')
        expect(stage).toHaveProperty('title')
        expect(stage).toHaveProperty('actor')
        expect(typeof stage.key).toBe('string')
        expect(typeof stage.title).toBe('string')
        expect(typeof stage.actor).toBe('string')
      }
    }
  })

  // ── getApplicationServiceFields ────────────────────────────────────────────

  it('getApplicationServiceFields returns array of fields', () => {
    const fields = getApplicationServiceFields('sfcc-registration')
    expect(Array.isArray(fields)).toBe(true)
    expect(fields.length).toBeGreaterThan(0)
  })

  it('each field has key, label, type, required', () => {
    const serviceKeys = [
      'trademark-recordation',
      'merger-clearance',
      'sfcc-registration',
      'legal-opinion',
      'exemption'
    ]

    for (const key of serviceKeys) {
      const fields = getApplicationServiceFields(key)
      for (const field of fields) {
        expect(field).toHaveProperty('key')
        expect(field).toHaveProperty('label')
        expect(field).toHaveProperty('type')
        expect(field).toHaveProperty('required')
        expect(typeof field.key).toBe('string')
        expect(typeof field.label).toBe('string')
        expect(typeof field.type).toBe('string')
        expect(typeof field.required).toBe('boolean')
      }
    }
  })

  it('trademark fields include step assignments', () => {
    const fields = getApplicationServiceFields('trademark-recordation')
    const fieldsWithStep = fields.filter((f) => 'step' in f)
    expect(fieldsWithStep.length).toBeGreaterThan(0)

    for (const field of fieldsWithStep) {
      expect(typeof field.step).toBe('number')
    }
  })

  it('merger fields include all required transaction fields', () => {
    const fields = getApplicationServiceFields('merger-clearance')
    const fieldKeys = fields.map((f) => f.key)

    expect(fieldKeys).toContain('transactionType')
    expect(fieldKeys).toContain('partiesInvolved')
    expect(fieldKeys).toContain('transactionValue')
    expect(fieldKeys).toContain('estimatedTurnover')
    expect(fieldKeys).toContain('targetFirmName')

    const requiredFields = fields.filter((f) => f.required)
    expect(requiredFields.length).toBeGreaterThan(0)
  })
})
