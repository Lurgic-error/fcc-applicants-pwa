import { defineStore } from 'pinia'
import { DEFAULT_APPLICATION_SERVICE_KEY } from '@/constants/applicationCatalog'
import {
  AVAILABLE_APPLICATION_ACTIONS,
  buildSfccApplicationPayload,
  confirmTrademarkPayment,
  createApplicantApplication,
  downloadApplicantCertificate,
  executeApplicationUseCase,
  fetchApplicantApplicationById,
  fetchApplicantApplications,
  fetchApplicantCertificates,
  fetchApplicantDashboard,
  fetchApplicantPayments,
  generateTrademarkControlNumber,
  fetchRegistrationTemplate,
  verifyTrademarkPaymentByControlNumber as verifyTrademarkPaymentByControlNumberApi,
  uploadTrademarkPaymentProof as uploadTrademarkPaymentProofApi,
  submitTrademarkApplication,
  updateApplicantApplication
} from '@/services/applicantApi'
import { resolveApplicationJourney } from '@/services/applicantJourney'
import { useAuthStore } from '@/stores/auth'

function hasPendingPaymentStatus(value = '') {
  const normalized = String(value || '').trim().toLowerCase()
  return normalized.includes('pending') || normalized.includes('awaiting') || normalized.includes('control')
}

function resolveCollectionSource(rows = [], previewResolver = (row) =>
  Boolean(row?.previewOnly || row?.raw?.previewOnly || row?.raw?.__preview)
) {
  if (!rows.length) {
    return 'empty'
  }

  return rows.some((row) => previewResolver(row)) ? 'preview' : 'live'
}

function decorateApplication(application, certificateApplicationIds = null) {
  if (!application || !application.applicationId) {
    return application
  }

  const options = {}
  // P1-B fix: pass real certificate presence so the journey only allows opening
  // certificates when actual records exist (not just when status text matches).
  if (certificateApplicationIds) {
    options.hasCertificateRecords = certificateApplicationIds.has(String(application.applicationId))
  }

  return {
    ...application,
    journey: resolveApplicationJourney(application, options)
  }
}

function decorateApplications(rows = [], certificateApplicationIds = null) {
  return rows
    .map((row) => decorateApplication(row, certificateApplicationIds))
    .filter(Boolean)
}

function decoratePayments(rows = [], applications = []) {
  const byApplicationId = new Map(
    applications.map((application) => [String(application.applicationId), application])
  )

  return (rows || []).map((row) => {
    const relatedApplication = byApplicationId.get(String(row.applicationId))

    return {
      ...row,
      relatedService: relatedApplication?.service || null,
      relatedServiceKey: relatedApplication?.serviceKey || null,
      relatedWorkflowStageTitle: relatedApplication?.workflowStageTitle || null,
      relatedApplicationJourney: relatedApplication?.journey || null
    }
  })
}

function decorateCertificates(rows = [], applications = []) {
  const byApplicationId = new Map(
    applications.map((application) => [String(application.applicationId), application])
  )

  return (rows || []).map((row) => {
    const relatedApplication = byApplicationId.get(String(row.applicationId))

    return {
      ...row,
      relatedServiceKey: relatedApplication?.serviceKey || null,
      relatedWorkflowStageTitle: relatedApplication?.workflowStageTitle || null,
      relatedApplicationJourney: relatedApplication?.journey || null,
      canOpenApplication: Boolean(relatedApplication)
    }
  })
}

