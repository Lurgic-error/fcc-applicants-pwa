import {
  DEFAULT_APPLICATION_SERVICE_KEY,
  resolveApplicationServiceKeyFromText
} from '@/constants/applicationCatalog'
import {
  formatApplicationStatus,
  normalizeApplicationStatus
} from '@/constants/applicationLifecycle'
import {
  getApplicationProcessName,
  getApplicationProcessStages,
  getApplicationServiceFields
} from '@/constants/applicationProcesses'
import {
  calculateServiceFees,
  getCertificatePolicy
} from '@/constants/applicationServiceRules'
import { getTrademarkFeeByRequestType, getTrademarkRequestTypeConfig } from '@/constants/trademarkRecordation'

const DEFAULT_PROCESS_NAME = getApplicationProcessName(DEFAULT_APPLICATION_SERVICE_KEY)

export const DEFAULT_REGISTRATION_STAGES = Object.freeze([
  { key: 'application_submitted', title: 'Application Submitted', actor: 'Applicant' },
  { key: 'assigned_for_screening', title: 'Assigned For Screening', actor: 'Consumer Protection Manager' },
  { key: 'screening_in_progress', title: 'Screening In Progress', actor: 'Consumer Protection Officer' },
  { key: 'awaiting_payment', title: 'Awaiting Payment', actor: 'Applicant' },
  { key: 'payment_verified', title: 'Payment Verified', actor: 'Consumer Protection Officer' },
  { key: 'under_vetting', title: 'Under Vetting', actor: 'Manager / Director / Director General' },
  { key: 'certificate_issued', title: 'Certificate Issued', actor: 'Director General / Record Officer' }
])

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const TRADEMARK_REQUEST_TYPE_TO_PURPOSE = Object.freeze({
  new_recordation: 'recordation',
  renewal: 'renewal',
  alteration: 'amendment',
  ownership_change: 'ownership_transfer',
  name_change: 'change_name',
  agent_appointment: 'agent_appointment',
  discontinuation: 'discontinuation'
})

function mapTrademarkRequestTypeToPurpose(requestType = '') {
  return TRADEMARK_REQUEST_TYPE_TO_PURPOSE[String(requestType || '').toLowerCase()] || 'recordation'
}

function normalizeTrademarkPaymentStatus(value = '') {
  const normalized = String(value || '').trim().toLowerCase()
  if (['paid', 'verified', 'confirmed', 'paid_in_full'].includes(normalized)) {
    return 'PAID'
  }
  if (normalized.includes('partial')) {
    return 'PARTIALLY_PAID'
  }
  return 'UNPAID'
}

function mapDomainPaymentStatusToUi(value = '') {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return 'pending_control_number'
  if (normalized === 'paid' || normalized === 'verified' || normalized === 'confirmed') return 'verified'
  if (normalized === 'partially_paid' || normalized === 'partial') return 'paid'
  if (normalized.includes('control')) return 'control_number_issued'
  if (normalized.includes('pending') || normalized.includes('unpaid')) return 'pending_control_number'
  return value
}

function toObject(value) {
  if (!value) {
    return null
  }
  if (typeof value === 'object') {
    return value
  }
  return { id: String(value) }
}

function pickRef(value) {
  const source = toObject(value)
  if (!source) {
    return null
  }

  return {
    id: source._id || source.id || source.employeeId || source.taskId || source.activityId || source.sectionId || source.officeId || source.directorateId || null,
    code: source.code || source.employeeId || source.taskId || source.activityId || source.sectionId || source.officeId || source.directorateId || null,
    name: source.fullName || source.title || source.name || source.label || source.designation || null,
    value: source
  }
}

function humanizeStageKey(value = '') {
  return String(value)
    .split('_')
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(' ')
}

function normalizeDate(value) {
  if (!value) {
    return 'N/A'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return 'N/A'
  }

  return parsed.toISOString().slice(0, 10)
}

