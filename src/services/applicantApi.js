import http from '@/services/http'
import { APPLICATION_SERVICES } from '@/constants/applicationCatalog'
import {
  getApplicationProcessName,
  getApplicationProcessStages
} from '@/constants/applicationProcesses'
import {
  calculateServiceFees,
  getCertificatePolicy
} from '@/constants/applicationServiceRules'
import {
  buildSfccApplicationPayload,
  DEFAULT_REGISTRATION_STAGES,
  filterApplicationsByApplicant,
  normalizeApplication,
  normalizePayment,
  normalizeProcessTemplate
} from '@/services/applicantMappers'

const useMocks = import.meta.env.VITE_APPLICANT_USE_MOCKS === 'true'

const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms))

const mockProcessTemplate = normalizeProcessTemplate({
  code: 'FCC_CBP_CP_TB_01',
  name: 'Registration (Review) of Standard Form Consumer Contract',
  reviewSLADays: 14,
  approvalSLADays: 21,
  stages: DEFAULT_REGISTRATION_STAGES
})

function createMockApplication({
  applicationId,
  serviceKey,
  currentStage,
  dateSubmitted,
  sector,
  fileNumber,
  serviceDetails = {},
  trademarkRecordation = null,
  trademarkVersions = [],
  contracts = [],
  mergerClearance = null
}) {
  const processName = getApplicationProcessName(serviceKey)
  const stages = getApplicationProcessStages(serviceKey)
  const fees = calculateServiceFees(serviceKey, {
    trademarkRecordation,
    trademarkRequestType: trademarkRecordation?.requestType,
    trademarkVersions,
    contracts,
    mergerClearance,
    transactionValue: mergerClearance?.transactionValue
  })
  const normalizedDate = dateSubmitted || '2026-02-01'
  const paymentStatus = trademarkRecordation?.payment?.status || (currentStage === 'awaiting_payment' ? 'Pending' : 'Partially Paid')
  const amountPaid = Number(trademarkRecordation?.payment?.amountPaid || (currentStage === 'awaiting_payment' ? 0 : Math.round(fees.total * 0.35)))
  const controlNumber = trademarkRecordation?.payment?.controlNumber || `CN-${applicationId.slice(-4)}`
  const referenceNumber = trademarkRecordation?.payment?.referenceNumber || null
  const stageHistory = [
    { stage: 'application_submitted', at: `${normalizedDate}T09:20:00.000Z`, by: 'Applicant' },
    { stage: 'assigned_for_screening', at: `${normalizedDate}T10:30:00.000Z`, by: 'FCC Officer' },
    { stage: currentStage, at: `${normalizedDate}T12:40:00.000Z`, by: 'FCC Reviewer' }
  ]

  return {
    applicationId,
    service: serviceKey,
    serviceType: serviceKey,
    serviceKey,
    purpose: processName,
    processName,
    applicationFee: fees.total,
    fees,
    payment: {
      status: paymentStatus,
      amountDue: fees.total,
      amountPaid,
      balance: Math.max(0, fees.total - amountPaid),
      controlNumber,
      referenceNumber
    },
    sector,
    status: 'active',
    fileNumber,
    dateReceived: normalizedDate,
    dateSubmitted: normalizedDate,
    financialYear: '2025/2026',
    quarter: 1,
    applicant: {
      type: 'firm',
      companyName: 'Example Business Ltd',
      registrationNumber: 'REG-1002',
      countryOfIncorporation: 'Tanzania',
      businessDescription: 'Consumer services provider',
      email: 'applicant@example.com',
      phoneNumber: '+255700000000',
      postalAddress: 'P.O. Box 100, Dar es Salaam',
      physicalAddress: 'Dar es Salaam',
      contactPerson: {
        name: 'FCC Applicant User',
        email: 'applicant@example.com',
        phoneNumber: '+255700000000'
      }
    },
    responsibleOfficer: { employeeId: 'EMP-2201', fullName: 'Asha Mfinanga', designation: 'Officer' },
    responsibleManager: { employeeId: 'EMP-1130', fullName: 'Miriam Nyanza', designation: 'Manager' },
    responsibleDirector: { employeeId: 'EMP-0074', fullName: 'James Mushi', designation: 'Director' },
    activity: { activityId: 'ACT-2026-017', title: 'Review external service applications' },
    task: { taskId: 'TASK-28441', title: `Track ${applicationId}` },
    directorate: { directorateId: 'DIR-003', name: 'Consumer Protection Directorate' },
    section: { sectionId: 'SEC-021', name: 'Applications and Licensing' },
    office: { officeId: 'OFF-DSM', name: 'Dar es Salaam Office' },
    reviews: [],
    reports: [],
    submissions: [],
    reviewStages: [
      {
        stageId: 'RSTG-001',
        stageKey: 'screening',
        title: 'Screening',
        status: 'in_progress',
        reviews: [],
        submissions: []
      }
    ],
    attachments: [],
    auditTrail: [
      { action: 'application_created', happenedAt: `${normalizedDate}T09:20:00.000Z`, notes: 'Application created by applicant.' }
    ],
    trademarkVersions,
    trademarkRecordation,
    contracts,
    mergerClearance,
    serviceDetails: {
      ...serviceDetails,
      requestType: trademarkRecordation?.requestType || serviceDetails.requestType,
      trademarkRecordation,
      trademarkVersions,
      contracts,
      mergerClearance
    },
    metadata: {
      certificatePolicy: getCertificatePolicy(serviceKey)
    },
    processAutomation: {
      processName,
      currentStage,
      stages,
      stageHistory
    }
  }
}

const mockApplications = [
  createMockApplication({
    applicationId: 'APP-2026-1001',
    serviceKey: 'trademark-recordation',
    currentStage: 'screening_in_progress',
    dateSubmitted: '2026-02-12',
    sector: 'intellectual_property',
    fileNumber: 'FCC-TM-1001',
    trademarkRecordation: {
      requestType: 'new_recordation',
      requestTypeLabel: 'New Recordation',
      formCode: 'FCC 1',
      trademarkName: 'SautiMax',
      classOfGoods: 'Class 9, Class 35',
      representationType: 'Combined Mark',
      countryOfOrigin: 'Tanzania',
      registrationReference: 'BRELA-TM-2025-119',
      ownerCategory: 'Corporate Owner',
      ownerFullName: 'Example Business Ltd',
      ownerBusinessAddress: 'P.O. Box 100, Dar es Salaam',
      payment: {
        status: 'verified',
        controlNumber: '991000122',
        referenceNumber: 'GEPG-TRM-991000122',
        amountPaid: 200000,
        paidAt: '2026-02-13'
      },
      attachments: [
        { attachmentId: 'TM-ATT-1', documentType: 'fcc_1_form', fileName: 'fcc1-form.pdf' },
        { attachmentId: 'TM-ATT-2', documentType: 'registration_certificate', fileName: 'registration-certificate.pdf' }
      ]
    },
    trademarkVersions: [
      { versionId: 'TMV-1001-A', versionTag: 'v1', markName: 'SautiMax', classCount: 2, purpose: 'Initial Filing' },
      { versionId: 'TMV-1001-B', versionTag: 'v2', markName: 'SautiMax Pro', classCount: 3, purpose: 'Amendment' }
    ]
  }),
  createMockApplication({
    applicationId: 'APP-2026-1002',
    serviceKey: 'merger-clearance',
    currentStage: 'under_vetting',
    dateSubmitted: '2026-02-11',
    sector: 'competition',
    fileNumber: 'FCC-MRG-1002',
    mergerClearance: {
      transactionType: 'Merger',
      transactionValue: 5600000000,
      estimatedTurnover: 2400000000,
      partiesInvolved: 'Alpha Telecom PLC and Beta Data Networks Limited'
    }
  }),
  createMockApplication({
    applicationId: 'APP-2026-1003',
    serviceKey: 'sfcc-registration',
    currentStage: 'awaiting_payment',
    dateSubmitted: '2026-02-10',
    sector: 'consumer_protection',
    fileNumber: 'FCC-SFCC-1003',
    contracts: [
      { contractId: 'SFCC-C-1003-1', contractName: 'Retail Service Contract', contractCategory: 'Retail', pages: 14 },
      { contractId: 'SFCC-C-1003-2', contractName: 'Online Subscription Terms', contractCategory: 'Digital', pages: 9 }
    ]
  }),
  createMockApplication({
    applicationId: 'APP-2026-1004',
    serviceKey: 'legal-opinion',
    currentStage: 'assigned_for_screening',
    dateSubmitted: '2026-02-09',
    sector: 'legal_services',
    fileNumber: 'FCC-LEGAL-1004',
    serviceDetails: {
      legalIssueCategory: 'Competition',
      questionSummary: 'Assessment of exclusivity clauses in distribution contracts.',
      supportingFacts: 'Applicant seeks compliance guidance before rollout.'
    }
  }),
  createMockApplication({
    applicationId: 'APP-2026-1005',
    serviceKey: 'exemption',
    currentStage: 'application_submitted',
    dateSubmitted: '2026-02-08',
    sector: 'exemptions',
    fileNumber: 'FCC-EXM-1005',
    serviceDetails: {
      exemptionType: 'Temporary Exemption',
      legalBasis: 'Section 32(2) public interest exemption',
      validityPeriodMonths: 6
    }
  })
]

