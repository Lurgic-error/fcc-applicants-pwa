import { labelTrademarkRequestType } from '@/constants/trademarkRecordation'

export const TRADEMARK_APPLICANT_STATUS_ORDER = Object.freeze([
  'Draft',
  'Submitted',
  'Under Review',
  'Query Raised',
  'Approved',
  'Rejected'
])

function normalizedText(value = '') {
  return String(value || '').trim().toLowerCase()
}

function mapApplicantStatus(stage = '', fallbackStatus = '') {
  const combined = `${normalizedText(stage)} ${normalizedText(fallbackStatus)}`

  if (!combined) {
    return 'Draft'
  }
  if (combined.includes('draft')) {
    return 'Draft'
  }
  if (combined.includes('query') || combined.includes('clarification') || combined.includes('returned')) {
    return 'Query Raised'
  }
  if (combined.includes('rejected')) {
    return 'Rejected'
  }
  if (combined.includes('approved') || combined.includes('issued') || combined.includes('recordation_issued')) {
    return 'Approved'
  }
  if (combined.includes('submitted') || combined.includes('application_submitted')) {
    return 'Submitted'
  }
  return 'Under Review'
}

function mapPaymentStatus(value = '') {
  const normalized = normalizedText(value)
  if (!normalized) return 'Pending'
  if (normalized.includes('paid') || normalized.includes('verified') || normalized === 'confirmed') {
    return 'Verified'
  }
  if (normalized.includes('control')) {
    return 'Control Number Issued'
  }
  if (normalized.includes('partial')) {
    return 'Partially Paid'
  }
  if (normalized.includes('unpaid') || normalized.includes('pending')) {
    return 'Pending Payment'
  }
  return value
}

function getApplicantDisplayName(applicant = {}) {
  return (
    applicant.companyName ||
    [applicant.firstName, applicant.surname].filter(Boolean).join(' ') ||
    applicant.contactPerson?.name ||
    'N/A'
  )
}

export function toTrademarkApplicantRow(application = {}) {
  const trademarkRecordation = application.trademarkRecordation || application.serviceDetails?.trademarkRecordation || {}
  const trademarks = Array.isArray(trademarkRecordation.trademarks)
    ? trademarkRecordation.trademarks.filter((row) => row && (row.trademarkName || row.markName))
    : []
  const primaryTrademark = trademarks[0] || {}
  const requestType = application.requestType || trademarkRecordation.requestType || 'new_recordation'
  const status = mapApplicantStatus(application.workflowStageKey, application.status)
  const paymentStatusRaw = trademarkRecordation.payment?.status || application.payment?.status || 'Pending'
  const trademarkName = primaryTrademark.trademarkName || trademarkRecordation.trademarkName || application.serviceDetails?.markName || 'N/A'
  const classOfGoods = primaryTrademark.classOfGoods || trademarkRecordation.classOfGoods || application.serviceDetails?.classNumber || 'N/A'
  const trademarkCount = trademarks.length || (trademarkName && trademarkName !== 'N/A' ? 1 : 0)

  return {
    applicationId: application.applicationId || application.id || 'N/A',
    requestType,
    requestTypeLabel: labelTrademarkRequestType(requestType),
    trademarkName: trademarkCount > 1 ? `${trademarkName} (+${trademarkCount - 1} more)` : trademarkName,
    classOfGoods,
    submittedAt: application.submittedAt || application.dateSubmitted || 'N/A',
    status,
    paymentStatus: mapPaymentStatus(paymentStatusRaw),
    certificateStatus: status === 'Approved' ? 'Available' : 'Not Available',
    reference: application.reference || application.fileNumber || application.applicationId || 'N/A',
    trademarkCount
  }
}