export const useApplicantDataStore = defineStore('applicant-data', {
  state: () => ({
    processTemplate: null,
    dashboard: null,
    applications: [],
    payments: [],
    certificates: [],
    announcements: [],
    loading: false,
    loadingStates: {
      dashboard: false,
      applications: false,
      payments: false,
      certificates: false
    },
    sources: {
      dashboard: 'idle',
      applications: 'idle',
      payments: 'idle',
      certificates: 'idle'
    }
  }),
  getters: {
    applicationsByService: (state) => (serviceKey = DEFAULT_APPLICATION_SERVICE_KEY) =>
      state.applications.filter((application) => application.serviceKey === serviceKey),
    applicationById: (state) => (applicationId = '') =>
      state.applications.find((application) => String(application.applicationId) === String(applicationId)) || null,
    isLoadingSection: (state) => (section = '') => Boolean(state.loadingStates[section]),
    collectionSource: (state) => (section = '') => state.sources[section] || 'idle'
  },
  actions: {
    setLoading(section, value) {
      this.loadingStates[section] = Boolean(value)
      this.loading = Object.values(this.loadingStates).some(Boolean)
    },

    setSource(section, value) {
      this.sources[section] = value
    },

    _certificateApplicationIds() {
      return new Set(
        (this.certificates || [])
          .map((c) => String(c.applicationId || ''))
          .filter(Boolean)
      )
    },

    applyApplications(rows = []) {
      this.applications = decorateApplications(rows, this._certificateApplicationIds())
      this.setSource('applications', resolveCollectionSource(this.applications))
      return this.applications
    },

    applyPayments(rows = []) {
      this.payments = decoratePayments(rows, this.applications)
      this.setSource(
        'payments',
        this.payments.length ? (this.sources.applications === 'preview' ? 'preview' : 'live') : 'empty'
      )
      return this.payments
    },

    applyCertificates(rows = []) {
      this.certificates = decorateCertificates(rows, this.applications)
      this.setSource(
        'certificates',
        this.certificates.length ? (this.sources.applications === 'preview' ? 'preview' : 'live') : 'empty'
      )
      // Re-decorate applications so journey.canOpenCertificate reflects real certificate presence.
      this.applications = decorateApplications(this.applications, this._certificateApplicationIds())
      return this.certificates
    },

    syncDerivedCollections() {
      this.payments = decoratePayments(this.payments, this.applications)
      this.certificates = decorateCertificates(this.certificates, this.applications)
      // Re-decorate applications with updated certificate knowledge.
      this.applications = decorateApplications(this.applications, this._certificateApplicationIds())
      this.syncDashboardSnapshot()
    },

    syncDashboardSnapshot() {
      if (!this.dashboard) {
        return
      }

      this.dashboard = {
        ...this.dashboard,
        processTemplate: this.processTemplate,
        openApplications: this.applications.length,
        pendingPayments: this.payments.filter((payment) =>
          hasPendingPaymentStatus(payment.paymentStatus || payment.billStatus || payment.status)
        ).length,
        issuedCertificates: this.certificates.length,
        announcements: this.announcements,
        certificates: this.certificates,
        recentApplications: this.applications.slice(0, 6),
        applications: this.applications,
        payments: this.payments
      }
      this.setSource('dashboard', this.sources.applications)
    },

    async refreshPortfolioAfterApplicationChange({
      payments = true,
      certificates = true
    } = {}) {
      const shouldRefreshPayments = payments && Boolean(this.payments.length || this.dashboard)
      const shouldRefreshCertificates = certificates && Boolean(this.certificates.length || this.dashboard)

      if (shouldRefreshPayments) {
        const paymentRows = await fetchApplicantPayments({ applications: this.applications })
        this.applyPayments(paymentRows)
      } else {
        this.payments = decoratePayments(this.payments, this.applications)
      }

      if (shouldRefreshCertificates) {
        const certificateRows = await fetchApplicantCertificates({ applicantId: useAuthStore().applicantId, applications: this.applications })
        this.applyCertificates(certificateRows)
      } else {
        this.certificates = decorateCertificates(this.certificates, this.applications)
      }

      this.syncDashboardSnapshot()
    },

    upsertApplicationRecord(application) {
      if (!application || !application.applicationId) {
        return null
      }

      const next = decorateApplication(application, this._certificateApplicationIds())
      const index = this.applications.findIndex((row) => String(row.applicationId) === String(next.applicationId))
      if (index >= 0) {
        this.applications.splice(index, 1, next)
      } else {
        this.applications.unshift(next)
      }

      this.setSource('applications', resolveCollectionSource(this.applications))
      this.syncDerivedCollections()
      return next
    },

    async ensureProcessTemplate() {
      if (this.processTemplate) {
        return this.processTemplate
      }

      this.processTemplate = await fetchRegistrationTemplate()
      return this.processTemplate
    },

    async loadDashboard() {
      const authStore = useAuthStore()
      this.setLoading('dashboard', true)
      try {
        this.processTemplate = await this.ensureProcessTemplate()

        const dashboard = await fetchApplicantDashboard({
          email: authStore.email,
          applicantId: authStore.applicantId
        })

        this.dashboard = dashboard || {}
        this.announcements = dashboard?.announcements || []
        this.applyApplications(dashboard?.applications || [])
        this.applyPayments(dashboard?.payments || [])
        this.applyCertificates(dashboard?.certificates || [])
        this.syncDashboardSnapshot()
      } finally {
        this.setLoading('dashboard', false)
      }
    },

    async loadApplications() {
      const authStore = useAuthStore()
      this.setLoading('applications', true)
      try {
        this.processTemplate = await this.ensureProcessTemplate()
        const rows = await fetchApplicantApplications({
          email: authStore.email,
          applicantId: authStore.applicantId,
          processTemplate: this.processTemplate
        })
        this.applyApplications(rows)
        this.syncDerivedCollections()
      } finally {
        this.setLoading('applications', false)
      }
    },

    async loadPayments() {
      if (!this.applications.length) {
        await this.loadApplications()
      }

      this.setLoading('payments', true)
      try {
        const rows = await fetchApplicantPayments({ applications: this.applications })
        this.applyPayments(rows)
        this.syncDashboardSnapshot()
      } finally {
        this.setLoading('payments', false)
      }
    },

    async loadCertificates() {
      if (!this.applications.length) {
        await this.loadApplications()
      }

      this.setLoading('certificates', true)
      try {
        const rows = await fetchApplicantCertificates({ applicantId: useAuthStore().applicantId, applications: this.applications })
        this.applyCertificates(rows)
        this.syncDashboardSnapshot()
      } finally {
        this.setLoading('certificates', false)
      }
    },

    async getApplicationById(id, { serviceKey = '' } = {}) {
      const cached = this.applicationById(id)
      if (cached && (!serviceKey || cached.serviceKey === serviceKey)) {
        return cached
      }

      const authStore = useAuthStore()
      const template = await this.ensureProcessTemplate()
      const fetched = await fetchApplicantApplicationById(id, {
        email: authStore.email,
        applicantId: authStore.applicantId,
        processTemplate: template,
        serviceKey
      })

      if (!fetched) {
        return null
      }

      if (!serviceKey || fetched.serviceKey === serviceKey) {
        return this.upsertApplicationRecord(fetched)
      }

      return null
    },

    async submitApplication(formPayload, { serviceKey = DEFAULT_APPLICATION_SERVICE_KEY } = {}) {
      const authStore = useAuthStore()
      const template = await this.ensureProcessTemplate()

      const payload = buildSfccApplicationPayload(
        {
          ...formPayload,
          serviceKey
        },
        {
          userId: authStore.userId,
          fullName: authStore.fullName,
          email: authStore.email
        },
        template
      )

      const created = await createApplicantApplication(payload, { processTemplate: template })
      const next = this.upsertApplicationRecord(created)
      await this.refreshPortfolioAfterApplicationChange()
      return next
    },

    async updateApplication(applicationId, formPayload, { serviceKey = DEFAULT_APPLICATION_SERVICE_KEY } = {}) {
      const authStore = useAuthStore()
      const template = await this.ensureProcessTemplate()

      const payload = buildSfccApplicationPayload(
        {
          ...formPayload,
          serviceKey
        },
        {
          userId: authStore.userId,
          fullName: authStore.fullName,
          email: authStore.email
        },
        template
      )

      const updated = await updateApplicantApplication(applicationId, payload, { processTemplate: template })
      const next = this.upsertApplicationRecord(updated)
      await this.refreshPortfolioAfterApplicationChange()
      return next
    },

    async generateTrademarkControlNumber(applicationId) {
      const template = await this.ensureProcessTemplate()
      const updated = await generateTrademarkControlNumber(applicationId, { processTemplate: template })
      const next = this.upsertApplicationRecord(updated)
      await this.refreshPortfolioAfterApplicationChange({ payments: true, certificates: false })
      return next
    },

    async confirmTrademarkPayment(applicationId, payload = {}) {
      const template = await this.ensureProcessTemplate()
      const updated = await confirmTrademarkPayment(applicationId, payload, { processTemplate: template })
      const next = this.upsertApplicationRecord(updated)
      await this.refreshPortfolioAfterApplicationChange({ payments: true, certificates: true })
      return next
    },

    async verifyTrademarkPaymentByControlNumber(controlNumber, payload = {}) {
      return verifyTrademarkPaymentByControlNumberApi(controlNumber, payload)
    },

    async uploadTrademarkPaymentProof(applicationId, file, meta = {}) {
      const uploaded = await uploadTrademarkPaymentProofApi(applicationId, file, meta)
      return uploaded
    },

    async downloadCertificate(certificateId) {
      return downloadApplicantCertificate(certificateId)
    },

    async submitTrademarkApplication(applicationId, payload = {}) {
      const template = await this.ensureProcessTemplate()
      const updated = await submitTrademarkApplication(applicationId, payload, { processTemplate: template })
      const next = this.upsertApplicationRecord(updated)
      await this.refreshPortfolioAfterApplicationChange({ payments: true, certificates: true })
      return next
    },

    async performApplicationUseCase(applicationId, actionKey, payload = {}) {
      if (!AVAILABLE_APPLICATION_ACTIONS.includes(actionKey)) {
        throw new Error(`Unsupported application action: ${actionKey}`)
      }

      const template = await this.ensureProcessTemplate()
      const existing = this.applicationById(applicationId)
      const next = await executeApplicationUseCase(applicationId, actionKey, payload, {
        processTemplate: template,
        serviceKey: payload.serviceKey || existing?.serviceKey || ''
      })
      const updated = this.upsertApplicationRecord(next)
      await this.refreshPortfolioAfterApplicationChange({ payments: true, certificates: true })
      return updated
    },

    assignDirector(applicationId, payload = {}) {
      return this.performApplicationUseCase(applicationId, 'assignDirector', payload)
    },

    assignManager(applicationId, payload = {}) {
      return this.performApplicationUseCase(applicationId, 'assignManager', payload)
    },

    assignOfficer(applicationId, payload = {}) {
      return this.performApplicationUseCase(applicationId, 'assignOfficer', payload)
    },

    reassignDirector(applicationId, payload = {}) {
      return this.performApplicationUseCase(applicationId, 'reassignDirector', payload)
    },

    reassignManager(applicationId, payload = {}) {
      return this.performApplicationUseCase(applicationId, 'reassignManager', payload)
    },

    reassignOfficer(applicationId, payload = {}) {
      return this.performApplicationUseCase(applicationId, 'reassignOfficer', payload)
    },

    addReview(applicationId, payload = {}) {
      return this.performApplicationUseCase(applicationId, 'addReview', payload)
    },

    editReview(applicationId, payload = {}) {
      return this.performApplicationUseCase(applicationId, 'editReview', payload)
    },

    submitReview(applicationId, payload = {}) {
      return this.performApplicationUseCase(applicationId, 'submitReview', payload)
    },

    approveReview(applicationId, payload = {}) {
      return this.performApplicationUseCase(applicationId, 'approveReview', payload)
    },

    rejectReview(applicationId, payload = {}) {
      return this.performApplicationUseCase(applicationId, 'rejectReview', payload)
    },

    addReport(applicationId, payload = {}) {
      return this.performApplicationUseCase(applicationId, 'addReport', payload)
    },

    editReport(applicationId, payload = {}) {
      return this.performApplicationUseCase(applicationId, 'editReport', payload)
    },

    submitReport(applicationId, payload = {}) {
      return this.performApplicationUseCase(applicationId, 'submitReport', payload)
    },

    approveReport(applicationId, payload = {}) {
      return this.performApplicationUseCase(applicationId, 'approveReport', payload)
    },

    rejectReport(applicationId, payload = {}) {
      return this.performApplicationUseCase(applicationId, 'rejectReport', payload)
    },

    addAttachment(applicationId, payload = {}) {
      return this.performApplicationUseCase(applicationId, 'addAttachment', payload)
    },

    editAttachment(applicationId, payload = {}) {
      return this.performApplicationUseCase(applicationId, 'editAttachment', payload)
    },

    removeAttachment(applicationId, payload = {}) {
      return this.performApplicationUseCase(applicationId, 'removeAttachment', payload)
    },

    updateStatus(applicationId, payload = {}) {
      return this.performApplicationUseCase(applicationId, 'updateStatus', payload)
    },

    linkActivity(applicationId, payload = {}) {
      return this.performApplicationUseCase(applicationId, 'linkActivity', payload)
    },

    linkTask(applicationId, payload = {}) {
      return this.performApplicationUseCase(applicationId, 'linkTask', payload)
    },

    closeApplication(applicationId, payload = {}) {
      return this.performApplicationUseCase(applicationId, 'closeApplication', payload)
    }
  }
})