const mockPayments = [
  {
    paymentId: 'PAY-0081',
    source: { module: 'trademarks', applicationId: 'APP-2026-1001' },
    totalAmount: 200000,
    status: 'awaiting_confirmation',
    controlNumber: '991000122',
    createdAt: '2026-02-13T08:00:00.000Z',
    metadata: {
      dueDate: '2026-03-05'
    }
  },
  {
    paymentId: 'PAY-0068',
    source: { module: 'sfcc', applicationId: 'APP-2026-1003' },
    totalAmount: 120000,
    status: 'confirmed',
    controlNumber: '991000123',
    referenceNumber: 'BANK-REF-33912',
    paidAt: '2026-01-30T09:00:00.000Z'
  }
]

function resolvePaymentModule(serviceKey = '') {
  const normalized = String(serviceKey || '').toLowerCase()
  if (normalized === 'trademark-recordation') {
    return 'trademark'
  }
  if (normalized === 'merger-clearance') {
    return 'merger'
  }
  if (normalized === 'sfcc-registration') {
    return 'sfcc'
  }
  if (normalized === 'legal-opinion') {
    return 'legal'
  }
  if (normalized === 'exemption') {
    return 'exemption'
  }
  return 'applications'
}

function normalizeLoginResponse(data = {}) {
  return {
    token: data.accessToken || data.token || null,
    user: data.user || null,
    profile: data.profile || null
  }
}

function extractArray(value, preferredKey) {
  if (Array.isArray(value)) {
    return value
  }

  if (value && preferredKey && Array.isArray(value[preferredKey])) {
    return value[preferredKey]
  }

  if (value && Array.isArray(value.data)) {
    return value.data
  }

  return []
}

function extractCertificateRows(value) {
  if (Array.isArray(value?.certificates?.data)) {
    return value.certificates.data
  }

  if (Array.isArray(value?.certificates)) {
    return value.certificates
  }

  if (Array.isArray(value?.data)) {
    return value.data
  }

  return extractArray(value, 'certificates')
}

function hasPendingPaymentStatus(status) {
  const normalized = String(status || '').toLowerCase()
  return normalized.includes('pending') || normalized.includes('awaiting')
}

function isCertificateIssued(application = {}) {
  const stage = String(application.workflowStageKey || '').toLowerCase()
  const status = String(application.status || '').toLowerCase()
  return stage.includes('issued') || status.includes('issued') || status.includes('approved')
}

function normalizeAnnouncement(item = {}) {
  return {
    id: item.id || item.announcementId || item._id || `ann-${Math.random().toString(36).slice(2, 9)}`,
    title: item.title || item.subject || 'FCC Announcement',
    message: item.message || item.content || item.summary || '',
    publishedAt: item.publishedAt || item.createdAt || new Date().toISOString()
  }
}

async function requestFirstSuccess(candidates = [], options = {}) {
  const retryStatuses = options.retryStatuses || [404, 405]
  let lastError = null

  for (const candidate of candidates) {
    try {
      const method = String(candidate.method || 'get').toLowerCase()
      const data = candidate.body

      if (method === 'delete') {
        const response = await http[method](candidate.url, {
          ...(candidate.config || {}),
          data
        })
        return response.data
      }

      if (data === undefined) {
        const response = await http[method](candidate.url, candidate.config || {})
        return response.data
      }

      const response = await http[method](candidate.url, data, candidate.config || {})
      return response.data
    } catch (error) {
      const status = Number(error?.response?.status || 0)
      if (retryStatuses.includes(status)) {
        lastError = error
        continue
      }
      throw error
    }
  }

  throw lastError || new Error('No supported endpoint found for this operation.')
}

function normalizeServiceKey(value = '') {
  return String(value || '').trim().toLowerCase()
}

function inferStageKeyFromText(value = '') {
  const normalized = String(value || '').toLowerCase()
  if (normalized.includes('awaiting payment')) return 'awaiting_payment'
  if (normalized.includes('payment verified')) return 'payment_verified'
  if (normalized.includes('vetting') || normalized.includes('review')) return 'under_vetting'
  if (normalized.includes('screening')) return 'screening_in_progress'
  if (normalized.includes('assigned')) return 'assigned_for_screening'
  if (normalized.includes('submitted')) return 'application_submitted'
  if (normalized.includes('issued') || normalized.includes('approved')) return 'certificate_issued'
  return 'application_submitted'
}

function buildDetailCandidates(applicationId, serviceKey = '') {
  const id = encodeURIComponent(String(applicationId || ''))
  const normalizedServiceKey = normalizeServiceKey(serviceKey)

  if (normalizedServiceKey === 'trademark-recordation') {
    return [
      { method: 'get', url: `/trademarks/trademark-applications/${id}` },
      { method: 'get', url: `/applications/${id}` }
    ]
  }

  if (normalizedServiceKey === 'merger-clearance') {
    return [
      { method: 'get', url: `/applications/${id}` },
      { method: 'get', url: `/mergers/applications/${id}` }
    ]
  }

  if (normalizedServiceKey === 'sfcc-registration') {
    return [
      { method: 'get', url: `/applications/${id}` },
      { method: 'get', url: `/sfcc/applications/${id}` }
    ]
  }

  if (normalizedServiceKey === 'legal-opinion' || normalizedServiceKey === 'exemption') {
    return [{ method: 'get', url: `/applications/${id}` }]
  }

  return [
    { method: 'get', url: `/applications/${id}` },
    { method: 'get', url: `/sfcc/applications/${id}` },
    { method: 'get', url: `/trademarks/trademark-applications/${id}` },
    { method: 'get', url: `/mergers/applications/${id}` }
  ]
}