export function toTrademarkApplicantDetail(application = {}) {
  const trademarkRecordation = application.trademarkRecordation || application.serviceDetails?.trademarkRecordation || {}
  const applicant = application.raw?.applicant || application.applicant || {}
  const status = mapApplicantStatus(application.workflowStageKey, application.status)
  const stageHistory = Array.isArray(application.workflowStageHistory) ? application.workflowStageHistory : []
  const trademarks = Array.isArray(trademarkRecordation.trademarks)
    ? trademarkRecordation.trademarks.filter((row) => row && (row.trademarkName || row.markName))
    : []
  const primaryTrademark = trademarks[0] || {}
  const paymentStatusRaw = trademarkRecordation.payment?.status || application.payment?.status || 'Pending'
  const amountDue = Number(application.payment?.amountDue || application.fees?.total || 0)
  const amountPaid = Number(trademarkRecordation.payment?.amountPaid || application.payment?.amountPaid || 0)

  return {
    applicationId: application.applicationId || application.id || 'N/A',
    reference: application.reference || application.fileNumber || application.applicationId || 'N/A',
    status,
    submittedAt: application.submittedAt || 'N/A',
    requestType: trademarkRecordation.requestType || application.requestType || 'new_recordation',
    requestTypeLabel: labelTrademarkRequestType(trademarkRecordation.requestType || application.requestType || 'new_recordation'),
    trademarkName: primaryTrademark.trademarkName || trademarkRecordation.trademarkName || application.serviceDetails?.markName || 'N/A',
    classOfGoods: primaryTrademark.classOfGoods || trademarkRecordation.classOfGoods || application.serviceDetails?.classNumber || 'N/A',
    representationType: primaryTrademark.representationType || trademarkRecordation.representationType || application.serviceDetails?.representationType || 'N/A',
    countryOfOrigin: primaryTrademark.countryOfOrigin || trademarkRecordation.countryOfOrigin || application.serviceDetails?.countryOfOrigin || 'N/A',
    registrationReference: primaryTrademark.registrationReference || trademarkRecordation.registrationReference || application.serviceDetails?.registrationReference || 'N/A',
    trademarks: trademarks.length ? trademarks : [
      {
        submissionId: 'TM-SUB-1',
        trademarkName: trademarkRecordation.trademarkName || application.serviceDetails?.markName || 'N/A',
        classOfGoods: trademarkRecordation.classOfGoods || application.serviceDetails?.classNumber || 'N/A',
        representationType: trademarkRecordation.representationType || application.serviceDetails?.representationType || 'N/A',
        countryOfOrigin: trademarkRecordation.countryOfOrigin || application.serviceDetails?.countryOfOrigin || 'N/A',
        registrationReference: trademarkRecordation.registrationReference || application.serviceDetails?.registrationReference || 'N/A'
      }
    ],
    ownerName: trademarkRecordation.ownerFullName || getApplicantDisplayName(applicant),
    ownerAddress: trademarkRecordation.ownerBusinessAddress || applicant.physicalAddress || applicant.postalAddress || 'N/A',
    ownerJurisdiction: trademarkRecordation.ownerNationalityOrJurisdiction || applicant.countryOfIncorporation || applicant.countryOfResidence || 'N/A',
    applicantEmail: applicant.email || applicant.contactPerson?.email || 'N/A',
    applicantPhone: applicant.phoneNumber || applicant.contactPerson?.phoneNumber || 'N/A',
    paymentStatus: mapPaymentStatus(paymentStatusRaw),
    controlNumber: trademarkRecordation.payment?.controlNumber || application.payment?.controlNumber || '',
    paymentReference: trademarkRecordation.payment?.referenceNumber || application.payment?.referenceNumber || '',
    amountDue,
    amountPaid,
    balance: Math.max(0, amountDue - amountPaid),
    notes: trademarkRecordation.notes || '',
    documents: Array.isArray(trademarkRecordation.attachments) ? trademarkRecordation.attachments : [],
    certificates: Array.isArray(application.certificates) ? application.certificates : [],
    timeline: stageHistory.map((item) => ({
      stage: mapApplicantStatus(item.stage, item.stage),
      at: item.at || 'N/A',
      by: item.by || 'System'
    }))
  }
}

