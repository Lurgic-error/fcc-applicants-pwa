import { defineStore } from 'pinia'
import {
  APPLICATION_SERVICES,
  DEFAULT_APPLICATION_SERVICE_KEY,
  getApplicationServiceByKey,
  isValidApplicationServiceKey
} from '@/constants/applicationCatalog'
import { fetchPublicServiceCatalogs } from '@/services/applicantApi'

function normalizeText(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function buildFallbackServices() {
  return APPLICATION_SERVICES.map((service) => ({
    ...service,
    serviceCatalogId: null,
    catalogCode: null,
    applicationType: service.key,
    isChargeable: null,
    source: 'fallback',
    raw: null
  }))
}

function orderServices(rows = []) {
  const serviceOrder = new Map(
    APPLICATION_SERVICES.map((service, index) => [service.key, index])
  )

  return [...rows].sort((left, right) => {
    const leftOrder = serviceOrder.get(left.key) ?? Number.MAX_SAFE_INTEGER
    const rightOrder = serviceOrder.get(right.key) ?? Number.MAX_SAFE_INTEGER

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder
    }

    return String(left.label || left.key).localeCompare(String(right.label || right.key))
  })
}

function normalizeCatalogService(row = {}) {
  const serviceKey = normalizeText(row.service || row.applicationType)
  if (!isValidApplicationServiceKey(serviceKey)) {
    return null
  }

  const fallback = getApplicationServiceByKey(serviceKey)
  return {
    ...fallback,
    key: serviceKey,
    label: String(row.title || row.name || fallback.label),
    description: String(row.description || fallback.description || ''),
    serviceCatalogId: row.serviceCatalogId || row._id || null,
    catalogCode: row.code || null,
    applicationType: row.applicationType || fallback.key,
    isChargeable: row.isChargeable ?? null,
    source: 'live',
    raw: row
  }
}

export const useApplicantServiceCatalogStore = defineStore('applicant-service-catalog', {
  state: () => ({
    services: buildFallbackServices(),
    loading: false,
    loaded: false,
    source: 'fallback',
    error: null,
    serviceProfiles: {}
  }),
  getters: {
    availableServices: (state) => state.services,
    serviceByKey: (state) => (serviceKey = DEFAULT_APPLICATION_SERVICE_KEY) => {
      const normalizedKey = normalizeText(serviceKey)
      return (
        state.services.find((service) => service.key === normalizedKey) ||
        buildFallbackServices().find((service) => service.key === normalizedKey) ||
        getApplicationServiceByKey(normalizedKey)
      )
    }
  },
  actions: {
    applyFallback(error = null) {
      this.services = buildFallbackServices()
      this.source = 'fallback'
      this.loaded = true
      this.error = error ? String(error) : null
      return this.services
    },

    async loadPublicServices({ force = false } = {}) {
      if (this.loading) {
        return this.services
      }

      if (this.loaded && !force) {
        return this.services
      }

      this.loading = true

      try {
        const result = await fetchPublicServiceCatalogs({
          audience: 'external',
          channel: 'applicant_portal',
          limit: 100
        })

        if (result?.error) {
          throw new Error(result.error)
        }

        this.services = orderServices(
          (Array.isArray(result?.serviceCatalogs) ? result.serviceCatalogs : [])
            .map((row) => normalizeCatalogService(row))
            .filter(Boolean)
        )
        this.source = 'live'
        this.loaded = true
        this.error = null
        return this.services
      } catch (error) {
        return this.applyFallback(error?.message || error)
      } finally {
        this.loading = false
      }
    },

    async fetchServiceProfile(serviceKey) {
      if (this.serviceProfiles[serviceKey]) return this.serviceProfiles[serviceKey]

      try {
        const result = await fetchPublicServiceCatalogs({
          audience: 'external',
          channel: 'applicant_portal',
          limit: 100
        })
        const catalogs = Array.isArray(result?.serviceCatalogs) ? result.serviceCatalogs : []
        const catalog = catalogs.find(
          (c) => c.service === serviceKey || c.code === serviceKey
        )
        if (catalog) {
          this.serviceProfiles[serviceKey] = catalog
        }
        return catalog || null
      } catch {
        return null
      }
    }
  }
})