function normalizeGePGBillVerification(payload = {}) {
  const bill = payload?.bill || payload || {}
  const paymentEvents = Array.isArray(bill.paymentEvents) ? bill.paymentEvents : []
  const latestEvent = paymentEvents.length ? paymentEvents[paymentEvents.length - 1] : null
  const billStatus = String(bill.status || '').toLowerCase()
  const summedPaid = paymentEvents.reduce((sum, row) => sum + Number(row?.paidAmount || 0), 0)
  const expectedAmount = Number(bill?.bill?.amount || 0)
  const amountPaid = summedPaid > 0 ? summedPaid : (billStatus === 'paid' ? expectedAmount : 0)

  return {
    billId: bill.billId || null,
    controlNumber: bill.controlNumber || null,
    billStatus,
    expectedAmount,
    amountPaid,
    paidAt: latestEvent?.paidAt ? String(latestEvent.paidAt).slice(0, 10) : null,
    referenceNumber:
      latestEvent?.referenceNumber ||
      latestEvent?.transactionId ||
      latestEvent?.receiptNumber ||
      null,
    receiptNumber: latestEvent?.receiptNumber || null,
    responseCode: latestEvent?.responseCode || bill?.gePG?.responseCode || null,
    responseMessage: latestEvent?.responseMessage || bill?.gePG?.responseMessage || null,
    paymentEvents,
    raw: bill
  }
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function buildMergerRoutePayload(payload = {}, { forUpdate = false } = {}) {
  const applicant = payload.applicant || {}
  const normalizedApplicantType =
    String(applicant.type || '').toLowerCase() === 'individual' ? 'individual' : 'company'
  const normalizedApplicant = {
    ...applicant,
    type: normalizedApplicantType
  }
  const mergerClearance = payload.mergerClearance || payload.serviceDetails?.mergerClearance || {}
  const acquiringFirmName =
    applicant.companyName ||
    [applicant.firstName, applicant.surname].filter(Boolean).join(' ') ||
    applicant.contactPerson?.name ||
    'Unnamed Applicant'

  const targetFirmName = mergerClearance.targetFirmName || ''
  const transactionType = mergerClearance.transactionType || payload.transactionType || 'Merger'

  const notification = {
    acquiringFirm: {
      name: acquiringFirmName,
      address: applicant.postalAddress || '',
      placeOfIncorporation: applicant.countryOfIncorporation || applicant.countryOfResidence || '',
      registeredOffice: applicant.physicalAddress || '',
      businessDescription: applicant.businessDescription || ''
    },
    targetFirm: {
      name: targetFirmName,
      businessDescription: mergerClearance.targetFirmBusiness || ''
    },
    acquisitionNarrative: mergerClearance.acquisitionDescription || '',
    commercialRationale: mergerClearance.commercialRationale || '',
    relevantMarketDefinition: mergerClearance.relevantMarketDefinition || '',
    industrySectors: payload.sector ? [String(payload.sector)] : []
  }

  const confidentialityClaim = {
    formCode: 'FCC-2',
    hasClaim: Boolean(mergerClearance.confidentialityClaimRequired),
    applicantNameAndFileNumber: [acquiringFirmName, payload.fileNumber].filter(Boolean).join(' / '),
    statement: mergerClearance.confidentialityStatement || '',
    signatoryName: applicant.contactPerson?.name || acquiringFirmName,
    signatoryTitle: applicant.contactPerson?.designation || '',
    signatoryAddress: applicant.physicalAddress || applicant.postalAddress || '',
    signedAt: payload.dateReceived || payload.dateSubmitted || null,
    claimItems: []
  }

  const routePayload = {
    fileNumber: payload.fileNumber || null,
    title:
      payload.title ||
      `${transactionType}: ${acquiringFirmName}${targetFirmName ? ` and ${targetFirmName}` : ''}`,
    description:
      payload.description ||
      mergerClearance.acquisitionDescription ||
      payload.purpose ||
      'Merger clearance application submitted via applicant portal.',
    transactionType,
    marketSectors: payload.sector ? [String(payload.sector)] : [],
    turnover: toNumber(mergerClearance.estimatedTurnover, null),
    assetsValue: toNumber(mergerClearance.transactionValue, null),
    mergerNotification: notification,
    confidentialityClaim,
    metadata: {
      ...(payload.metadata || {}),
      sourceModule: 'applicant-portal',
      mergerClearance
    }
  }

  if (!forUpdate) {
    routePayload.applicant = normalizedApplicant
  }

  return routePayload
}

function findMockApplicationIndex(applicationId) {
  return mockApplications.findIndex((application) => String(application.applicationId) === String(applicationId))
}

function appendMockStageHistory(application, stage, by = 'FCC System') {
  const current = application.processAutomation || {}
  const stageHistory = Array.isArray(current.stageHistory) ? current.stageHistory : []
  stageHistory.push({
    stage,
    at: new Date().toISOString(),
    by
  })

  application.processAutomation = {
    ...current,
    currentStage: stage,
    stageHistory
  }
}

const APPLICATION_ACTIONS = Object.freeze({
  assignDirector: {
    method: 'put',
    path: '/applications/:id/assign-director',
    legacyPath: '/sfcc/applications/:id/assign-manager'
  },
  assignManager: {
    method: 'put',
    path: '/applications/:id/assign-manager',
    legacyPath: '/sfcc/applications/:id/assign-manager'
  },
  assignOfficer: {
    method: 'put',
    path: '/applications/:id/assign-officer',
    legacyPath: '/sfcc/applications/:id/assign-officer'
  },
  reassignDirector: { method: 'put', path: '/applications/:id/reassign-director' },
  reassignManager: { method: 'put', path: '/applications/:id/reassign-manager' },
  reassignOfficer: { method: 'put', path: '/applications/:id/reassign-officer' },
  addReview: { method: 'post', path: '/applications/:id/reviews' },
  editReview: { method: 'put', path: '/applications/:id/reviews/:reviewId' },
  submitReview: { method: 'put', path: '/applications/:id/reviews/:reviewId/submit' },
  approveReview: { method: 'put', path: '/applications/:id/reviews/:reviewId/approve' },
  rejectReview: { method: 'put', path: '/applications/:id/reviews/:reviewId/reject' },
  addReport: { method: 'post', path: '/applications/:id/reports' },
  editReport: { method: 'put', path: '/applications/:id/reports/:reportId' },
  submitReport: { method: 'put', path: '/applications/:id/reports/:reportId/submit' },
  approveReport: { method: 'put', path: '/applications/:id/reports/:reportId/approve' },
  rejectReport: { method: 'put', path: '/applications/:id/reports/:reportId/reject' },
  addAttachment: { method: 'post', path: '/applications/:id/attachments' },
  editAttachment: { method: 'put', path: '/applications/:id/attachments/:attachmentId' },
  removeAttachment: { method: 'delete', path: '/applications/:id/attachments/:attachmentId' },
  updateStatus: { method: 'put', path: '/applications/:id/update-status' },
  linkActivity: { method: 'put', path: '/applications/:id/link-activity' },
  linkTask: { method: 'put', path: '/applications/:id/link-task' },
  closeApplication: { method: 'put', path: '/applications/:id/update-status', legacyPath: '/sfcc/applications/:id/close-application' }
})

function resolveActionPath(templatePath = '', applicationId = '', payload = {}) {
  return String(templatePath || '')
    .replace(':id', encodeURIComponent(String(applicationId)))
    .replace(':reviewId', encodeURIComponent(String(payload.reviewId || '')))
    .replace(':reportId', encodeURIComponent(String(payload.reportId || '')))
    .replace(':attachmentId', encodeURIComponent(String(payload.attachmentId || '')))
}

export async function registerApplicantAccount(payload) {
  if (useMocks) {
    await wait()
    return {
      account: {
        userId: 'USR-MOCK-001',
        email: payload.email,
        fullName: payload.fullName,
        phoneNumber: payload.phoneNumber,
        accountType: 'applicant'
      }
    }
  }

  const { data } = await http.post('/user-management/accounts/create/applicant', payload)
  return data
}

export async function loginApplicant(payload) {
  if (useMocks) {
    await wait()
    return {
      token: 'mock-applicant-token',
      user: {
        userId: 'USR-MOCK-001',
        email: payload.email,
        fullName: 'FCC Applicant User',
        accountType: 'applicant'
      },
      profile: {
        email: payload.email,
        fullName: 'FCC Applicant User',
        accountType: 'applicant',
        roles: [{ name: 'applicant' }]
      }
    }
  }

  const { data } = await http.post('/user-management/auth/login', payload)
  return normalizeLoginResponse(data)
}

export async function requestPasswordReset(email) {
  const response = await http.post('/auth/forgot-password', { email })
  return response.data
}

export async function resetPassword({ token, newPassword }) {
  const response = await http.post('/auth/reset-password', { token, newPassword })
  return response.data
}

export async function logoutApplicant() {
  if (useMocks) {
    return { success: true }
  }

  const { data } = await http.post('/user-management/auth/logout')
  return data
}

export async function fetchRegistrationTemplate() {
  if (useMocks) {
    await wait(80)
    return mockProcessTemplate
  }

  const { data } = await http.get('/sfcc/process-automation/registration-template')
  return normalizeProcessTemplate(data?.process || {})
}

export async function fetchPublicServiceCatalogs(query = {}) {
  if (useMocks) {
    return {
      serviceCatalogs: APPLICATION_SERVICES.map((service) => ({
        serviceCatalogId: service.key,
        code: String(service.key || '')
          .replace(/[^a-z0-9]+/gi, '_')
          .toUpperCase(),
        name: service.label,
        title: service.label,
        service: service.key,
        applicationType: service.key,
        description: service.description,
        audience: 'external',
        channels: ['applicant_portal'],
        isChargeable: true
      })),
      page: 1,
      limit: APPLICATION_SERVICES.length,
      total: APPLICATION_SERVICES.length,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false
    }
  }

  const { data } = await http.get('/service-management/catalogs/public', {
    params: query
  })
  return data
}

export async function previewServiceFee({ serviceKey, feeContext = {} }) {
  try {
    const response = await http.post('/applications/fees/preview', {
      service: serviceKey,
      feeContext
    })
    return response.data
  } catch (error) {
    return { error: error?.message || 'Failed to preview fee' }
  }
}

export async function fetchApplicantApplications({ email = '', applicantId = '', processTemplate = null } = {}) {
  if (useMocks) {
    await wait(100)
    const normalized = mockApplications.map((item) =>
      normalizeApplication(item, processTemplate || mockProcessTemplate)
    )
    return filterApplicationsByApplicant(normalized, { email, applicantId })
  }

  const data = await requestFirstSuccess([
    { method: 'get', url: '/applications' },
    { method: 'get', url: '/sfcc/applications' },
    { method: 'get', url: '/trademarks/trademark-applications' },
    { method: 'get', url: '/mergers/applications' }
  ])

  const rawApplications = extractArray(data, 'applications')
  const normalized = rawApplications.map((item) => normalizeApplication(item, processTemplate))
  return filterApplicationsByApplicant(normalized, { email, applicantId })
}

export async function fetchApplicantApplicationById(
  id,
  { email = '', applicantId = '', processTemplate = null, serviceKey = '' } = {}
) {
  if (useMocks) {
    await wait(100)
    const found = mockApplications.find((application) => application.applicationId === id)
    if (!found) {
      return null
    }
    const normalized = normalizeApplication(found, processTemplate || mockProcessTemplate)
    if (!email && !applicantId) {
      return normalized
    }
    return filterApplicationsByApplicant([normalized], { email, applicantId })[0] || null
  }

  const data = await requestFirstSuccess(buildDetailCandidates(id, serviceKey))

  const normalized = normalizeApplication(data?.application || data || {}, processTemplate)

  if (!email && !applicantId) {
    return normalized
  }

  return filterApplicationsByApplicant([normalized], { email, applicantId })[0] || null
}

export async function createApplicantApplication(payload, { processTemplate = null } = {}) {
  if (useMocks) {
    await wait(140)
    const serviceKey = payload.serviceKey || payload.serviceType || 'sfcc-registration'
    const processName = getApplicationProcessName(serviceKey)
    const stages = getApplicationProcessStages(serviceKey)
    const raw = {
      ...payload,
      applicationId: `APP-2026-${Math.floor(1000 + Math.random() * 8999)}`,
      status: 'active',
      processAutomation: {
        processName,
        currentStage: 'application_submitted',
        stages: stages.length ? stages : (processTemplate || mockProcessTemplate).stages,
        stageHistory: [{ stage: 'application_submitted', at: new Date().toISOString() }]
      }
    }

    mockApplications.unshift(raw)

    return normalizeApplication(raw, processTemplate || mockProcessTemplate)
  }

  const serviceKey = payload.serviceKey || payload.serviceType || 'sfcc-registration'
  const mergerRoutePayload = serviceKey === 'merger-clearance'
    ? buildMergerRoutePayload(payload)
    : null
  const serviceCreateCandidates = []

  if (serviceKey === 'trademark-recordation') {
    serviceCreateCandidates.push({
      method: 'post',
      url: '/trademarks/trademark-applications/create-application',
      body: payload
    })
  }

  serviceCreateCandidates.push(
    { method: 'post', url: '/applications/create-application', body: payload },
    { method: 'post', url: '/sfcc/applications/create-application', body: payload }
  )

  if (serviceKey === 'merger-clearance') {
    serviceCreateCandidates.push({
      method: 'post',
      url: '/mergers/applications',
      body: mergerRoutePayload
    })
  }

  const data = await requestFirstSuccess(serviceCreateCandidates)
  return normalizeApplication(data?.application || data || {}, processTemplate)
}

export async function updateApplicantApplication(applicationId, payload, { processTemplate = null } = {}) {
  if (!applicationId) {
    throw new Error('Application ID is required for update.')
  }

  if (useMocks) {
    await wait(140)
    const index = mockApplications.findIndex((item) => item.applicationId === applicationId)
    if (index < 0) {
      throw new Error('Application not found.')
    }

    const existing = mockApplications[index]
    const merged = {
      ...existing,
      ...payload,
      applicant: {
        ...(existing.applicant || {}),
        ...(payload.applicant || {})
      },
      processAutomation: {
        ...(existing.processAutomation || {}),
        processName: getApplicationProcessName(payload.serviceKey || payload.serviceType || existing.serviceKey || existing.serviceType),
        stages: getApplicationProcessStages(payload.serviceKey || payload.serviceType || existing.serviceKey || existing.serviceType),
        stageHistory: existing.processAutomation?.stageHistory || []
      }
    }

    mockApplications[index] = merged
    return normalizeApplication(merged, processTemplate || mockProcessTemplate)
  }

  const serviceKey = payload.serviceKey || payload.serviceType || 'sfcc-registration'
  const mergerRoutePayload = serviceKey === 'merger-clearance'
    ? buildMergerRoutePayload(payload, { forUpdate: true })
    : null
  const candidates = []

  if (serviceKey === 'trademark-recordation') {
    candidates.push({
      method: 'put',
      url: `/trademarks/trademark-applications/${applicationId}/update-application`,
      body: payload
    })
  }

  candidates.push(
    { method: 'put', url: `/sfcc/applications/${applicationId}/update-application`, body: payload },
    { method: 'put', url: `/sfcc/applications/${applicationId}`, body: payload },
    { method: 'patch', url: `/sfcc/applications/${applicationId}`, body: payload },
    { method: 'patch', url: `/mergers/applications/${applicationId}`, body: mergerRoutePayload || payload },
    { method: 'put', url: `/trademarks/trademark-applications/${applicationId}/update-application`, body: payload }
  )

  if (serviceKey === 'merger-clearance') {
    candidates.unshift({
      method: 'patch',
      url: `/mergers/applications/${applicationId}`,
      body: mergerRoutePayload
    })
  }

  const data = await requestFirstSuccess(candidates)
  return normalizeApplication(data?.application || data || {}, processTemplate)
}

export async function generateTrademarkControlNumber(applicationId, { processTemplate = null } = {}) {
  if (!applicationId) {
    throw new Error('Application ID is required.')
  }

  if (useMocks) {
    await wait(120)
    const index = findMockApplicationIndex(applicationId)
    if (index < 0) {
      throw new Error('Application not found.')
    }

    const application = mockApplications[index]
    const expected = Number(application.fees?.total || application.applicationFee || 0)
    const controlNumber = application.trademarkRecordation?.payment?.controlNumber || `99${Date.now().toString().slice(-10)}`
    application.trademarkRecordation = {
      ...(application.trademarkRecordation || {}),
      payment: {
        ...(application.trademarkRecordation?.payment || {}),
        status: 'control_number_issued',
        controlNumber,
        amountDue: expected,
        amountPaid: Number(application.trademarkRecordation?.payment?.amountPaid || 0)
      }
    }
    application.payment = {
      ...(application.payment || {}),
      status: 'control_number_issued',
      amountDue: expected,
      controlNumber,
      balance: Math.max(0, expected - Number(application.trademarkRecordation?.payment?.amountPaid || 0))
    }
    appendMockStageHistory(application, 'awaiting_payment', 'FCC Finance')
    mockApplications[index] = application
    return normalizeApplication(application, processTemplate || mockProcessTemplate)
  }

  const data = await requestFirstSuccess([
    {
      method: 'put',
      url: `/trademarks/trademark-applications/${encodeURIComponent(String(applicationId))}/generate-control-number`,
      body: {}
    },
    {
      method: 'put',
      url: `/trademarks/trademark-applications/${encodeURIComponent(String(applicationId))}/prepare-payment`,
      body: {}
    }
  ])

  return normalizeApplication(data?.application || data || {}, processTemplate)
}

export async function verifyTrademarkPaymentByControlNumber(controlNumber, { applicationId = '' } = {}) {
  const normalizedControlNumber = String(controlNumber || '').trim()
  if (!normalizedControlNumber) {
    throw new Error('Control number is required.')
  }

  if (useMocks) {
    await wait(120)
    const fromId = applicationId ? mockApplications.find((row) => row.applicationId === applicationId) : null
    const fromControl = mockApplications.find(
      (row) =>
        String(row?.trademarkRecordation?.payment?.controlNumber || '').trim() === normalizedControlNumber
    )
    const application = fromId || fromControl
    if (!application) {
      throw new Error('GePG bill not found for this control number.')
    }

    const status = String(application?.trademarkRecordation?.payment?.status || '').toLowerCase()
    const expectedAmount = Number(application?.fees?.total || application?.applicationFee || 0)
    const paidAmount = Number(application?.trademarkRecordation?.payment?.amountPaid || 0)
    const mockedBill = {
      billId: `MOCK-${application.applicationId}`,
      controlNumber: normalizedControlNumber,
      status: ['paid', 'verified'].includes(status) ? 'paid' : 'pending_payment',
      bill: {
        amount: expectedAmount
      },
      paymentEvents: ['paid', 'verified'].includes(status)
        ? [
            {
              paidAmount: Math.max(expectedAmount, paidAmount),
              paidAt: application?.trademarkRecordation?.payment?.paidAt || new Date().toISOString(),
              referenceNumber: application?.trademarkRecordation?.payment?.referenceNumber || null,
              receiptNumber: application?.trademarkRecordation?.payment?.receiptNumber || null,
              responseCode: '7101',
              responseMessage: 'Payment successful'
            }
          ]
        : []
    }

    return normalizeGePGBillVerification(mockedBill)
  }

  const encoded = encodeURIComponent(normalizedControlNumber)
  const data = await requestFirstSuccess([
    { method: 'get', url: `/finance-accounts/gepg/bills/control/${encoded}` },
    { method: 'get', url: `/finance/gepg/bills/control/${encoded}` }
  ], {
    retryStatuses: [404, 405]
  })

  return normalizeGePGBillVerification(data)
}

export async function uploadTrademarkPaymentProof(applicationId, file, meta = {}) {
  if (!applicationId) {
    throw new Error('Application ID is required.')
  }
  if (!file) {
    throw new Error('Payment proof file is required.')
  }

  if (useMocks) {
    await wait(120)
    return {
      documentId: `TM-PROOF-${Date.now()}`,
      fileName: file.name || 'payment-proof',
      title: meta?.title || 'Payment proof',
      description: meta?.description || '',
      uploadedAt: new Date().toISOString()
    }
  }

  const formData = new FormData()
  formData.append('attachments[]', file)
  formData.append('title', meta?.title || 'Payment proof')
  formData.append('description', meta?.description || 'Applicant uploaded payment proof.')
  formData.append('target', 'payment')
  formData.append('category', 'payment_proof')

  const data = await requestFirstSuccess([
    {
      method: 'post',
      url: `/trademarks/trademark-applications/${encodeURIComponent(String(applicationId))}/attachments`,
      body: formData,
      config: {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    }
  ], {
    retryStatuses: [404, 405]
  })

  const attachmentRows = Array.isArray(data?.attachments)
    ? data.attachments
    : Array.isArray(data?.attachments?.attachments)
      ? data.attachments.attachments
      : Array.isArray(data?.application?.attachments)
        ? data.application.attachments
        : []

  if (attachmentRows.length) {
    return attachmentRows[attachmentRows.length - 1]
  }

  return {
    fileName: file.name || meta?.title || 'payment-proof'
  }
}

export async function confirmTrademarkPayment(
  applicationId,
  payload = {},
  { processTemplate = null } = {}
) {
  if (!applicationId) {
    throw new Error('Application ID is required.')
  }

  if (useMocks) {
    await wait(120)
    const index = findMockApplicationIndex(applicationId)
    if (index < 0) {
      throw new Error('Application not found.')
    }

    const application = mockApplications[index]
    const expected = Number(application.fees?.total || application.applicationFee || 0)
    const source = String(payload.source || '').toLowerCase()

    if (!['gepg-bill-verification', 'gepg-callback', 'officer'].includes(source)) {
      throw new Error('Payment confirmation source is not allowed.')
    }

    if (source === 'gepg-bill-verification') {
      const existingStatus = String(application.trademarkRecordation?.payment?.status || '').toLowerCase()
      if (!['paid', 'verified'].includes(existingStatus)) {
        throw new Error('GePG still shows this bill as unpaid or pending.')
      }
    }

    application.trademarkRecordation = {
      ...(application.trademarkRecordation || {}),
      payment: {
        ...(application.trademarkRecordation?.payment || {}),
        status: 'verified',
        amountPaid: Math.max(expected, Number(application.trademarkRecordation?.payment?.amountPaid || expected)),
        referenceNumber: application.trademarkRecordation?.payment?.referenceNumber || `GEPG-${application.applicationId}`,
        receiptNumber: application.trademarkRecordation?.payment?.receiptNumber || `RCT-${application.applicationId}`,
        paidAt: application.trademarkRecordation?.payment?.paidAt || new Date().toISOString().slice(0, 10),
        proofFileName: application.trademarkRecordation?.payment?.proofFileName || ''
      }
    }
    application.payment = {
      ...(application.payment || {}),
      status: 'verified',
      amountDue: expected,
      amountPaid: Math.max(expected, Number(application.trademarkRecordation?.payment?.amountPaid || expected)),
      balance: 0,
      referenceNumber: application.trademarkRecordation?.payment?.referenceNumber || application.payment?.referenceNumber || ''
    }
    appendMockStageHistory(application, 'payment_verified', 'FCC Finance')
    mockApplications[index] = application
    return normalizeApplication(application, processTemplate || mockProcessTemplate)
  }

  const data = await requestFirstSuccess([
    {
      method: 'put',
      url: `/trademarks/trademark-applications/${encodeURIComponent(String(applicationId))}/confirm-payment`,
      body: payload
    }
  ], {
    retryStatuses: [404, 405]
  })

  return normalizeApplication(data?.application || data || {}, processTemplate)
}

export async function submitTrademarkApplication(
  applicationId,
  payload = {},
  { processTemplate = null } = {}
) {
  if (!applicationId) {
    throw new Error('Application ID is required.')
  }

  if (useMocks) {
    await wait(120)
    const index = findMockApplicationIndex(applicationId)
    if (index < 0) {
      throw new Error('Application not found.')
    }

    const application = mockApplications[index]
    appendMockStageHistory(application, 'application_submitted', 'Applicant')
    application.status = 'submitted'
    mockApplications[index] = application
    return normalizeApplication(application, processTemplate || mockProcessTemplate)
  }

  const data = await requestFirstSuccess([
    {
      method: 'put',
      url: `/trademarks/trademark-applications/${encodeURIComponent(String(applicationId))}/submit`,
      body: payload
    }
  ])

  return normalizeApplication(data?.application || data || {}, processTemplate)
}

export const AVAILABLE_APPLICATION_ACTIONS = Object.freeze(Object.keys(APPLICATION_ACTIONS))

function makeDefaultActionBody(actionKey, payload = {}) {
  if (actionKey === 'closeApplication') {
    return {
      status: 'closed',
      stage: 'closed',
      notes: payload.notes || 'Application closed by applicant portal.'
    }
  }

  if (actionKey === 'updateStatus') {
    return {
      status: payload.status || 'under_review',
      stage: payload.stage || undefined,
      notes: payload.notes || undefined
    }
  }

  return payload
}

function applyMockApplicationAction(application, actionKey, payload = {}) {
  const now = new Date().toISOString()

  if (actionKey === 'assignDirector' || actionKey === 'reassignDirector') {
    application.responsibleDirector = {
      fullName: payload.directorName || payload.director || payload.assignee || 'Assigned Director',
      employeeId: payload.directorId || payload.assigneeId || null
    }
    application.auditTrail = [...(application.auditTrail || []), { action: actionKey, happenedAt: now, notes: payload.notes || '' }]
    return
  }

  if (actionKey === 'assignManager' || actionKey === 'reassignManager') {
    application.responsibleManager = {
      fullName: payload.managerName || payload.manager || payload.assignee || 'Assigned Manager',
      employeeId: payload.managerId || payload.assigneeId || null
    }
    application.auditTrail = [...(application.auditTrail || []), { action: actionKey, happenedAt: now, notes: payload.notes || '' }]
    return
  }

  if (actionKey === 'assignOfficer' || actionKey === 'reassignOfficer') {
    application.responsibleOfficer = {
      fullName: payload.officerName || payload.officer || payload.assignee || 'Assigned Officer',
      employeeId: payload.officerId || payload.assigneeId || null
    }
    application.auditTrail = [...(application.auditTrail || []), { action: actionKey, happenedAt: now, notes: payload.notes || '' }]
    return
  }

  if (actionKey === 'addReview') {
    const row = {
      reviewId: payload.review?.reviewId || `REV-${Math.floor(Math.random() * 100000)}`,
      status: 'draft',
      ...payload.review
    }
    application.reviews = [...(application.reviews || []), row]
    application.auditTrail = [...(application.auditTrail || []), { action: 'addReview', happenedAt: now, notes: 'Review added.' }]
    return
  }

  if (actionKey === 'editReview') {
    application.reviews = (application.reviews || []).map((review) =>
      String(review.reviewId) === String(payload.reviewId) ? { ...review, ...(payload.changes || payload) } : review
    )
    return
  }

  if (['submitReview', 'approveReview', 'rejectReview'].includes(actionKey)) {
    const statusMap = {
      submitReview: 'submitted',
      approveReview: 'approved',
      rejectReview: 'rejected'
    }
    application.reviews = (application.reviews || []).map((review) =>
      String(review.reviewId) === String(payload.reviewId) ? { ...review, status: statusMap[actionKey] } : review
    )
    return
  }

  if (actionKey === 'addReport') {
    const row = {
      reportId: payload.report?.reportId || `RPT-${Math.floor(Math.random() * 100000)}`,
      status: 'draft',
      ...payload.report
    }
    application.reports = [...(application.reports || []), row]
    return
  }

  if (actionKey === 'editReport') {
    application.reports = (application.reports || []).map((report) =>
      String(report.reportId) === String(payload.reportId) ? { ...report, ...(payload.changes || payload) } : report
    )
    return
  }

  if (['submitReport', 'approveReport', 'rejectReport'].includes(actionKey)) {
    const statusMap = {
      submitReport: 'submitted',
      approveReport: 'approved',
      rejectReport: 'rejected'
    }
    application.reports = (application.reports || []).map((report) =>
      String(report.reportId) === String(payload.reportId) ? { ...report, status: statusMap[actionKey] } : report
    )
    return
  }

  if (actionKey === 'addAttachment') {
    const attachment = payload.attachment || payload
    const row = {
      attachmentId: attachment.attachmentId || `ATT-${Math.floor(Math.random() * 100000)}`,
      fileName: attachment.fileName || attachment.name || 'attachment',
      uploadedAt: now
    }
    application.attachments = [...(application.attachments || []), row]
    return
  }

  if (actionKey === 'editAttachment') {
    application.attachments = (application.attachments || []).map((attachment) =>
      String(attachment.attachmentId) === String(payload.attachmentId) ? { ...attachment, ...(payload.changes || payload) } : attachment
    )
    return
  }

  if (actionKey === 'removeAttachment') {
    application.attachments = (application.attachments || []).filter(
      (attachment) => String(attachment.attachmentId) !== String(payload.attachmentId)
    )
    return
  }

  if (actionKey === 'linkActivity') {
    application.activity = payload.activity || null
    return
  }

  if (actionKey === 'linkTask') {
    application.task = payload.task || null
    return
  }

  if (actionKey === 'closeApplication' || actionKey === 'updateStatus') {
    const stage = payload.stage || (actionKey === 'closeApplication' ? 'closed' : null)
    application.status = payload.status || (actionKey === 'closeApplication' ? 'closed' : application.status)
    if (stage) {
      appendMockStageHistory(application, stage, 'Applicant Portal')
    }
  }
}

export async function executeApplicationUseCase(
  applicationId,
  actionKey,
  payload = {},
  { processTemplate = null, serviceKey = '' } = {}
) {
  if (!applicationId) {
    throw new Error('Application ID is required.')
  }

  const action = APPLICATION_ACTIONS[actionKey]
  if (!action) {
    throw new Error(`Unsupported application action: ${actionKey}`)
  }

  if (useMocks) {
    await wait(120)
    const index = findMockApplicationIndex(applicationId)
    if (index < 0) {
      throw new Error('Application not found.')
    }

    const application = mockApplications[index]
    applyMockApplicationAction(application, actionKey, makeDefaultActionBody(actionKey, payload))
    mockApplications[index] = application

    return normalizeApplication(application, processTemplate || mockProcessTemplate)
  }

  const service = String(serviceKey || payload.serviceKey || payload.serviceType || '').toLowerCase()
  const body = makeDefaultActionBody(actionKey, payload)
  const path = resolveActionPath(action.path, applicationId, payload)
  const candidates = [{ method: action.method, url: path, body }]

  if (action.legacyPath) {
    candidates.push({
      method: action.method,
      url: resolveActionPath(action.legacyPath, applicationId, payload),
      body
    })
  }

  if (service === 'trademark-recordation') {
    if (actionKey === 'closeApplication') {
      candidates.push({
        method: 'put',
        url: `/trademarks/trademark-applications/${encodeURIComponent(String(applicationId))}/close`,
        body
      })
    }

    if (actionKey === 'addAttachment') {
      candidates.push({
        method: 'post',
        url: `/trademarks/trademark-applications/${encodeURIComponent(String(applicationId))}/attachments`,
        body
      })
    }
  }

  if (service === 'merger-clearance' && actionKey === 'assignOfficer') {
    candidates.push({
      method: 'post',
      url: `/mergers/applications/${encodeURIComponent(String(applicationId))}/assign-officer`,
      body: {
        officerId: payload.officerId || payload.officer || payload.assigneeId || null,
        notes: payload.notes || ''
      }
    })
  }

  const data = await requestFirstSuccess(candidates)
  const result = data?.application || data?.result?.application || data
  return normalizeApplication(result || {}, processTemplate)
}

async function fetchPaymentsByApplications(applications = []) {
  if (!applications.length) {
    return []
  }

  function buildFallbackPaymentFromApplication(application = {}) {
    const payment = application.payment || {}
    const trademarkPayment = application.trademarkRecordation?.payment || {}
    const amountDue = Number(payment.amountDue || application.fees?.total || 0)
    const amountPaid = Number(payment.amountPaid || trademarkPayment.amountPaid || 0)
    const controlNumber = payment.controlNumber || trademarkPayment.controlNumber || null
    const referenceNumber = payment.referenceNumber || trademarkPayment.referenceNumber || null
    const receiptNumber = trademarkPayment.receiptNumber || null
    const status = payment.status || trademarkPayment.status || 'pending'

    const hasVisiblePaymentData =
      Boolean(controlNumber) ||
      Boolean(referenceNumber) ||
      Boolean(receiptNumber) ||
      amountDue > 0 ||
      amountPaid > 0 ||
      Boolean(status)

    if (!hasVisiblePaymentData) {
      return null
    }

    return normalizePayment(
      {
        paymentId: `APP-PAY-${application.applicationId}`,
        source: {
          module: resolvePaymentModule(application.serviceKey),
          applicationId: application.applicationId
        },
        totalAmount: amountDue,
        amountPaid,
        balance: payment.balance,
        status,
        paymentStatus: status,
        billStatus: status,
        controlNumber,
        referenceNumber,
        receiptNumber,
        paidAt: trademarkPayment.paidAt || null,
        metadata: {
          dueDate: application.dateSubmitted || application.submittedAt || null,
          serviceProvider: 'FCC',
          source: 'application_fallback'
        }
      },
      application.applicationId
    )
  }

  if (useMocks) {
    await wait(80)
    const normalizedMockRows = mockPayments
      .filter((payment) => applications.some((application) => application.applicationId === payment.source?.applicationId))
      .map((payment) => normalizePayment(payment, payment.source?.applicationId))

    const merged = [...normalizedMockRows]
    for (const application of applications) {
      const existing = merged.some((row) => String(row.applicationId) === String(application.applicationId))
      if (existing) continue
      const fallback = buildFallbackPaymentFromApplication(application)
      if (fallback) merged.push(fallback)
    }

    return merged
  }

  const paymentLists = await Promise.all(
    applications.map(async (application) => {
      try {
        const { data } = await http.get(
          `/payments/queries/application/${application.applicationId}`,
          {
            params: {
              module: resolvePaymentModule(application.serviceKey),
              limit: 100
            }
          }
        )

        const rows = extractArray(data)
        if (rows.length) {
          return rows.map((payment) => normalizePayment(payment, application.applicationId))
        }
      } catch (_error) {
        // If payment query endpoint is unavailable for this module, fallback to application-level data.
      }

      const fallback = buildFallbackPaymentFromApplication(application)
      return fallback ? [fallback] : []
    })
  )

  return paymentLists.flat()
}

export async function fetchApplicantPayments({ applications = [] } = {}) {
  return fetchPaymentsByApplications(applications)
}

export async function fetchApplicantCertificates({ applicantId, applications = [] } = {}) {
  if (useMocks) {
    await wait(120)
    return applications
      .filter((application) => isCertificateIssued(application))
      .map((application) => ({
        certificateId: `CERT-${application.applicationId}`,
        applicationId: application.applicationId,
        service: application.service,
        status: 'active',
        issuedAt: application.raw?.issuedAt || application.raw?.updatedAt || new Date().toISOString(),
        workflowStage: application.workflowStageTitle || null,
        downloadAvailable: false
      }))
  }

  // Use dedicated applicant endpoint if applicantId is available
  if (applicantId) {
    const data = await requestFirstSuccess([
      {
        method: 'get',
        url: `/certificates/queries/applicant/${encodeURIComponent(applicantId)}`,
        config: { params: { limit: 100 } }
      }
    ], { retryStatuses: [404, 405] }).catch(() => null)

    const rows = extractCertificateRows(data)
    return rows.map((cert) => ({
      certificateId: cert.certificateId || cert._id,
      applicationId: cert.details?.applicationId || cert.applicationId,
      service: cert.title || cert.type || 'Certificate',
      status: cert.status || 'Issued',
      issuedAt: cert.issuedAt || cert.createdAt || null,
      workflowStage: cert.details?.trademarkName || null,
      downloadAvailable: Boolean(
        cert?.details?.downloadUrl ||
        cert?.details?.fileUrl ||
        cert?.metadata?.downloadUrl ||
        cert?.metadata?.fileUrl
      ),
      raw: cert
    }))
  }

  // Fallback: iterate applications (N+1 pattern, for backward compat)
  const seen = new Map()
  const applicationRows = Array.isArray(applications) ? applications : []

  for (const application of applicationRows) {
    const applicationId = String(application?.applicationId || application?.raw?.applicationId || '').trim()
    if (!applicationId) {
      continue
    }

    const data = await requestFirstSuccess([
      {
        method: 'get',
        url: '/certificates',
        config: {
          params: {
            applicationId,
            limit: 50
          }
        }
      }
    ], {
      retryStatuses: [404, 405]
    }).catch(() => null)

    const rows = extractCertificateRows(data)
    for (const cert of rows) {
      const certificateId = cert.certificateId || cert._id
      if (!certificateId || seen.has(String(certificateId))) {
        continue
      }

      seen.set(String(certificateId), {
        certificateId,
        applicationId: cert.details?.applicationId || cert.applicationId || applicationId,
        service: application?.service || cert.title || cert.type || 'Certificate',
        status: cert.status || 'Issued',
        issuedAt: cert.issuedAt || cert.createdAt || null,
        workflowStage: cert.details?.trademarkName || application?.workflowStageTitle || null,
        downloadAvailable: Boolean(
          cert?.details?.downloadUrl ||
          cert?.details?.fileUrl ||
          cert?.metadata?.downloadUrl ||
          cert?.metadata?.fileUrl
        ),
        raw: cert
      })
    }
  }

  return Array.from(seen.values())
}

export async function downloadApplicantCertificate(certificateId) {
  if (!certificateId) {
    throw new Error('Certificate ID is required.')
  }

  if (useMocks) {
    await wait(80)
    return {
      certificate: {
        certificateId
      },
      downloadUrl: null
    }
  }

  const data = await requestFirstSuccess([
    {
      method: 'get',
      url: `/certificates/${encodeURIComponent(String(certificateId))}/download`
    }
  ], {
    retryStatuses: [404, 405]
  })

  return data
}

export async function fetchApplicantAnnouncements() {
  if (useMocks) {
    await wait(70)
    return [
      {
        id: 'ann-001',
        title: 'Guidance Update on Merger Clearence Filings',
        message: 'FCC has updated supporting documentation requirements for merger notifications.',
        publishedAt: '2026-02-20T08:00:00.000Z'
      },
      {
        id: 'ann-002',
        title: 'Service Availability Notice',
        message: 'Applicant portal services will undergo maintenance on Sunday 02:00 - 04:00 EAT.',
        publishedAt: '2026-02-18T06:00:00.000Z'
      }
    ]
  }

  const candidates = [
    '/announcements',
    '/public/announcements',
    '/public/v1/announcements/published'
  ]

  for (const endpoint of candidates) {
    try {
      const { data } = await http.get(endpoint, { params: { limit: 10 } })
      const rows = extractArray(data, 'announcements').map(normalizeAnnouncement)
      if (rows.length) {
        return rows
      }
    } catch {
      // Try next candidate endpoint.
    }
  }

  return []
}

export async function fetchUnreadNotificationsCount() {
  if (useMocks) {
    await wait(80)
    return 3
  }

  const { data } = await http.get('/notifications/unread-count')
  return Number(data?.unread || 0)
}

export async function fetchApplicantDashboard({ email = '', applicantId = '' } = {}) {
  const processTemplate = await fetchRegistrationTemplate()
  const applications = await fetchApplicantApplications({ email, applicantId, processTemplate })
  const [payments, unreadMessages, certificates, announcements] = await Promise.all([
    fetchPaymentsByApplications(applications),
    fetchUnreadNotificationsCount(),
    fetchApplicantCertificates({ applications }),
    fetchApplicantAnnouncements()
  ])

  return {
    processTemplate,
    openApplications: applications.length,
    pendingPayments: payments.filter((payment) => hasPendingPaymentStatus(payment.status)).length,
    issuedCertificates: certificates.length,
    unreadMessages,
    announcements,
    certificates,
    recentApplications: applications.slice(0, 6),
    applications,
    payments
  }
}

export async function fetchApplicantProfile({ email = '', userId = '' } = {}) {
  if (useMocks) {
    await wait(120)
    return {
      user: {
        userId: userId || 'USR-MOCK-001',
        email: email || 'applicant@example.com',
        fullName: 'FCC Applicant User',
        phoneNumber: '+255700000000'
      },
      applicant: {
        applicantId: 'APPL-MOCK-001',
        type: 'firm',
        companyName: 'Example Business Ltd',
        email: email || 'applicant@example.com',
        phoneNumber: '+255700000000',
        registrationNumber: 'REG-1002',
        countryOfIncorporation: 'Tanzania',
        physicalAddress: 'Dar es Salaam',
        postalAddress: 'P.O. Box 100, Dar es Salaam',
        businessDescription: 'Consumer services provider',
        contactPerson: {
          name: 'FCC Applicant User',
          email: email || 'applicant@example.com',
          phoneNumber: '+255700000000'
        }
      },
      profile: null,
      applicantId: 'APPL-MOCK-001',
      fullName: 'FCC Applicant User',
      userId: userId || 'USR-MOCK-001',
      email: email || 'applicant@example.com',
      phoneNumber: '+255700000000',
      companyName: 'Example Business Ltd',
      registrationNumber: 'REG-1002',
      countryOfIncorporation: 'Tanzania',
      postalAddress: 'P.O. Box 100, Dar es Salaam',
      physicalAddress: 'Dar es Salaam',
      businessDescription: 'Consumer services provider',
      applicantType: 'company',
      displayName: 'Example Business Ltd',
      isCompanyApplicant: true,
      isIndividualApplicant: false
    }
  }

  try {
    const { data } = await http.get('/applicants/my-profile')
    const resolvedProfile = data?.profile || data || {}
    const user = resolvedProfile?.user || null
    const applicant = resolvedProfile?.applicant || null

    return {
      user,
      applicant,
      profile: resolvedProfile,
      applicantId: applicant?.applicantId || user?.attributes?.custom?.applicantId || null,
      applicantType: applicant?.type || 'individual',
      displayName: (() => {
        if (applicant?.type === 'company') return applicant?.company?.name || applicant?.companyName || ''
        const first = applicant?.individual?.firstName || applicant?.firstName || ''
        const last = applicant?.individual?.surname || applicant?.surname || ''
        return `${first} ${last}`.trim() || user?.fullName || ''
      })(),
      isCompanyApplicant: applicant?.type === 'company',
      isIndividualApplicant: applicant?.type !== 'company',
      userId: user?.userId || userId || null,
      fullName: user?.fullName || applicant?.contactPerson?.name || '',
      email: user?.email || applicant?.email || email || '',
      phoneNumber: applicant?.phoneNumber || user?.phoneNumber || '',
      companyName: applicant?.companyName || user?.attributes?.custom?.companyName || '',
      registrationNumber: applicant?.registrationNumber || user?.attributes?.custom?.registrationNumber || '',
      countryOfIncorporation: applicant?.countryOfIncorporation || '',
      postalAddress: applicant?.postalAddress || '',
      physicalAddress: applicant?.physicalAddress || '',
      businessDescription: applicant?.businessDescription || ''
    }
  } catch (error) {
    const status = Number(error?.response?.status || 0)
    if (![404, 405].includes(status)) {
      throw error
    }
  }

  const effectiveEmail = String(email || '').trim()
  let applicant = null
  let profile = null

  if (effectiveEmail) {
    const { data } = await http.get('/applicants/search', {
      params: {
        q: effectiveEmail,
        limit: 1
      }
    })

    const candidates = extractArray(data, 'applicants')
    applicant = candidates.find((candidate) => String(candidate.email || '').toLowerCase() === effectiveEmail.toLowerCase()) || candidates[0] || null

    if (applicant?.applicantId) {
      const { data: profileData } = await http.get(`/applicants/${applicant.applicantId}/profile`)
      profile = profileData?.profile || null
    }
  }

  const applicantFromProfile = profile?.applicant || applicant || {}

  return {
    user: null,
    applicant,
    profile,
    applicantId: applicantFromProfile.applicantId || applicant?.applicantId || null,
    applicantType: applicantFromProfile.type || 'individual',
    displayName: (() => {
      if (applicantFromProfile?.type === 'company') return applicantFromProfile?.company?.name || applicantFromProfile?.companyName || ''
      const first = applicantFromProfile?.individual?.firstName || applicantFromProfile?.firstName || ''
      const last = applicantFromProfile?.individual?.surname || applicantFromProfile?.surname || ''
      return `${first} ${last}`.trim() || ''
    })(),
    isCompanyApplicant: applicantFromProfile?.type === 'company',
    isIndividualApplicant: applicantFromProfile?.type !== 'company',
    userId: userId || null,
    fullName: applicantFromProfile.contactPerson?.name || '',
    email: effectiveEmail || applicantFromProfile.email || '',
    phoneNumber: applicantFromProfile.phoneNumber || '',
    companyName: applicantFromProfile.companyName || '',
    registrationNumber: applicantFromProfile.registrationNumber || '',
    countryOfIncorporation: applicantFromProfile.countryOfIncorporation || '',
    postalAddress: applicantFromProfile.postalAddress || '',
    physicalAddress: applicantFromProfile.physicalAddress || '',
    businessDescription: applicantFromProfile.businessDescription || ''
  }
}

export async function updateApplicantProfile({ applicantId, changes }) {
  if (useMocks) {
    await wait(120)
    return {
      applicantId,
      ...changes
    }
  }

  if (!applicantId) {
    throw new Error('Applicant profile is not linked to this account.')
  }

  const { data } = await http.put(`/applicants/${applicantId}/update-applicant`, changes)
  return data?.applicant || data
}

export async function changeApplicantPassword(payload) {
  if (useMocks) {
    await wait(120)
    return { success: true }
  }

  const candidates = [
    '/user-management/auth/change-password',
    '/user-management/users/change-password',
    '/user-management/auth/update-password'
  ]

  let lastError = null
  for (const endpoint of candidates) {
    try {
      const { data } = await http.post(endpoint, payload)
      return data
    } catch (error) {
      const status = Number(error?.response?.status || 0)
      if (status === 404 || status === 405) {
        lastError = error
        continue
      }
      throw error
    }
  }

  throw lastError || new Error('Password change endpoint is unavailable.')
}

export { buildSfccApplicationPayload }