export const TRADEMARK_APPLICANT_PREVIEW_ROWS = Object.freeze([
  {
    applicationId: 'APP-TRM-2401',
    requestType: 'new_recordation',
    requestTypeLabel: 'New Recordation',
    trademarkName: 'SautiMax',
    classOfGoods: 'Class 9, 35',
    submittedAt: '2026-02-14',
    status: 'Under Review',
    paymentStatus: 'verified',
    certificateStatus: 'Not Available',
    reference: 'FCC-TM-1001'
  },
  {
    applicationId: 'APP-TRM-2402',
    requestType: 'renewal',
    requestTypeLabel: 'Renewal',
    trademarkName: 'AfyaMark',
    classOfGoods: 'Class 5',
    submittedAt: '2026-02-11',
    status: 'Submitted',
    paymentStatus: 'paid',
    certificateStatus: 'Not Available',
    reference: 'FCC-TM-1002'
  },
  {
    applicationId: 'APP-TRM-2403',
    requestType: 'ownership_change',
    requestTypeLabel: 'Ownership Change',
    trademarkName: 'Umoja Fresh',
    classOfGoods: 'Class 29',
    submittedAt: '2026-02-07',
    status: 'Query Raised',
    paymentStatus: 'control_number_issued',
    certificateStatus: 'Not Available',
    reference: 'FCC-TM-1003'
  },
  {
    applicationId: 'APP-TRM-2404',
    requestType: 'name_change',
    requestTypeLabel: 'Name Change',
    trademarkName: 'TenaTech',
    classOfGoods: 'Class 42',
    submittedAt: '2026-01-25',
    status: 'Approved',
    paymentStatus: 'verified',
    certificateStatus: 'Available',
    reference: 'FCC-TM-1004'
  }
])

