const TRADEMARK_REQUEST_TYPE_CONFIG = Object.freeze({
  new_recordation: {
    key: 'new_recordation',
    label: 'New Recordation (FCC 1)',
    shortLabel: 'New Recordation',
    description: 'Register a trademark for import-control recordation under FCC Form 1.',
    feeTzs: 200000,
    paymentRequired: true,
    requiredDocuments: [
      'fcc_1_form',
      'registration_certificate',
      'title_evidence',
      'trademark_visuals'
    ]
  },
  renewal: {
    key: 'renewal',
    label: 'Renewal',
    shortLabel: 'Renewal',
    description: 'Renew an existing recordation and extend validity.',
    feeTzs: 50000,
    paymentRequired: true,
    requiredDocuments: ['registration_certificate', 'renewal_supporting_evidence']
  },
  alteration: {
    key: 'alteration',
    label: 'Alteration / Amendment',
    shortLabel: 'Alteration',
    description: 'Update non-ownership details such as contact details or manufacturing site.',
    feeTzs: 100000,
    paymentRequired: true,
    requiredDocuments: ['registration_certificate', 'alteration_supporting_evidence']
  },
  ownership_change: {
    key: 'ownership_change',
    label: 'Ownership Change (FCC 2)',
    shortLabel: 'Ownership Change',
    description: 'Transfer trademark ownership to a new rights holder using FCC Form 2.',
    feeTzs: 150000,
    paymentRequired: true,
    requiredDocuments: [
      'fcc_2_form',
      'updated_registration_certificate',
      'transfer_documents'
    ]
  },
  name_change: {
    key: 'name_change',
    label: 'Name Change',
    shortLabel: 'Name Change',
    description: 'Update owner legal name without changing ownership rights.',
    feeTzs: 100000,
    paymentRequired: true,
    requiredDocuments: ['updated_registration_certificate', 'name_change_documents']
  },
  agent_appointment: {
    key: 'agent_appointment',
    label: 'Agent Appointment / Revocation',
    shortLabel: 'Agent Appointment',
    description: 'Appoint, update, or revoke an authorized trademark agent.',
    feeTzs: 0,
    paymentRequired: false,
    requiredDocuments: ['power_of_attorney']
  },
  discontinuation: {
    key: 'discontinuation',
    label: 'Discontinuation',
    shortLabel: 'Discontinuation',
    description: 'Request closure/discontinuation of a recorded trademark entry.',
    feeTzs: 0,
    paymentRequired: false,
    requiredDocuments: ['discontinuation_letter']
  }
})

const DOCUMENT_OPTIONS = Object.freeze([
  { key: 'fcc_1_form', label: 'Completed Form FCC 1' },
  { key: 'fcc_2_form', label: 'Completed Form FCC 2' },
  { key: 'registration_certificate', label: 'Certified Current Trademark Registration Certificate' },
  { key: 'updated_registration_certificate', label: 'Certified Updated Registration Certificate' },
  { key: 'title_evidence', label: 'Evidence of Title (Assignment / License / Succession)' },
  { key: 'trademark_visuals', label: 'Trademark Visuals (High-resolution Images)' },
  { key: 'renewal_supporting_evidence', label: 'Renewal Supporting Evidence' },
  { key: 'alteration_supporting_evidence', label: 'Alteration Supporting Evidence' },
  { key: 'transfer_documents', label: 'Ownership Transfer Documents' },
  { key: 'name_change_documents', label: 'Legal Name Change Documents' },
  { key: 'power_of_attorney', label: 'Power of Attorney / Authorization Letter' },
  { key: 'discontinuation_letter', label: 'Discontinuation Letter' },
  { key: 'proof_of_payment', label: 'Proof of Payment Receipt' },
  { key: 'other', label: 'Other Supporting Document' }
])

export const TRADEMARK_REQUEST_TYPE_OPTIONS = Object.freeze(
  Object.values(TRADEMARK_REQUEST_TYPE_CONFIG).map((item) => ({
    key: item.key,
    label: item.label,
    shortLabel: item.shortLabel,
    description: item.description,
    feeTzs: item.feeTzs,
    paymentRequired: item.paymentRequired
  }))
)

export const TRADEMARK_DOCUMENT_OPTIONS = DOCUMENT_OPTIONS

