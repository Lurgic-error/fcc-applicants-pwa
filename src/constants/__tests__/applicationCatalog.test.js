import { describe, expect, it } from 'vitest'
import {
  APPLICATION_SERVICES,
  isValidApplicationServiceKey,
  getApplicationServiceByKey,
  buildServiceOverviewRoute,
  buildApplicationDetailsRoute,
  buildApplicationUpdateRoute
} from '@/constants/applicationCatalog'

describe('applicationCatalog', () => {
  // ── APPLICATION_SERVICES array ─────────────────────────────────────────────

  it('defines exactly 5 application services', () => {
    expect(APPLICATION_SERVICES).toHaveLength(5)
  })

  it('each service has key, label, and description', () => {
    for (const service of APPLICATION_SERVICES) {
      expect(service).toHaveProperty('key')
      expect(service).toHaveProperty('label')
      expect(service).toHaveProperty('description')
      expect(typeof service.key).toBe('string')
      expect(service.key.length).toBeGreaterThan(0)
      expect(service.label.length).toBeGreaterThan(0)
      expect(service.description.length).toBeGreaterThan(0)
    }
  })

  it('all service keys are lowercase kebab-case', () => {
    const kebabPattern = /^[a-z]+(-[a-z]+)*$/
    for (const service of APPLICATION_SERVICES) {
      expect(service.key).toMatch(kebabPattern)
    }
  })

  // ── isValidApplicationServiceKey ──────────────────────────────────────────

  it('isValidApplicationServiceKey returns true for trademark-recordation', () => {
    expect(isValidApplicationServiceKey('trademark-recordation')).toBe(true)
  })

  it('isValidApplicationServiceKey returns true for merger-clearance', () => {
    expect(isValidApplicationServiceKey('merger-clearance')).toBe(true)
  })

  it('isValidApplicationServiceKey returns true for sfcc-registration', () => {
    expect(isValidApplicationServiceKey('sfcc-registration')).toBe(true)
  })

  it('isValidApplicationServiceKey returns true for legal-opinion', () => {
    expect(isValidApplicationServiceKey('legal-opinion')).toBe(true)
  })

  it('isValidApplicationServiceKey returns true for exemption', () => {
    expect(isValidApplicationServiceKey('exemption')).toBe(true)
  })

  it('isValidApplicationServiceKey returns false for unknown-service', () => {
    expect(isValidApplicationServiceKey('unknown-service')).toBe(false)
  })

  // ── getApplicationServiceByKey ────────────────────────────────────────────

  it('getApplicationServiceByKey returns correct service object', () => {
    const service = getApplicationServiceByKey('legal-opinion')
    expect(service.key).toBe('legal-opinion')
    expect(service.label).toBe('Legal Opinion')
  })

  it('getApplicationServiceByKey returns fallback for unknown key', () => {
    // Falls back to the DEFAULT_APPLICATION_SERVICE_KEY ('sfcc-registration')
    const service = getApplicationServiceByKey('does-not-exist')
    expect(service).toBeDefined()
    expect(service.key).toBe('sfcc-registration')
  })

  // ── buildServiceOverviewRoute ─────────────────────────────────────────────

  it('buildServiceOverviewRoute returns route with serviceKey param', () => {
    const route = buildServiceOverviewRoute('exemption')
    expect(route).toHaveProperty('name')
    expect(route).toHaveProperty('params')
    expect(route.params).toHaveProperty('serviceKey', 'exemption')
  })

  // ── buildApplicationDetailsRoute ──────────────────────────────────────────

  it('buildApplicationDetailsRoute includes serviceKey and id', () => {
    const route = buildApplicationDetailsRoute('merger-clearance', 'app-42')
    expect(route.name).toBe('application-details')
    expect(route.params.serviceKey).toBe('merger-clearance')
    expect(route.params.id).toBe('app-42')
  })

  // ── buildApplicationUpdateRoute ───────────────────────────────────────────

  it('buildApplicationUpdateRoute includes serviceKey and id', () => {
    const route = buildApplicationUpdateRoute('trademark-recordation', 'app-99')
    expect(route.name).toBe('application-update')
    expect(route.params.serviceKey).toBe('trademark-recordation')
    expect(route.params.id).toBe('app-99')
  })
})
