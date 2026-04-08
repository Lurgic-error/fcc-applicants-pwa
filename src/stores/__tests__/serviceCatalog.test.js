import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { fetchPublicServiceCatalogsMock } = vi.hoisted(() => ({
  fetchPublicServiceCatalogsMock: vi.fn()
}))

vi.mock('@/services/applicantApi', () => ({
  fetchPublicServiceCatalogs: fetchPublicServiceCatalogsMock
}))

import { useApplicantServiceCatalogStore } from '@/stores/serviceCatalog'

describe('applicant service catalog store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    fetchPublicServiceCatalogsMock.mockReset()
  })

  it('prefers live published service catalog entries for supported services', async () => {
    fetchPublicServiceCatalogsMock.mockResolvedValue({
      serviceCatalogs: [
        {
          serviceCatalogId: 'svc-cat-1',
          service: 'trademark-recordation',
          title: 'Trademark Recordation (Published)',
          description: 'Live catalog entry for trademark recordation.'
        }
      ]
    })

    const store = useApplicantServiceCatalogStore()
    await store.loadPublicServices()

    expect(store.source).toBe('live')
    expect(store.availableServices).toEqual([
      expect.objectContaining({
        key: 'trademark-recordation',
        label: 'Trademark Recordation (Published)',
        serviceCatalogId: 'svc-cat-1',
        source: 'live'
      })
    ])
  })

  it('falls back to the built-in catalog when live loading fails', async () => {
    fetchPublicServiceCatalogsMock.mockRejectedValue(new Error('catalog unavailable'))

    const store = useApplicantServiceCatalogStore()
    await store.loadPublicServices()

    expect(store.source).toBe('fallback')
    expect(store.error).toContain('catalog unavailable')
    expect(store.serviceByKey('trademark-recordation')).toEqual(
      expect.objectContaining({
        key: 'trademark-recordation',
        label: 'Trademark Recordation',
        source: 'fallback'
      })
    )
  })
})