function asIsoDate(value) {
  if (!value) {
    return null
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return parsed.toISOString()
}

function resolveFinancialYear(dateValue) {
  const parsed = new Date(dateValue || Date.now())
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  const month = parsed.getUTCMonth() + 1
  const year = parsed.getUTCFullYear()
  if (month >= 7) {
    return `${year}/${year + 1}`
  }
  return `${year - 1}/${year}`
}

function resolveQuarter(dateValue) {
  const parsed = new Date(dateValue || Date.now())
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  const month = parsed.getUTCMonth() + 1
  return Math.min(4, Math.max(1, Math.ceil(month / 3)))
}

function resolveStageTitle(stages = [], key = '') {
  const match = stages.find((stage) => stage?.key === key)
  return match?.title || humanizeStageKey(key)
}

export function normalizeProcessTemplate(process = {}) {
  const stages = Array.isArray(process.stages) && process.stages.length
    ? process.stages
    : DEFAULT_REGISTRATION_STAGES

  return {
    code: process.code || 'FCC_CBP_CP_TB_01',
    name: process.name || DEFAULT_PROCESS_NAME,
    reviewSLADays: Number(process.reviewSLADays || 14),
    approvalSLADays: Number(process.approvalSLADays || 21),
    stages
  }
}

export function normalizeApplication(raw = {}, processTemplate = null) {
  const template = processTemplate ? normalizeProcessTemplate(processTemplate) : null
  const processAutomation = raw.processAutomation || {}
  const serviceKey = resolveApplicationServiceKeyFromText(
    raw.serviceType,
    raw.serviceKey,
    raw.purpose,
    processAutomation.processName
  )

  const defaultServiceStages = getApplicationProcessStages(serviceKey)
  const stages = Array.isArray(processAutomation.stages) && processAutomation.stages.length
    ? processAutomation.stages
    : defaultServiceStages.length
      ? defaultServiceStages
      : template?.stages || DEFAULT_REGISTRATION_STAGES

  const stageKey = processAutomation.currentStage || stages[0]?.key || 'application_submitted'
  const stageTitle = resolveStageTitle(stages, stageKey)

  const stageHistory = Array.isArray(processAutomation.stageHistory)
    ? processAutomation.stageHistory
    : []

  const latestStage = stageHistory.length ? stageHistory[stageHistory.length - 1] : null

  const applicant = raw.applicant || {}
  const processName = processAutomation.processName || raw.processName || raw.purpose || getApplicationProcessName(serviceKey)
  const serviceDetails = raw.serviceDetails || raw.metadata?.serviceDetails || {}
  const trademarkVersions = Array.isArray(raw.trademarkVersions)
    ? raw.trademarkVersions
    : Array.isArray(serviceDetails.trademarkVersions)
      ? serviceDetails.trademarkVersions
      : []
  const contracts = Array.isArray(raw.contracts)
    ? raw.contracts
    : Array.isArray(serviceDetails.contracts)
      ? serviceDetails.contracts
      : []
  const trademarkRows = Array.isArray(raw.trademarks)
    ? raw.trademarks
        .map((row, index) => {
          if (!row) {
            return null
          }
          const draft = row.trademarkDraft || {}
          const markName = row.trademarkName || draft.name || row.markName || ''
          if (!markName) {
            return null
          }
          return {
            submissionId: row.submissionId || row.draftId || row.trademarkId || `TM-SUB-${index + 1}`,
            trademarkName: markName,
            classOfGoods: draft.classOfGoods || draft.classNumber || row.classOfGoods || row.classNumber || '',
            representationType: draft.representationType || row.representationType || '',
            countryOfOrigin: draft.countryOfOrigin || row.countryOfOrigin || '',
            registrationReference: draft.registrationReference || row.registrationReference || '',
            registrationCertificateNumber:
              draft.registrationCertificateNumber || row.registrationCertificateNumber || '',
            purpose: row.purpose || null,
            feeAmount: toNumber(row.feeAmount, 0),
            notes: draft.notes || row.notes || ''
          }
        })
        .filter(Boolean)
    : []
  const trademarkRecordation =
    raw.trademarkRecordation ||
    serviceDetails.trademarkRecordation ||
    (serviceKey === 'trademark-recordation'
      ? {
          requestType: serviceDetails.requestType || raw.requestType || 'new_recordation',
          trademarkName: serviceDetails.markName || raw.markName || '',
          classOfGoods: serviceDetails.classNumber || raw.classNumber || '',
          representationType: serviceDetails.representationType || raw.representationType || '',
          countryOfOrigin: serviceDetails.countryOfOrigin || raw.countryOfOrigin || '',
          registrationReference: serviceDetails.registrationReference || raw.registrationReference || '',
          ownerCategory: serviceDetails.ownerCategory || raw.ownerCategory || '',
          attachments: Array.isArray(serviceDetails.attachments) ? serviceDetails.attachments : [],
          payment: serviceDetails.payment || {},
          trademarks: []
        }
      : null)
  const mergerClearance =
    raw.mergerClearance ||
    serviceDetails.mergerClearance ||
    (raw.transactionType || raw.mergerNotification || raw.confidentialityClaim
      ? {
          transactionType: raw.transactionType || '',
          transactionValue: toNumber(raw.assetsValue, 0),
          estimatedTurnover: toNumber(raw.turnover, 0),
          partiesInvolved: (raw.parties || []).map((party) => party.name).filter(Boolean).join(', '),
          targetFirmName: raw.mergerNotification?.targetFirm?.name || '',
          targetFirmBusiness: raw.mergerNotification?.targetFirm?.businessDescription || '',
          acquisitionDescription: raw.mergerNotification?.acquisitionNarrative || '',
          commercialRationale: raw.mergerNotification?.commercialRationale || '',
          relevantMarketDefinition: raw.mergerNotification?.relevantMarketDefinition || '',
          confidentialityClaimRequired: Boolean(raw.confidentialityClaim?.hasClaim),
          confidentialityStatement: raw.confidentialityClaim?.statement || ''
        }
      : null)
  const fees = raw.fees || calculateServiceFees(serviceKey, {
    applicationFee: raw.applicationFee,
    trademarkRecordation,
    trademarkRequestType: trademarkRecordation?.requestType,
    trademarkVersions,
    contracts,
    mergerClearance,
    transactionValue: serviceDetails.transactionValue
  })
  const paymentRegistration = raw.paymentRegistration || {}
  const registrationApplicationPayment = paymentRegistration.applicationPayment || {}
  const registrationStatus = paymentRegistration.overallPaymentStatus || raw.overallPaymentStatus || null
  const registrationAmountDue = toNumber(
    paymentRegistration.totalExpectedAmount || registrationApplicationPayment.expectedAmount,
    toNumber(raw.applicationFee || fees.total)
  )
  const registrationAmountPaid = toNumber(
    registrationApplicationPayment.amountPaid || raw.payment?.amountPaid,
    0
  )
  const payment = raw.payment || {
    status: registrationStatus ? mapDomainPaymentStatusToUi(registrationStatus) : (raw.paymentStatus || 'Pending'),
    amountDue: registrationAmountDue,
    amountPaid: registrationAmountPaid,
    balance: toNumber(registrationAmountDue - registrationAmountPaid),
    controlNumber:
      registrationApplicationPayment.controlNumber || paymentRegistration.controlNumber || raw.paymentControlNumber || null,
    referenceNumber:
      registrationApplicationPayment.referenceNumber || raw.paymentReferenceNumber || null
  }
  const reviews = Array.isArray(raw.reviews) ? raw.reviews : []
  const reports = Array.isArray(raw.reports) ? raw.reports : []
  const submissions = Array.isArray(raw.submissions) ? raw.submissions : []
  const reviewStages = Array.isArray(raw.reviewStages) ? raw.reviewStages : []
  const attachments = Array.isArray(raw.attachments) ? raw.attachments : []
  const auditTrail = Array.isArray(raw.auditTrail) ? raw.auditTrail : []
  const certificatePolicy = getCertificatePolicy(serviceKey)

  return {
    id: raw.applicationId || raw.id || raw._id,
    applicationId: raw.applicationId || raw.id || raw._id,
    applicantId: applicant.applicantId || raw.applicantId || applicant.id || applicant._id || null,
    serviceKey,
    service: processName,
    status: formatApplicationStatus(normalizeApplicationStatus(raw.status || stageTitle)),
    workflowStageKey: stageKey,
    workflowStageTitle: stageTitle,
    workflowStages: stages,
    workflowStageHistory: stageHistory,
    submittedAt: normalizeDate(raw.dateReceived || raw.createdAt),
    reference: raw.fileNumber || raw.applicationNumber || raw.applicationId || 'N/A',
    lastAction: latestStage
      ? `${resolveStageTitle(stages, latestStage.stage)} (${normalizeDate(latestStage.at)})`
      : stageTitle,
    applicantName:
      applicant.companyName ||
      [applicant.firstName, applicant.surname].filter(Boolean).join(' ') ||
      applicant.contactPerson?.name ||
      'Unknown Applicant',
    applicantEmail: applicant.email || applicant.contactPerson?.email || null,
    applicantType: applicant.type || 'firm',
    responsibleOfficer: pickRef(raw.responsibleOfficer),
    responsibleManager: pickRef(raw.responsibleManager),
    responsibleDirector: pickRef(raw.responsibleDirector),
    activity: pickRef(raw.activity),
    task: pickRef(raw.task),
    directorate: pickRef(raw.directorate),
    section: pickRef(raw.section),
    office: pickRef(raw.office),
    dateSubmitted: normalizeDate(raw.dateSubmitted || raw.dateReceived || raw.createdAt),
    fileNumber: raw.fileNumber || raw.applicationNumber || null,
    financialYear: raw.financialYear || resolveFinancialYear(raw.dateSubmitted || raw.dateReceived || raw.createdAt),
    quarter: raw.quarter || resolveQuarter(raw.dateSubmitted || raw.dateReceived || raw.createdAt),
    fees: {
      currency: fees.currency || 'TZS',
      total: toNumber(fees.total || raw.applicationFee),
      model: fees.model || 'fixed',
      breakdown: Array.isArray(fees.breakdown) ? fees.breakdown : []
    },
    payment: {
      ...payment,
      status:
        serviceKey === 'trademark-recordation'
          ? mapDomainPaymentStatusToUi(payment.status)
          : payment.status,
      amountDue: toNumber(payment.amountDue || raw.applicationFee || fees.total),
      amountPaid: toNumber(payment.amountPaid),
      balance: toNumber(
        payment.balance,
        Math.max(0, toNumber(payment.amountDue || raw.applicationFee || fees.total) - toNumber(payment.amountPaid))
      )
    },
    reviewCount: reviews.length,
    reportCount: reports.length,
    submissionCount: submissions.length,
    attachmentCount: attachments.length,
    reviews,
    reports,
    submissions,
    reviewStages,
    attachments,
    auditTrail,
    trademarkVersions,
    trademarkRecordation: trademarkRecordation
      ? {
          ...trademarkRecordation,
          trademarks: Array.isArray(trademarkRecordation.trademarks) && trademarkRecordation.trademarks.length
            ? trademarkRecordation.trademarks
            : trademarkRows.length
              ? trademarkRows
              : [
                  {
                    submissionId: 'TM-SUB-1',
                    trademarkName:
                      trademarkRecordation.trademarkName || serviceDetails.markName || raw.markName || '',
                    classOfGoods:
                      trademarkRecordation.classOfGoods || serviceDetails.classNumber || raw.classNumber || '',
                    representationType:
                      trademarkRecordation.representationType || serviceDetails.representationType || raw.representationType || '',
                    countryOfOrigin:
                      trademarkRecordation.countryOfOrigin || serviceDetails.countryOfOrigin || raw.countryOfOrigin || '',
                    registrationReference:
                      trademarkRecordation.registrationReference || serviceDetails.registrationReference || raw.registrationReference || '',
                    registrationCertificateNumber:
                      trademarkRecordation.registrationCertificateNumber || '',
                    notes: trademarkRecordation.notes || ''
                  }
                ].filter((row) => String(row.trademarkName || '').trim())
        }
      : trademarkRecordation,
    requestType: trademarkRecordation?.requestType || null,
    contracts,
    mergerClearance,
    certificatePolicy,
    serviceDetails,
    raw
  }
}

export function normalizePayment(raw = {}, fallbackApplicationId = null) {
  const amountDue = Number(raw.totalAmount || raw.amount || raw.amountDue || 0)
  const amountPaid = Number(raw.amountPaid || raw.paidAmount || raw.metadata?.amountPaid || 0)
  const balanceRaw = raw.balance ?? raw.metadata?.balance
  const balance = Number.isFinite(Number(balanceRaw))
    ? Number(balanceRaw)
    : Math.max(0, amountDue - amountPaid)

  const paidAt = normalizeDate(raw.paidAt || raw.metadata?.paidAt || raw.metadata?.paymentDate)
  const dueDate = normalizeDate(raw.metadata?.dueDate || raw.dueDate || raw.createdAt)
  const receiptNumber = raw.receiptNumber || raw.metadata?.receiptNumber || null
  const referenceNumber = raw.referenceNumber || raw.metadata?.referenceNumber || receiptNumber || null
  const paymentStatus = String(raw.paymentStatus || raw.status || 'pending').replace(/_/g, ' ')
  const billStatus = String(raw.billStatus || raw.gepgBillStatus || raw.status || 'pending').replace(/_/g, ' ')

  return {
    id: raw.paymentId || raw.id || raw._id,
    applicationId: raw.source?.applicationId || fallbackApplicationId || 'N/A',
    amount: amountDue,
    amountPaid,
    balance,
    status: paymentStatus,
    paymentStatus,
    billStatus,
    dueDate,
    paidAt,
    controlNumber: raw.controlNumber || null,
    receiptNumber,
    referenceNumber,
    serviceProvider: raw.serviceProvider || raw.metadata?.serviceProvider || 'FCC',
    gePGResponseCode: raw.gePGResponseCode || raw.metadata?.gePGResponseCode || null,
    gePGResponseMessage: raw.gePGResponseMessage || raw.metadata?.gePGResponseMessage || null,
    raw
  }
}

export function filterApplicationsByApplicant(applications = [], { email = '', applicantId = '' } = {}) {
  const targetEmail = normalizeEmail(email)
  const targetApplicantId = String(applicantId || '').trim()

  if (targetApplicantId) {
    return applications.filter((application) => {
      const candidateIds = [
        application.applicantId,
        application.raw?.applicant?.applicantId,
        application.raw?.applicantId
      ]
        .filter(Boolean)
        .map((value) => String(value))

      if (candidateIds.includes(targetApplicantId)) {
        return true
      }

      if (!targetEmail) {
        return false
      }

      const applicationEmail = normalizeEmail(application.applicantEmail)
      if (applicationEmail === targetEmail) {
        return true
      }

      const raw = application.raw || {}
      const fallbackEmails = [
        raw.applicant?.email,
        raw.applicant?.contactPerson?.email,
        raw.createdBy?.email,
        raw.lastModifiedBy?.email
      ]

      return fallbackEmails.map(normalizeEmail).includes(targetEmail)
    })
  }

  if (!targetEmail) {
    return applications
  }

  return applications.filter((application) => {
    const applicationEmail = normalizeEmail(application.applicantEmail)
    if (applicationEmail === targetEmail) {
      return true
    }

    const raw = application.raw || {}
    const fallbackEmails = [
      raw.applicant?.email,
      raw.applicant?.contactPerson?.email,
      raw.createdBy?.email,
      raw.lastModifiedBy?.email
    ]

    return fallbackEmails.map(normalizeEmail).includes(targetEmail)
  })
}

export function buildSfccApplicationPayload(form = {}, user = {}, processTemplate = null) {
  const template = processTemplate ? normalizeProcessTemplate(processTemplate) : null
  const serviceKey = form.serviceKey || DEFAULT_APPLICATION_SERVICE_KEY
  const processName = getApplicationProcessName(serviceKey)
  const applicantType = String(form.applicantType || 'firm').toLowerCase() === 'individual' ? 'individual' : 'firm'

  const fullName = String(user.fullName || '').trim()
  const [firstName, ...surnameParts] = fullName.split(' ').filter(Boolean)
  const surname = surnameParts.join(' ')
  const serviceFields = getApplicationServiceFields(serviceKey)
  const serviceDetails = serviceFields.reduce((acc, field) => {
    const value = form[field.key]
    if (value === undefined || value === null || value === '') {
      return acc
    }
    acc[field.key] = value
    return acc
  }, {})

  const rawTrademarkRecordation = form.trademarkRecordation || {}
  const trademarkRecordationRequestType = rawTrademarkRecordation.requestType || form.requestType || 'new_recordation'
  const trademarkRequestConfig = getTrademarkRequestTypeConfig(trademarkRecordationRequestType)
  const trademarkFeePerSubmission = getTrademarkFeeByRequestType(trademarkRecordationRequestType)
  const trademarkPurpose = mapTrademarkRequestTypeToPurpose(trademarkRecordationRequestType)
  const normalizeTrademarkAttachment = (item = {}, fallbackId = '') => ({
    attachmentId: item.attachmentId || fallbackId,
    documentType: item.documentType || 'other',
    fileName: item.fileName || '',
    referenceNumber: item.referenceNumber || '',
    issuedBy: item.issuedBy || '',
    issuedDate: item.issuedDate || '',
    notes: item.notes || ''
  })
  const normalizeTrademarkOwner = (row = {}) => {
    const owner = row.owner || {}
    return {
      ownerCategory: owner.ownerCategory || row.ownerCategory || rawTrademarkRecordation.ownerCategory || form.ownerCategory || 'Corporate Owner',
      fullName: owner.fullName || row.ownerFullName || rawTrademarkRecordation.ownerFullName || '',
      businessAddress: owner.businessAddress || row.ownerBusinessAddress || rawTrademarkRecordation.ownerBusinessAddress || '',
      nationalityOrJurisdiction:
        owner.nationalityOrJurisdiction ||
        row.ownerNationalityOrJurisdiction ||
        rawTrademarkRecordation.ownerNationalityOrJurisdiction ||
        ''
    }
  }
  const normalizeTrademarkAgent = (row = {}) => {
    const agent = row.agent || {}
    return {
      name: agent.name || row.agentName || rawTrademarkRecordation.agentName || '',
      firm: agent.firm || row.agentFirm || rawTrademarkRecordation.agentFirm || '',
      email: agent.email || row.agentEmail || rawTrademarkRecordation.agentEmail || '',
      phone: agent.phone || row.agentPhone || rawTrademarkRecordation.agentPhone || '',
      powerOfAttorneyNumber:
        agent.powerOfAttorneyNumber ||
        row.powerOfAttorneyNumber ||
        rawTrademarkRecordation.powerOfAttorneyNumber ||
        ''
    }
  }
  const normalizeArrayOfObjects = (items, mapper) =>
    Array.isArray(items)
      ? items
          .map((item) => mapper(item || {}))
          .filter((item) => Object.values(item).some((value) => String(value || '').trim()))
      : []

  const rawTrademarkRows = serviceKey === 'trademark-recordation'
    ? (
        Array.isArray(rawTrademarkRecordation.trademarks) && rawTrademarkRecordation.trademarks.length
          ? rawTrademarkRecordation.trademarks
          : [
              {
                trademarkName: rawTrademarkRecordation.trademarkName || form.markName || '',
                classOfGoods: rawTrademarkRecordation.classOfGoods || form.classNumber || '',
                representationType: rawTrademarkRecordation.representationType || form.representationType || '',
                countryOfOrigin: rawTrademarkRecordation.countryOfOrigin || form.countryOfOrigin || '',
                registrationReference: rawTrademarkRecordation.registrationReference || form.registrationReference || '',
                registrationCertificateNumber: rawTrademarkRecordation.registrationCertificateNumber || '',
                notes: rawTrademarkRecordation.notes || ''
              }
            ]
      )
        .map((row, index) => {
          const owner = normalizeTrademarkOwner(row)
          const agent = normalizeTrademarkAgent(row)
          return {
            submissionId: row.submissionId || row.draftId || `TM-SUB-${index + 1}`,
            trademarkName: row.trademarkName || row.markName || '',
            classOfGoods: row.classOfGoods || row.classNumber || '',
            representationType: row.representationType || 'Combined Mark',
            countryOfOrigin: row.countryOfOrigin || 'Tanzania',
            registrationReference: row.registrationReference || '',
            registrationCertificateNumber: row.registrationCertificateNumber || '',
            notes: row.notes || '',
            owner,
            ownerCategory: owner.ownerCategory,
            ownerFullName: owner.fullName,
            ownerBusinessAddress: owner.businessAddress,
            ownerNationalityOrJurisdiction: owner.nationalityOrJurisdiction,
            agent,
            agentName: agent.name,
            agentFirm: agent.firm,
            agentEmail: agent.email,
            agentPhone: agent.phone,
            powerOfAttorneyNumber: agent.powerOfAttorneyNumber,
            affiliatedCompanies: normalizeArrayOfObjects(row.affiliatedCompanies, (item) => ({
              companyName: item.companyName || '',
              relationship: item.relationship || '',
              country: item.country || '',
              notes: item.notes || ''
            })),
            manufacturers: normalizeArrayOfObjects(row.manufacturers, (item) => ({
              name: item.name || '',
              address: item.address || '',
              country: item.country || '',
              contactName: item.contactName || '',
              contactPhone: item.contactPhone || '',
              notes: item.notes || ''
            })),
            authorizedParties: normalizeArrayOfObjects(row.authorizedParties, (item) => ({
              fullName: item.fullName || '',
              role: item.role || '',
              address: item.address || '',
              country: item.country || '',
              email: item.email || '',
              phone: item.phone || '',
              notes: item.notes || ''
            })),
            visuals: normalizeArrayOfObjects(row.visuals, (item) => ({
              visualType: item.visualType || '',
              description: item.description || '',
              fileName: item.fileName || '',
              colorClaim: item.colorClaim || '',
              notes: item.notes || ''
            })),
            attachments: Array.isArray(row.attachments)
              ? row.attachments
                  .filter((item) => item && (item.documentType || item.fileName || item.referenceNumber))
                  .map((item, itemIndex) =>
                    normalizeTrademarkAttachment(item, `TM-ATT-${index + 1}-${itemIndex + 1}`))
              : [],
            agentAffidavit: row.agentAffidavit || null
          }
        })
        .filter((row) => String(row.trademarkName || '').trim())
    : []

  const primaryTrademark = rawTrademarkRows[0] || {}
  const flattenedTrademarkAttachments = rawTrademarkRows.flatMap((row) =>
    (Array.isArray(row.attachments) ? row.attachments : [])
      .filter((item) => item && (item.documentType || item.fileName || item.referenceNumber))
  )
  const normalizedTopLevelAttachments = Array.isArray(rawTrademarkRecordation.attachments)
    ? rawTrademarkRecordation.attachments
        .filter((item) => item && (item.documentType || item.fileName || item.referenceNumber))
        .map((item, index) => normalizeTrademarkAttachment(item, `TM-ATT-${index + 1}`))
    : []
  const mergedTrademarkAttachments = [...normalizedTopLevelAttachments, ...flattenedTrademarkAttachments].filter((item, index, list) => {
    const signature = `${String(item.documentType || '').trim().toLowerCase()}|${String(item.fileName || '').trim().toLowerCase()}|${String(item.referenceNumber || '').trim().toLowerCase()}`
    return list.findIndex((row) => `${String(row.documentType || '').trim().toLowerCase()}|${String(row.fileName || '').trim().toLowerCase()}|${String(row.referenceNumber || '').trim().toLowerCase()}` === signature) === index
  })
  const trademarkRecordation = serviceKey === 'trademark-recordation'
    ? {
        requestType: trademarkRecordationRequestType,
        requestTypeLabel: trademarkRequestConfig.shortLabel,
        formCode:
          trademarkRecordationRequestType === 'ownership_change'
            ? 'FCC 2'
            : trademarkRecordationRequestType === 'new_recordation'
              ? 'FCC 1'
              : null,
        trademarkName: primaryTrademark.trademarkName || '',
        classOfGoods: primaryTrademark.classOfGoods || '',
        representationType: primaryTrademark.representationType || '',
        countryOfOrigin: primaryTrademark.countryOfOrigin || '',
        registrationReference: primaryTrademark.registrationReference || '',
        registrationCertificateNumber: primaryTrademark.registrationCertificateNumber || '',
        applicantRole: rawTrademarkRecordation.applicantRole || 'brand_owner',
        ownerCategory:
          rawTrademarkRecordation.ownerCategory ||
          primaryTrademark.owner?.ownerCategory ||
          form.ownerCategory ||
          '',
        ownerFullName:
          rawTrademarkRecordation.ownerFullName ||
          primaryTrademark.owner?.fullName ||
          '',
        ownerBusinessAddress:
          rawTrademarkRecordation.ownerBusinessAddress ||
          primaryTrademark.owner?.businessAddress ||
          '',
        ownerNationalityOrJurisdiction:
          rawTrademarkRecordation.ownerNationalityOrJurisdiction ||
          primaryTrademark.owner?.nationalityOrJurisdiction ||
          '',
        goodsManufacturePlaces: rawTrademarkRecordation.goodsManufacturePlaces || rawTrademarkRows
          .flatMap((row) => row.manufacturers || [])
          .map((item) => item.name)
          .filter(Boolean)
          .join('; '),
        licensedUsers: rawTrademarkRecordation.licensedUsers || rawTrademarkRows
          .flatMap((row) => row.authorizedParties || [])
          .map((item) => item.fullName)
          .filter(Boolean)
          .join('; '),
        affiliatedCompanies: rawTrademarkRecordation.affiliatedCompanies || rawTrademarkRows
          .flatMap((row) => row.affiliatedCompanies || [])
          .map((item) => item.companyName)
          .filter(Boolean)
          .join('; '),
        currentRecordationNumber: rawTrademarkRecordation.currentRecordationNumber || '',
        alterationDetails: rawTrademarkRecordation.alterationDetails || '',
        previousOwnerName: rawTrademarkRecordation.previousOwnerName || '',
        newOwnerName: rawTrademarkRecordation.newOwnerName || '',
        transferReason: rawTrademarkRecordation.transferReason || '',
        transferRightsSummary: rawTrademarkRecordation.transferRightsSummary || '',
        previousLegalName: rawTrademarkRecordation.previousLegalName || '',
        newLegalName: rawTrademarkRecordation.newLegalName || '',
        nameChangeReason: rawTrademarkRecordation.nameChangeReason || '',
        renewalTermYears: toNumber(rawTrademarkRecordation.renewalTermYears, 1),
        requiresAgent: Boolean(
          rawTrademarkRecordation.requiresAgent ||
          rawTrademarkRecordation.applicantRole === 'agent' ||
          primaryTrademark.agent?.name
        ),
        agentName: rawTrademarkRecordation.agentName || primaryTrademark.agent?.name || '',
        agentFirm: rawTrademarkRecordation.agentFirm || primaryTrademark.agent?.firm || '',
        agentEmail: rawTrademarkRecordation.agentEmail || primaryTrademark.agent?.email || '',
        agentPhone: rawTrademarkRecordation.agentPhone || primaryTrademark.agent?.phone || '',
        powerOfAttorneyNumber:
          rawTrademarkRecordation.powerOfAttorneyNumber ||
          primaryTrademark.agent?.powerOfAttorneyNumber ||
          '',
        notes: rawTrademarkRecordation.notes || '',
        declarationAccepted: Boolean(rawTrademarkRecordation.declarationAccepted),
        declarationName: rawTrademarkRecordation.declarationName || '',
        declarationTitle: rawTrademarkRecordation.declarationTitle || '',
        declarationDate: rawTrademarkRecordation.declarationDate || '',
        trademarks: rawTrademarkRows,
        attachments: mergedTrademarkAttachments,
        payment: {
          status: rawTrademarkRecordation.payment?.status || 'pending_control_number',
          controlNumber: rawTrademarkRecordation.payment?.controlNumber || form.paymentControlNumber || '',
          referenceNumber: rawTrademarkRecordation.payment?.referenceNumber || form.paymentReferenceNumber || '',
          amountPaid: toNumber(rawTrademarkRecordation.payment?.amountPaid || form.amountPaid, 0),
          paidAt: rawTrademarkRecordation.payment?.paidAt || '',
          receiptNumber: rawTrademarkRecordation.payment?.receiptNumber || '',
          proofFileName: rawTrademarkRecordation.payment?.proofFileName || ''
        }
      }
    : null

  const trademarkSubmissions = serviceKey === 'trademark-recordation'
    ? rawTrademarkRows.map((row, index) => ({
        submissionId: row.submissionId || `TM-SUB-${index + 1}`,
        trademarkName: row.trademarkName,
        purpose: trademarkPurpose,
        feeAmount: toNumber(row.feeAmount, trademarkFeePerSubmission),
        status: 'draft_submission',
        owner: row.owner || null,
        agent: row.agent || null,
        affiliatedCompanies: Array.isArray(row.affiliatedCompanies) ? row.affiliatedCompanies : [],
        manufacturers: Array.isArray(row.manufacturers) ? row.manufacturers : [],
        authorizedParties: Array.isArray(row.authorizedParties) ? row.authorizedParties : [],
        visuals: Array.isArray(row.visuals) ? row.visuals : [],
        attachments: Array.isArray(row.attachments) ? row.attachments : [],
        agentAffidavit: row.agentAffidavit || null,
        trademarkDraft: {
          draftId: row.submissionId || `TM-SUB-${index + 1}`,
          name: row.trademarkName,
          classOfGoods: row.classOfGoods,
          classNumber: row.classOfGoods,
          representationType: row.representationType,
          countryOfOrigin: row.countryOfOrigin,
          registrationReference: row.registrationReference,
          registrationCertificateNumber: row.registrationCertificateNumber,
          notes: row.notes || '',
          owner: row.owner || null,
          agent: row.agent || null,
          affiliatedCompanies: Array.isArray(row.affiliatedCompanies) ? row.affiliatedCompanies : [],
          manufacturers: Array.isArray(row.manufacturers) ? row.manufacturers : [],
          authorizedParties: Array.isArray(row.authorizedParties) ? row.authorizedParties : [],
          visuals: Array.isArray(row.visuals) ? row.visuals : [],
          attachments: Array.isArray(row.attachments) ? row.attachments : [],
          agentAffidavit: row.agentAffidavit || null
        }
      }))
    : []

  const trademarkVersions = Array.isArray(form.trademarkVersions)
    ? form.trademarkVersions
        .filter((item) => item && (item.markName || item.versionTag || item.purpose))
        .map((item, index) => ({
          versionId: item.versionId || `TM-V-${index + 1}`,
          markName: item.markName || '',
          versionTag: item.versionTag || '',
          purpose: item.purpose || 'Initial Filing',
          classCount: toNumber(item.classCount, 1),
          notes: item.notes || ''
        }))
    : []

  const contracts = Array.isArray(form.contracts)
    ? form.contracts
        .filter((item) => item && (item.contractName || item.contractCategory))
        .map((item, index) => ({
          contractId: item.contractId || `SFCC-C-${index + 1}`,
          contractName: item.contractName || '',
          contractCategory: item.contractCategory || '',
          language: item.language || 'English',
          pages: toNumber(item.pages, 1),
          notes: item.notes || ''
        }))
    : []

  const rawMergerClearance = form.mergerClearance || {}
  const mergerClearance = {
    transactionType: rawMergerClearance.transactionType || form.transactionType || '',
    transactionValue: toNumber(rawMergerClearance.transactionValue || form.transactionValue, 0),
    estimatedTurnover: toNumber(rawMergerClearance.estimatedTurnover || form.estimatedTurnover, 0),
    partiesInvolved: rawMergerClearance.partiesInvolved || form.partiesInvolved || '',
    targetFirmName: rawMergerClearance.targetFirmName || form.targetFirmName || '',
    targetFirmBusiness: rawMergerClearance.targetFirmBusiness || form.targetFirmBusiness || '',
    acquisitionDescription: rawMergerClearance.acquisitionDescription || form.acquisitionDescription || '',
    commercialRationale: rawMergerClearance.commercialRationale || form.commercialRationale || '',
    relevantMarketDefinition:
      rawMergerClearance.relevantMarketDefinition || form.relevantMarketDefinition || '',
    confidentialityClaimRequired: Boolean(
      rawMergerClearance.confidentialityClaimRequired || form.confidentialityClaimRequired
    ),
    confidentialityStatement:
      rawMergerClearance.confidentialityStatement || form.confidentialityStatement || ''
  }

  const fees = calculateServiceFees(serviceKey, {
    applicationFee: form.applicationFee,
    trademarkRecordation,
    trademarks: trademarkSubmissions,
    trademarkRequestType: trademarkRecordation?.requestType,
    trademarkVersions,
    contracts,
    mergerClearance,
    transactionValue: form.transactionValue
  })

  const applicant = {
    type: applicantType,
    businessDescription: form.businessDescription,
    email: form.contactEmail || user.email,
    phoneNumber: form.phoneNumber,
    postalAddress: form.postalAddress,
    physicalAddress: form.physicalAddress
  }

  if (applicantType === 'firm') {
    applicant.companyName = form.companyName
    applicant.registrationNumber = form.registrationNumber
    applicant.countryOfIncorporation = form.countryOfIncorporation
    applicant.contactPerson = {
      name: form.contactPersonName || fullName || form.contactName || 'Applicant Contact',
      email: form.contactPersonEmail || user.email || form.contactEmail,
      phoneNumber: form.contactPersonPhone || form.phoneNumber,
      firstName: form.contactPersonFirstName || firstName || undefined,
      surname: form.contactPersonSurname || surname || undefined
    }
  } else {
    applicant.firstName = form.firstName || firstName || ''
    applicant.surname = form.surname || surname || ''
    applicant.fullName = `${applicant.firstName} ${applicant.surname}`.trim()
    applicant.nationalId = form.nationalId || undefined
    applicant.countryOfResidence = form.countryOfResidence || 'Tanzania'
  }

  if (trademarkRecordation) {
    serviceDetails.requestType = trademarkRecordation.requestType
    serviceDetails.markName = trademarkRecordation.trademarkName
    serviceDetails.classNumber = trademarkRecordation.classOfGoods
    serviceDetails.representationType = trademarkRecordation.representationType
    serviceDetails.countryOfOrigin = trademarkRecordation.countryOfOrigin
    serviceDetails.registrationReference = trademarkRecordation.registrationReference
    serviceDetails.ownerCategory = trademarkRecordation.ownerCategory
    serviceDetails.trademarkRecordation = trademarkRecordation
    serviceDetails.trademarks = trademarkSubmissions
  }

  const paymentStatus = trademarkRecordation?.payment?.status || form.paymentStatus || 'Pending'
  const trademarkDomainPaymentStatus = normalizeTrademarkPaymentStatus(paymentStatus)
  const paymentControlNumber = trademarkRecordation?.payment?.controlNumber || form.paymentControlNumber || null
  const paymentReferenceNumber = trademarkRecordation?.payment?.referenceNumber || form.paymentReferenceNumber || null
  const paymentAmountPaid = trademarkRecordation
    ? toNumber(trademarkRecordation.payment?.amountPaid, 0)
    : toNumber(form.amountPaid, 0)
  const trademarkOverallPaymentStatus = trademarkDomainPaymentStatus === 'PARTIALLY_PAID'
    ? 'PARTIALLY_PAID'
    : trademarkDomainPaymentStatus === 'PAID'
      ? 'PAID'
      : 'UNPAID'
  const trademarkPaymentRegistration = serviceKey === 'trademark-recordation'
    ? {
        mode: 'APPLICATION',
        currency: 'TZS',
        totalExpectedAmount: fees.total,
        overallPaymentStatus: trademarkOverallPaymentStatus,
        applicationPayment: {
          expectedAmount: fees.total,
          amountPaid: paymentAmountPaid,
          isExactAmount: paymentAmountPaid === toNumber(fees.total, 0),
          controlNumber: paymentControlNumber || '',
          paymentDate: asIsoDate(trademarkRecordation?.payment?.paidAt),
          proofFileName: trademarkRecordation?.payment?.proofFileName || '',
          referenceNumber: paymentReferenceNumber || '',
          receiptNumber: trademarkRecordation?.payment?.receiptNumber || '',
          status: trademarkOverallPaymentStatus,
          mode: 'APPLICATION'
        },
        submissionPayments: trademarkSubmissions.map((row) => ({
          submissionId: row.submissionId,
          trademarkName: row.trademarkName,
          purpose: row.purpose,
          expectedAmount: toNumber(row.feeAmount, trademarkFeePerSubmission),
          amountPaid: trademarkOverallPaymentStatus === 'PAID' ? toNumber(row.feeAmount, trademarkFeePerSubmission) : 0,
          controlNumber: paymentControlNumber || '',
          paymentDate: asIsoDate(trademarkRecordation?.payment?.paidAt),
          proofFileName: trademarkRecordation?.payment?.proofFileName || '',
          status: trademarkOverallPaymentStatus === 'PAID' ? 'PAID' : 'UNPAID',
          mode: 'APPLICATION'
        }))
      }
    : null

  const payload = {
    applicationId: form.applicationId || undefined,
    service: serviceKey,
    status: form.status || 'draft',
    dateReceived: form.dateReceived,
    dateSubmitted: form.dateReceived,
    sector: form.sector,
    applicationFee: fees.total,
    fees,
    payment: {
      status: serviceKey === 'trademark-recordation' ? trademarkDomainPaymentStatus : paymentStatus,
      amountDue: fees.total,
      amountPaid: paymentAmountPaid,
      balance: Math.max(0, fees.total - paymentAmountPaid),
      controlNumber: paymentControlNumber,
      referenceNumber: paymentReferenceNumber
    },
    paymentStatus,
    purpose: serviceKey === 'trademark-recordation' ? trademarkPurpose : processName,
    serviceType: serviceKey,
    serviceKey,
    processName,
    processTemplateCode: template?.code || undefined,
    fileNumber: serviceKey === 'trademark-recordation' ? undefined : (form.fileNumber || undefined),
    financialYear: resolveFinancialYear(form.dateReceived),
    quarter: resolveQuarter(form.dateReceived),
    applicant,
    responsibleOfficer: form.responsibleOfficer || null,
    responsibleManager: form.responsibleManager || null,
    responsibleDirector: form.responsibleDirector || null,
    activity: form.activity || null,
    task: form.task || null,
    directorate: form.directorate || null,
    section: form.section || null,
    office: serviceKey === 'trademark-recordation' ? null : (form.office || null),
    reviewStages: Array.isArray(form.reviewStages) ? form.reviewStages : [],
    reviews: Array.isArray(form.reviews) ? form.reviews : [],
    reports: Array.isArray(form.reports) ? form.reports : [],
    submissions: Array.isArray(form.submissions) ? form.submissions : [],
    attachments: Array.isArray(form.attachments) ? form.attachments : [],
    auditTrail: Array.isArray(form.auditTrail) ? form.auditTrail : [],
    trademarkVersions,
    trademarkRecordation,
    trademarks: trademarkSubmissions,
    requestType: trademarkRecordation?.requestType || null,
    contracts,
    mergerClearance,
    serviceDetails,
    metadata: {
      serviceDetails,
      trademarkVersions,
      trademarkRecordation,
      trademarks: trademarkSubmissions,
      contracts,
      mergerClearance,
      fees,
      certificatePolicy: getCertificatePolicy(serviceKey)
    }
  }

  if (serviceKey === 'trademark-recordation') {
    payload.paymentMode = 'APPLICATION'
    payload.totalAmount = fees.total
    payload.overallPaymentStatus = trademarkOverallPaymentStatus
    payload.paymentRegistration = trademarkPaymentRegistration
    payload.applicationPayment = trademarkPaymentRegistration?.applicationPayment || null
    payload.submissionPayments = trademarkPaymentRegistration?.submissionPayments || []
  }

  return payload
}