export const TRADEMARK_APPLICANT_PREVIEW_DETAILS = Object.freeze({
  'APP-TRM-2401': {
    applicationId: 'APP-TRM-2401',
    reference: 'FCC-TM-1001',
    status: 'Under Review',
    submittedAt: '2026-02-14',
    requestType: 'new_recordation',
    requestTypeLabel: 'New Recordation',
    trademarkName: 'SautiMax',
    classOfGoods: 'Class 9, 35',
    representationType: 'Combined Mark',
    countryOfOrigin: 'Tanzania',
    registrationReference: 'BRELA-TM-2025-119',
    ownerName: 'Example Business Ltd',
    ownerAddress: 'P.O. Box 100, Dar es Salaam',
    ownerJurisdiction: 'Tanzania',
    applicantEmail: 'applicant@example.com',
    applicantPhone: '+255700000000',
    paymentStatus: 'verified',
    controlNumber: '991000122',
    paymentReference: 'GEPG-TRM-991000122',
    amountDue: 200000,
    amountPaid: 200000,
    balance: 0,
    notes: 'Awaiting final CI decision after technical verification.',
    documents: [
      { attachmentId: 'TM-ATT-1', documentType: 'fcc_1_form', fileName: 'fcc1-form.pdf', issuedDate: '2026-02-13' },
      { attachmentId: 'TM-ATT-2', documentType: 'registration_certificate', fileName: 'registration-certificate.pdf', issuedDate: '2025-12-20' },
      { attachmentId: 'TM-ATT-3', documentType: 'trademark_visuals', fileName: 'trademark-images.zip', issuedDate: '2026-02-13' }
    ],
    timeline: [
      { stage: 'Submitted', at: '2026-02-14', by: 'Applicant' },
      { stage: 'Under Review', at: '2026-02-16', by: 'FCC Reviewer' }
    ]
  },
  'APP-TRM-2402': {
    applicationId: 'APP-TRM-2402',
    reference: 'FCC-TM-1002',
    status: 'Submitted',
    submittedAt: '2026-02-11',
    requestType: 'renewal',
    requestTypeLabel: 'Renewal',
    trademarkName: 'AfyaMark',
    classOfGoods: 'Class 5',
    representationType: 'Word Mark',
    countryOfOrigin: 'Tanzania',
    registrationReference: 'BRELA-TM-2020-055',
    ownerName: 'Afya Supplies Limited',
    ownerAddress: 'P.O. Box 544, Dodoma',
    ownerJurisdiction: 'Tanzania',
    applicantEmail: 'afya@example.com',
    applicantPhone: '+255711111111',
    paymentStatus: 'paid',
    controlNumber: '991000133',
    paymentReference: 'GEPG-TRM-991000133',
    amountDue: 50000,
    amountPaid: 50000,
    balance: 0,
    notes: 'Renewal submitted before expiry window.',
    documents: [
      { attachmentId: 'TM-ATT-21', documentType: 'registration_certificate', fileName: 'afyamark-registration.pdf', issuedDate: '2025-11-20' },
      { attachmentId: 'TM-ATT-22', documentType: 'renewal_supporting_evidence', fileName: 'renewal-justification.pdf', issuedDate: '2026-02-10' }
    ],
    timeline: [{ stage: 'Submitted', at: '2026-02-11', by: 'Applicant' }]
  },
  'APP-TRM-2403': {
    applicationId: 'APP-TRM-2403',
    reference: 'FCC-TM-1003',
    status: 'Query Raised',
    submittedAt: '2026-02-07',
    requestType: 'ownership_change',
    requestTypeLabel: 'Ownership Change',
    trademarkName: 'Umoja Fresh',
    classOfGoods: 'Class 29',
    representationType: 'Word Mark',
    countryOfOrigin: 'Kenya',
    registrationReference: 'BRELA-TM-2019-404',
    ownerName: 'Umoja Foods Limited',
    ownerAddress: 'P.O. Box 402, Arusha',
    ownerJurisdiction: 'Tanzania',
    applicantEmail: 'umoja@example.com',
    applicantPhone: '+255722222222',
    paymentStatus: 'control_number_issued',
    controlNumber: '991000177',
    paymentReference: 'N/A',
    amountDue: 150000,
    amountPaid: 0,
    balance: 150000,
    notes: 'FCC requested certified transfer deed.',
    documents: [
      { attachmentId: 'TM-ATT-31', documentType: 'fcc_2_form', fileName: 'ownership-fcc2.pdf', issuedDate: '2026-02-07' },
      { attachmentId: 'TM-ATT-32', documentType: 'updated_registration_certificate', fileName: 'updated-registration.pdf', issuedDate: '2026-02-05' }
    ],
    timeline: [
      { stage: 'Submitted', at: '2026-02-07', by: 'Applicant' },
      { stage: 'Query Raised', at: '2026-02-10', by: 'FCC Reviewer' }
    ]
  },
  'APP-TRM-2404': {
    applicationId: 'APP-TRM-2404',
    reference: 'FCC-TM-1004',
    status: 'Approved',
    submittedAt: '2026-01-25',
    requestType: 'name_change',
    requestTypeLabel: 'Name Change',
    trademarkName: 'TenaTech',
    classOfGoods: 'Class 42',
    representationType: 'Combined Mark',
    countryOfOrigin: 'Tanzania',
    registrationReference: 'BRELA-TM-2021-812',
    ownerName: 'Tena Technologies PLC',
    ownerAddress: 'P.O. Box 900, Mwanza',
    ownerJurisdiction: 'Tanzania',
    applicantEmail: 'tena@example.com',
    applicantPhone: '+255733333333',
    paymentStatus: 'verified',
    controlNumber: '991000201',
    paymentReference: 'GEPG-TRM-991000201',
    amountDue: 100000,
    amountPaid: 100000,
    balance: 0,
    notes: 'Name change approved and certificate regenerated.',
    documents: [
      { attachmentId: 'TM-ATT-41', documentType: 'updated_registration_certificate', fileName: 'tenatech-updated-registration.pdf', issuedDate: '2026-01-23' },
      { attachmentId: 'TM-ATT-42', documentType: 'name_change_documents', fileName: 'name-change-gazette.pdf', issuedDate: '2026-01-20' }
    ],
    timeline: [
      { stage: 'Submitted', at: '2026-01-25', by: 'Applicant' },
      { stage: 'Under Review', at: '2026-01-27', by: 'FCC Reviewer' },
      { stage: 'Approved', at: '2026-02-02', by: 'Chief Inspector' }
    ]
  }
})