export function formatTzs(value = 0) {
  return `TZS ${Number(value || 0).toLocaleString()}`
}

export function getTrademarkRequestTypeConfig(requestType = 'new_recordation') {
  return TRADEMARK_REQUEST_TYPE_CONFIG[requestType] || TRADEMARK_REQUEST_TYPE_CONFIG.new_recordation
}

export function getTrademarkFeeByRequestType(requestType = 'new_recordation') {
  const config = getTrademarkRequestTypeConfig(requestType)
  return Number(config.feeTzs || 0)
}

export function isTrademarkPaymentRequired(requestType = 'new_recordation') {
  return Boolean(getTrademarkRequestTypeConfig(requestType).paymentRequired)
}

export function getTrademarkRequiredDocuments(requestType = 'new_recordation', options = {}) {
  const { includePaymentProof = false, requiresAgent = false } = options
  const config = getTrademarkRequestTypeConfig(requestType)
  const docs = new Set(config.requiredDocuments || [])

  if (requiresAgent) {
    docs.add('power_of_attorney')
  }

  if (includePaymentProof && config.paymentRequired) {
    docs.add('proof_of_payment')
  }

  return Array.from(docs).map((key) => DOCUMENT_OPTIONS.find((item) => item.key === key) || { key, label: key })
}

export function labelTrademarkRequestType(requestType = 'new_recordation') {
  return getTrademarkRequestTypeConfig(requestType).shortLabel
}

export const TRADEMARK_WIZARD_STEPS = Object.freeze([
  { key: 'request-type', label: 'Request Type' },
  { key: 'applicant-identity', label: 'Applicant Identity' },
  {
    key: 'trademark-registration',
    label: 'Trademark Registration',
    children: [
      { key: 'brand-owner', label: 'Brand Owner' },
      { key: 'trademark-details', label: 'Trademark Details' },
      { key: 'affiliated-companies', label: 'Affiliated Companies' },
      { key: 'manufacturers', label: 'Manufacturers' },
      { key: 'authorized-parties', label: 'Authorized Parties' },
      { key: 'trademark-visuals', label: 'Trademark Visuals' },
    ]
  },
  { key: 'request-details', label: 'Request Details' },
  { key: 'documents', label: 'Documents & Attachments' },
  { key: 'payment-declaration', label: 'Payment & Declaration' },
])

export const TRADEMARK_FLAT_STEP_KEYS = Object.freeze(
  TRADEMARK_WIZARD_STEPS.flatMap(step =>
    step.children?.length ? step.children.map(c => c.key) : [step.key]
  )
)

export function createTrademarkFormState() {
  return {
    requestType: 'new_recordation',
    applicantRole: 'brand_owner',
    applicantType: 'firm',
    companyName: '', registrationNumber: '', countryOfIncorporation: 'Tanzania',
    firstName: '', surname: '', nationalId: '', countryOfResidence: 'Tanzania',
    contactEmail: '', phoneNumber: '', postalAddress: '', physicalAddress: '',
    businessDescription: '',
    contactPersonName: '', contactPersonEmail: '', contactPersonPhone: '',
    requiresAgent: false,
    agentName: '', agentFirm: '', agentEmail: '', agentPhone: '', powerOfAttorneyNumber: '',
    owner: { ownerCategory: 'Corporate Owner', fullName: '', businessAddress: '', nationalityOrJurisdiction: '' },
    trademark: { trademarkName: '', classOfGoods: '', representationType: 'Combined Mark', countryOfOrigin: 'Tanzania', registrationReference: '', registrationCertificateNumber: '', notes: '' },
    affiliatedCompanies: [], manufacturers: [], authorizedParties: [], visuals: [],
    goodsManufacturePlaces: '', licensedUsers: '',
    currentRecordationNumber: '', alterationDetails: '',
    previousOwnerName: '', newOwnerName: '', transferReason: '', transferRightsSummary: '',
    previousLegalName: '', newLegalName: '', nameChangeReason: '',
    renewalTermYears: 1,
    attachments: [],
    notes: '',
    declarationAccepted: false, declarationName: '', declarationTitle: '',
    declarationDate: new Date().toISOString().slice(0, 10),
    payment: { status: 'pending_control_number', controlNumber: '', referenceNumber: '', amountPaid: 0, paidAt: '', receiptNumber: '' },
  }
}
