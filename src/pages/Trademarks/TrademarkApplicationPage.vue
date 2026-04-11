<script setup>
// DEPRECATED: Replaced by TrademarkRecordationWizard.vue (2026-04-10)
// This file is kept for reference but is no longer routed to.
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getApplicationServiceByKey } from '@/constants/applicationCatalog'
import { getApplicationProcessName, getApplicationProcessStages } from '@/constants/applicationProcesses'
import { calculateServiceFees } from '@/constants/applicationServiceRules'
import {
  TRADEMARK_DOCUMENT_OPTIONS,
  TRADEMARK_REQUEST_TYPE_OPTIONS,
  formatTzs,
  getTrademarkRequiredDocuments,
  isTrademarkPaymentRequired,
  labelTrademarkRequestType
} from '@/constants/trademarkRecordation'
import TrademarkAttachmentManager from '@/components/trademark/TrademarkAttachmentManager.vue'
import TrademarkPaymentPanel from '@/components/trademark/TrademarkPaymentPanel.vue'
import TrademarkRequestTypeSelector from '@/components/trademark/TrademarkRequestTypeSelector.vue'
import TrademarkSubmissionsList from '@/components/trademark/TrademarkSubmissionsList.vue'
import CountrySelect from '@/components/forms/CountrySelect.vue'
import { useApplicantDataStore } from '@/stores/applications'
import { useAuthStore } from '@/stores/auth'

const SERVICE_KEY = 'trademark-recordation'

const props = defineProps({
  mode: {
    type: String,
    default: 'create'
  }
})

const route = useRoute()
const router = useRouter()
const dataStore = useApplicantDataStore()
const authStore = useAuthStore()

const formRef = ref(null)
const submitting = ref(false)
const loadingExisting = ref(false)
const stepIndex = ref(0)
const activeTrademarkIndex = ref(0)
const trademarkSectionIndex = ref(0)
const ownerMode = ref('different')
const showTrademarkList = ref(false)
const currentApplicationId = ref('')
const generatingControlNumber = ref(false)
const verifyingPayment = ref(false)
const uploadingProof = ref(false)
const selectedPaymentProofFile = ref(null)
const paymentVerificationFeedback = ref('')
const paymentVerificationFeedbackType = ref('info')

const service = computed(() => getApplicationServiceByKey(SERVICE_KEY))
const processName = computed(() => getApplicationProcessName(SERVICE_KEY))
const processStages = computed(() => getApplicationProcessStages(SERVICE_KEY))
const isEditMode = computed(() => props.mode === 'update')
const pageTitle = computed(() => `${isEditMode.value ? 'Update' : 'New'} ${service.value.label}`)
const effectiveApplicationId = computed(() =>
  isEditMode.value ? String(route.params.id || '') : String(currentApplicationId.value || '')
)

const wizardSteps = [
  { title: 'Request Type' },
  { title: 'Trademark Wizard' },
  { title: 'Request Details' },
  { title: 'Payment, Documents & Declaration' }
]

// ── Factories ────────────────────────────────────────────────────────────────

const TRADEMARK_SECTION_STEPS = Object.freeze([
  { key: 'basic', title: 'Basic' },
  { key: 'owner', title: 'Owner' },
  { key: 'manufacturers', title: 'Manufacturers' },
  { key: 'authorizedParties', title: 'Authorized Parties' },
  { key: 'affiliates', title: 'Affiliates' },
  { key: 'visuals', title: 'Visuals' },
  { key: 'attachments', title: 'Attachments' }
])

function createTrademarkAttachment() {
  return {
    attachmentId: '',
    documentType: '',
    fileName: '',
    referenceNumber: '',
    issuedBy: '',
    issuedDate: '',
    notes: ''
  }
}

function createTrademarkOwner() {
  return {
    ownerCategory: 'Corporate Owner',
    fullName: '',
    businessAddress: '',
    nationalityOrJurisdiction: ''
  }
}

function createTrademarkAgent() {
  return {
    name: '',
    firm: '',
    email: '',
    phone: '',
    powerOfAttorneyNumber: ''
  }
}

function createManufacturer() {
  return {
    name: '',
    address: '',
    country: '',
    contactName: '',
    contactPhone: '',
    notes: ''
  }
}

function createAuthorizedParty() {
  return {
    fullName: '',
    role: '',
    address: '',
    country: '',
    email: '',
    phone: '',
    notes: ''
  }
}

function createAffiliateCompany() {
  return {
    companyName: '',
    relationship: '',
    country: '',
    notes: ''
  }
}

function createTrademarkVisual() {
  return {
    visualType: '',
    description: '',
    fileName: '',
    colorClaim: '',
    notes: ''
  }
}

function createTrademarkEntry(index = 0) {
  return {
    submissionId: `TM-SUB-${index + 1}`,
    trademarkName: '',
    classOfGoods: '',
    representationType: 'Combined Mark',
    countryOfOrigin: 'Tanzania',
    registrationReference: '',
    registrationCertificateNumber: '',
    notes: '',
    owner: createTrademarkOwner(),
    agent: createTrademarkAgent(),
    manufacturers: [],
    authorizedParties: [],
    affiliatedCompanies: [],
    visuals: [],
    attachments: []
  }
}

function createTrademarkRecordation() {
  return {
    requestType: 'new_recordation',
    trademarkName: '',
    classOfGoods: '',
    representationType: 'Combined Mark',
    countryOfOrigin: 'Tanzania',
    registrationReference: '',
    registrationCertificateNumber: '',
    trademarks: [createTrademarkEntry(0)],
    applicantRole: 'brand_owner',
    ownerCategory: 'Corporate Owner',
    ownerFullName: '',
    ownerBusinessAddress: '',
    ownerNationalityOrJurisdiction: '',
    goodsManufacturePlaces: '',
    licensedUsers: '',
    affiliatedCompanies: '',
    currentRecordationNumber: '',
    alterationDetails: '',
    previousOwnerName: '',
    newOwnerName: '',
    transferReason: '',
    transferRightsSummary: '',
    previousLegalName: '',
    newLegalName: '',
    nameChangeReason: '',
    renewalTermYears: 1,
    requiresAgent: false,
    agentName: '',
    agentFirm: '',
    agentEmail: '',
    agentPhone: '',
    powerOfAttorneyNumber: '',
    notes: '',
    declarationAccepted: false,
    declarationName: '',
    declarationTitle: '',
    declarationDate: new Date().toISOString().slice(0, 10),
    attachments: [createTrademarkAttachment()],
    payment: {
      status: 'pending_control_number',
      controlNumber: '',
      referenceNumber: '',
      amountPaid: 0,
      paidAt: '',
      receiptNumber: '',
      proofFileName: ''
    }
  }
}

// ── Reactive form ─────────────────────────────────────────────────────────────

const form = reactive({
  dateReceived: new Date().toISOString().slice(0, 10),
  sector: '',
  applicationFee: 0,
  contactEmail: '',
  phoneNumber: '',
  requestType: 'new_recordation',
  trademarkRecordation: createTrademarkRecordation()
})

// ── Computed ──────────────────────────────────────────────────────────────────

const calculatedFees = computed(() =>
  calculateServiceFees(SERVICE_KEY, {
    applicationFee: form.applicationFee,
    trademarkRecordation: form.trademarkRecordation,
    trademarkRequestType: form.trademarkRecordation?.requestType
  })
)

const trademarkRequestOptions = TRADEMARK_REQUEST_TYPE_OPTIONS
const trademarkAttachmentOptions = TRADEMARK_DOCUMENT_OPTIONS.filter(
  (item) => !['fcc_1_form', 'fcc_2_form'].includes(String(item.key || '').toLowerCase())
)

const trademarkDocuments = computed(() =>
  getTrademarkRequiredDocuments(form.trademarkRecordation.requestType, {
    includePaymentProof: isTrademarkPaymentRequired(form.trademarkRecordation.requestType),
    requiresAgent: Boolean(form.trademarkRecordation.requiresAgent)
  }).filter((doc) => !['fcc_1_form', 'fcc_2_form'].includes(String(doc.key || '').toLowerCase()))
)

const trademarkPaymentRequired = computed(() =>
  isTrademarkPaymentRequired(form.trademarkRecordation.requestType)
)

const hasControlNumber = computed(() =>
  Boolean(String(form.trademarkRecordation.payment?.controlNumber || '').trim())
)

const isPaymentMarkedComplete = computed(() => {
  const status = String(form.trademarkRecordation.payment?.status || '').toLowerCase()
  const expected = Number(calculatedFees.value.total || 0)
  const paid = Number(form.trademarkRecordation.payment?.amountPaid || 0)
  return ['paid', 'verified'].includes(status) && paid >= expected
})

const submitButtonLabel = computed(() => {
  if (!trademarkPaymentRequired.value) {
    return 'Submit Application'
  }
  if (!hasControlNumber.value) {
    return 'Save Draft & Get Control Number'
  }
  if (!isPaymentMarkedComplete.value) {
    return 'Save Draft'
  }
  return 'Submit Application'
})

const trademarkSectionSteps = TRADEMARK_SECTION_STEPS

const activeTrademark = computed(() => {
  const rows = Array.isArray(form.trademarkRecordation.trademarks)
    ? form.trademarkRecordation.trademarks
    : []
  if (!rows.length) return null
  const index = Math.max(0, Math.min(activeTrademarkIndex.value, rows.length - 1))
  if (index !== activeTrademarkIndex.value) {
    activeTrademarkIndex.value = index
  }
  return rows[index]
})

const currentTrademarkSection = computed(() =>
  trademarkSectionSteps[Math.max(0, Math.min(trademarkSectionIndex.value, trademarkSectionSteps.length - 1))] || trademarkSectionSteps[0]
)

// ── Validation rules ──────────────────────────────────────────────────────────

const rules = computed(() => ({
  dateReceived: [{ required: true, message: 'Submission date is required', trigger: 'change' }],
  sector: [{ required: true, message: 'Sector is required', trigger: 'blur' }],
  contactEmail: [{ required: true, type: 'email', message: 'Contact email is required', trigger: 'blur' }],
  phoneNumber: [{ required: true, message: 'Contact phone number is required', trigger: 'blur' }],
  'trademarkRecordation.requestType': [{ required: true, message: 'Request type is required', trigger: 'change' }],
  'trademarkRecordation.agentEmail': [
    {
      validator: (_rule, value, callback) => {
        if (form.trademarkRecordation.requiresAgent && value && !String(value).includes('@')) {
          callback(new Error('Enter a valid agent email.'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  'trademarkRecordation.payment.controlNumber': [
    {
      validator: (_rule, value, callback) => {
        const paymentStatus = String(form.trademarkRecordation.payment?.status || '').toLowerCase()
        const isPaidFlow = ['paid', 'verified'].includes(paymentStatus)
        if (trademarkPaymentRequired.value && isPaidFlow && !String(value || '').trim()) {
          callback(new Error('Payment control number is required when payment is marked paid/verified.'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  'trademarkRecordation.payment.amountPaid': [
    {
      validator: (_rule, value, callback) => {
        const paid = Number(value || 0)
        const expected = Number(calculatedFees.value.total || 0)
        const paymentStatus = String(form.trademarkRecordation.payment?.status || '').toLowerCase()
        const isPaidFlow = ['paid', 'verified'].includes(paymentStatus)
        if (trademarkPaymentRequired.value && isPaidFlow && paid < expected) {
          callback(new Error(`Paid amount must be at least ${formatTzs(expected)}.`))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  'trademarkRecordation.declarationAccepted': [
    {
      validator: (_rule, value, callback) => {
        if (!value) {
          callback(new Error('Accept declaration before submission.'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ]
}))

// ── Per-step field map (for partial validation) ───────────────────────────────

const stepFieldMap = [
  ['dateReceived', 'sector', 'trademarkRecordation.requestType'],
  [
    'contactEmail',
    'phoneNumber'
  ],
  [],
  [
    'trademarkRecordation.payment.controlNumber',
    'trademarkRecordation.payment.amountPaid',
    'trademarkRecordation.declarationAccepted'
  ]
]

// ── Data mapping (edit mode) ──────────────────────────────────────────────────

function mapApplicationToForm(application) {
  const raw = application?.raw || {}
  const applicant = raw.applicant || {}
  const serviceDetails = raw.serviceDetails || raw.metadata?.serviceDetails || {}

  const mappedTrademarkRecordation =
    raw.trademarkRecordation ||
    serviceDetails.trademarkRecordation ||
    {
      ...createTrademarkRecordation(),
      requestType: serviceDetails.requestType || raw.requestType || 'new_recordation',
      trademarkName: serviceDetails.markName || raw.markName || '',
      classOfGoods: serviceDetails.classNumber || raw.classNumber || '',
      representationType: serviceDetails.representationType || raw.representationType || 'Combined Mark',
      countryOfOrigin: serviceDetails.countryOfOrigin || raw.countryOfOrigin || 'Tanzania',
      registrationReference: serviceDetails.registrationReference || raw.registrationReference || ''
    }

  const mappedTrademarkRows = Array.isArray(mappedTrademarkRecordation.trademarks) && mappedTrademarkRecordation.trademarks.length
    ? mappedTrademarkRecordation.trademarks
        .map((row, index) => ({
          ...createTrademarkEntry(index),
          ...row,
          submissionId: row.submissionId || row.draftId || `TM-SUB-${index + 1}`
        }))
        .filter((row) => String(row.trademarkName || row.markName || '').trim())
    : Array.isArray(raw.trademarks) && raw.trademarks.length
      ? raw.trademarks
          .map((row, index) => ({
            ...createTrademarkEntry(index),
            submissionId: row.submissionId || row.draftId || `TM-SUB-${index + 1}`,
            trademarkName: row.trademarkName || row?.trademarkDraft?.name || '',
            classOfGoods: row.classOfGoods || row?.trademarkDraft?.classOfGoods || row?.trademarkDraft?.classNumber || '',
            representationType: row.representationType || row?.trademarkDraft?.representationType || 'Combined Mark',
            countryOfOrigin: row.countryOfOrigin || row?.trademarkDraft?.countryOfOrigin || 'Tanzania',
            registrationReference: row.registrationReference || row?.trademarkDraft?.registrationReference || '',
            registrationCertificateNumber: row.registrationCertificateNumber || row?.trademarkDraft?.registrationCertificateNumber || '',
            notes: row.notes || row?.trademarkDraft?.notes || ''
          }))
          .filter((row) => String(row.trademarkName || '').trim())
      : [
          {
            ...createTrademarkEntry(0),
            trademarkName: mappedTrademarkRecordation.trademarkName || '',
            classOfGoods: mappedTrademarkRecordation.classOfGoods || '',
            representationType: mappedTrademarkRecordation.representationType || 'Combined Mark',
            countryOfOrigin: mappedTrademarkRecordation.countryOfOrigin || 'Tanzania',
            registrationReference: mappedTrademarkRecordation.registrationReference || '',
            registrationCertificateNumber: mappedTrademarkRecordation.registrationCertificateNumber || '',
            notes: mappedTrademarkRecordation.notes || ''
          }
        ].filter((row) => String(row.trademarkName || '').trim())

  const normalizedMappedRows = (mappedTrademarkRows.length ? mappedTrademarkRows : [createTrademarkEntry(0)])
    .map((row, index) => normalizeTrademarkEntry(row, index))

  Object.assign(form, {
    dateReceived: raw.dateReceived || application.submittedAt || form.dateReceived,
    sector: raw.sector || '',
    applicationFee: Number(raw.applicationFee || application?.fees?.total || 0) || 0,
    contactEmail: applicant.email || applicant.contactPerson?.email || authStore.email || '',
    phoneNumber: applicant.phoneNumber || applicant.contactPerson?.phoneNumber || '',
    requestType: mappedTrademarkRecordation.requestType || 'new_recordation',
    trademarkRecordation: {
      ...createTrademarkRecordation(),
      ...mappedTrademarkRecordation,
      trademarks: normalizedMappedRows,
      attachments: Array.isArray(mappedTrademarkRecordation.attachments) && mappedTrademarkRecordation.attachments.length
        ? mappedTrademarkRecordation.attachments
        : [createTrademarkAttachment()],
      payment: {
        ...createTrademarkRecordation().payment,
        ...(mappedTrademarkRecordation.payment || {}),
        amountPaid: Number(mappedTrademarkRecordation.payment?.amountPaid || raw.payment?.amountPaid || 0) || 0,
        proofFileName:
          mappedTrademarkRecordation.payment?.proofFileName ||
          raw.payment?.proofFileName ||
          ''
      }
    }
  })

  currentApplicationId.value = String(application?.applicationId || currentApplicationId.value || '')
  activeTrademarkIndex.value = 0
  trademarkSectionIndex.value = 0
  applyApplicantRoleDefaults(activeTrademark.value)
}

// ── Trademark row management ──────────────────────────────────────────────────

function normalizeTrademarkEntry(row = {}, index = 0) {
  return {
    ...createTrademarkEntry(index),
    ...row,
    submissionId: row.submissionId || row.draftId || `TM-SUB-${index + 1}`,
    owner: {
      ...createTrademarkOwner(),
      ...(row.owner || {}),
      ownerCategory: row.owner?.ownerCategory || row.ownerCategory || 'Corporate Owner',
      fullName: row.owner?.fullName || row.ownerFullName || '',
      businessAddress: row.owner?.businessAddress || row.ownerBusinessAddress || '',
      nationalityOrJurisdiction: row.owner?.nationalityOrJurisdiction || row.ownerNationalityOrJurisdiction || ''
    },
    agent: {
      ...createTrademarkAgent(),
      ...(row.agent || {}),
      name: row.agent?.name || row.agentName || '',
      firm: row.agent?.firm || row.agentFirm || '',
      email: row.agent?.email || row.agentEmail || '',
      phone: row.agent?.phone || row.agentPhone || '',
      powerOfAttorneyNumber: row.agent?.powerOfAttorneyNumber || row.powerOfAttorneyNumber || ''
    },
    manufacturers: Array.isArray(row.manufacturers) ? row.manufacturers.map((item) => ({ ...createManufacturer(), ...(item || {}) })) : [],
    authorizedParties: Array.isArray(row.authorizedParties) ? row.authorizedParties.map((item) => ({ ...createAuthorizedParty(), ...(item || {}) })) : [],
    affiliatedCompanies: Array.isArray(row.affiliatedCompanies) ? row.affiliatedCompanies.map((item) => ({ ...createAffiliateCompany(), ...(item || {}) })) : [],
    visuals: Array.isArray(row.visuals) ? row.visuals.map((item) => ({ ...createTrademarkVisual(), ...(item || {}) })) : [],
    attachments: Array.isArray(row.attachments) ? row.attachments.map((item, itemIndex) => ({ ...createTrademarkAttachment(), attachmentId: item.attachmentId || `TM-ATT-${index + 1}-${itemIndex + 1}`, ...(item || {}) })) : []
  }
}

function ensureTrademarkRowsNormalized() {
  const rows = Array.isArray(form.trademarkRecordation.trademarks)
    ? form.trademarkRecordation.trademarks
    : []
  if (!rows.length) {
    form.trademarkRecordation.trademarks = [createTrademarkEntry(0)]
    return
  }
  form.trademarkRecordation.trademarks = rows.map((row, index) => normalizeTrademarkEntry(row, index))
}

function resolveApplicantIdentity() {
  const profile = authStore.profile || {}
  const user = authStore.user || {}
  const companyName = String(profile.companyName || profile.applicant?.companyName || '').trim()
  const fullName = String(authStore.fullName || user.fullName || '').trim()
  const displayName = companyName || fullName || 'Applicant'

  return {
    displayName,
    companyName,
    fullName,
    email: String(authStore.email || profile.email || user.email || '').trim(),
    phone: String(profile.phoneNumber || profile.applicant?.phoneNumber || user.phoneNumber || '').trim(),
    address: String(profile.physicalAddress || profile.applicant?.physicalAddress || '').trim(),
    jurisdiction: String(profile.countryOfIncorporation || profile.countryOfResidence || 'Tanzania').trim()
  }
}

function applyApplicantRoleDefaults(row) {
  if (!row) return
  const identity = resolveApplicantIdentity()
  const role = String(form.trademarkRecordation.applicantRole || 'brand_owner')

  if (role === 'brand_owner') {
    if (!String(row.owner.fullName || '').trim()) row.owner.fullName = identity.displayName
    if (!String(row.owner.businessAddress || '').trim()) row.owner.businessAddress = identity.address
    if (!String(row.owner.nationalityOrJurisdiction || '').trim()) row.owner.nationalityOrJurisdiction = identity.jurisdiction
  } else {
    form.trademarkRecordation.requiresAgent = true
    if (!String(row.agent.name || '').trim()) row.agent.name = identity.fullName || identity.displayName
    if (!String(row.agent.firm || '').trim()) row.agent.firm = identity.companyName || ''
    if (!String(row.agent.email || '').trim()) row.agent.email = identity.email
    if (!String(row.agent.phone || '').trim()) row.agent.phone = identity.phone
  }
}

function addArrayItemToActiveTrademark(field, factory) {
  const row = activeTrademark.value
  if (!row) return
  if (!Array.isArray(row[field])) row[field] = []
  row[field].push(factory())
}

function removeArrayItemFromActiveTrademark(field, index) {
  const row = activeTrademark.value
  if (!row || !Array.isArray(row[field])) return
  row[field].splice(index, 1)
}

function goToPreviousTrademarkSection() {
  trademarkSectionIndex.value = Math.max(0, trademarkSectionIndex.value - 1)
}

function goToNextTrademarkSection() {
  trademarkSectionIndex.value = Math.min(trademarkSectionSteps.length - 1, trademarkSectionIndex.value + 1)
}

function addTrademarkRow() {
  ensureTrademarkRowsNormalized()
  const rows = Array.isArray(form.trademarkRecordation.trademarks) ? form.trademarkRecordation.trademarks : []
  rows.push(createTrademarkEntry(rows.length))
  form.trademarkRecordation.trademarks = rows.map((row, index) => normalizeTrademarkEntry(row, index))
  activeTrademarkIndex.value = Math.max(0, form.trademarkRecordation.trademarks.length - 1)
  trademarkSectionIndex.value = 0
  ownerMode.value = 'different'
  showTrademarkList.value = false
  applyApplicantRoleDefaults(activeTrademark.value)
}

function copyOwnerFromFirst() {
  const rows = form.trademarkRecordation.trademarks
  if (!rows || rows.length < 2) return
  const firstOwner = rows[0]?.owner
  if (!firstOwner) return
  const current = activeTrademark.value
  if (!current) return
  current.owner = { ...firstOwner }
}

function handleOwnerModeChange(mode) {
  ownerMode.value = mode
  if (mode === 'same') {
    copyOwnerFromFirst()
  }
}

function handleTrademarkListEdit(index) {
  activeTrademarkIndex.value = index
  trademarkSectionIndex.value = 0
  ownerMode.value = 'different'
  showTrademarkList.value = false
}

function handleTrademarkListRemove(index) {
  removeTrademarkRow(index)
  if (showTrademarkList.value && form.trademarkRecordation.trademarks.length === 0) {
    showTrademarkList.value = false
  }
}

function handleTrademarkListAdd() {
  addTrademarkRow()
}

function removeTrademarkRow(index) {
  const rows = Array.isArray(form.trademarkRecordation.trademarks)
    ? [...form.trademarkRecordation.trademarks]
    : []
  rows.splice(index, 1)
  form.trademarkRecordation.trademarks = (rows.length ? rows : [createTrademarkEntry(0)]).map((row, rowIndex) =>
    normalizeTrademarkEntry(row, rowIndex)
  )
  activeTrademarkIndex.value = Math.max(0, Math.min(activeTrademarkIndex.value, form.trademarkRecordation.trademarks.length - 1))
  applyApplicantRoleDefaults(activeTrademark.value)
}

function normalizeControlNumber(record = {}) {
  return String(
    record?.trademarkRecordation?.payment?.controlNumber ||
    record?.paymentRegistration?.controlNumber ||
    record?.payment?.controlNumber ||
    form.trademarkRecordation.payment?.controlNumber ||
    ''
  ).trim()
}

function normalizePaymentProofFileName(uploadedAttachment = {}, fallback = '') {
  return (
    uploadedAttachment?.fileName ||
    uploadedAttachment?.filename ||
    uploadedAttachment?.title ||
    fallback ||
    ''
  )
}

function normalizeTrademarkRowsForSave() {
  ensureTrademarkRowsNormalized()
  const rows = Array.isArray(form.trademarkRecordation.trademarks)
    ? form.trademarkRecordation.trademarks.filter((row) => row && String(row.trademarkName || '').trim())
    : []
  if (!rows.length) {
    throw new Error('Add at least one trademark before saving.')
  }

  const primaryTrademark = rows[0]
  form.trademarkRecordation.trademarks = rows
  form.trademarkRecordation.trademarkName = primaryTrademark.trademarkName
  form.trademarkRecordation.classOfGoods = primaryTrademark.classOfGoods
  form.trademarkRecordation.representationType = primaryTrademark.representationType
  form.trademarkRecordation.countryOfOrigin = primaryTrademark.countryOfOrigin
  form.trademarkRecordation.registrationReference = primaryTrademark.registrationReference
  form.trademarkRecordation.registrationCertificateNumber = primaryTrademark.registrationCertificateNumber
  form.trademarkRecordation.ownerCategory = primaryTrademark.owner?.ownerCategory || form.trademarkRecordation.ownerCategory
  form.trademarkRecordation.ownerFullName = primaryTrademark.owner?.fullName || form.trademarkRecordation.ownerFullName
  form.trademarkRecordation.ownerBusinessAddress = primaryTrademark.owner?.businessAddress || form.trademarkRecordation.ownerBusinessAddress
  form.trademarkRecordation.ownerNationalityOrJurisdiction =
    primaryTrademark.owner?.nationalityOrJurisdiction || form.trademarkRecordation.ownerNationalityOrJurisdiction
  form.trademarkRecordation.agentName = primaryTrademark.agent?.name || form.trademarkRecordation.agentName
  form.trademarkRecordation.agentFirm = primaryTrademark.agent?.firm || form.trademarkRecordation.agentFirm
  form.trademarkRecordation.agentEmail = primaryTrademark.agent?.email || form.trademarkRecordation.agentEmail
  form.trademarkRecordation.agentPhone = primaryTrademark.agent?.phone || form.trademarkRecordation.agentPhone
  form.trademarkRecordation.powerOfAttorneyNumber =
    primaryTrademark.agent?.powerOfAttorneyNumber || form.trademarkRecordation.powerOfAttorneyNumber
  form.trademarkRecordation.requiresAgent =
    form.trademarkRecordation.applicantRole === 'agent' ||
    Boolean(primaryTrademark.agent?.name || form.trademarkRecordation.requiresAgent)
  form.trademarkRecordation.goodsManufacturePlaces = rows
    .flatMap((row) => (Array.isArray(row.manufacturers) ? row.manufacturers : []))
    .map((item) => String(item?.name || '').trim())
    .filter(Boolean)
    .join('; ')
  form.trademarkRecordation.licensedUsers = rows
    .flatMap((row) => (Array.isArray(row.authorizedParties) ? row.authorizedParties : []))
    .map((item) => String(item?.fullName || '').trim())
    .filter(Boolean)
    .join('; ')
  form.trademarkRecordation.affiliatedCompanies = rows
    .flatMap((row) => (Array.isArray(row.affiliatedCompanies) ? row.affiliatedCompanies : []))
    .map((item) => String(item?.companyName || '').trim())
    .filter(Boolean)
    .join('; ')

  const perTrademarkAttachments = rows.flatMap((row, rowIndex) => (
    Array.isArray(row.attachments)
      ? row.attachments
          .filter((item) => item && (item.documentType || item.fileName))
          .map((item, attachmentIndex) => ({
            ...createTrademarkAttachment(),
            attachmentId: item.attachmentId || `TM-ATT-${rowIndex + 1}-${attachmentIndex + 1}`,
            ...item
          }))
      : []
  ))

  const existingTopLevelAttachments = Array.isArray(form.trademarkRecordation.attachments)
    ? form.trademarkRecordation.attachments
        .filter((item) => item && (item.documentType || item.fileName || item.referenceNumber))
        .map((item, index) => ({
          ...createTrademarkAttachment(),
          attachmentId: item.attachmentId || `TM-GATT-${index + 1}`,
          ...item
        }))
    : []

  const mergedAttachments = [...existingTopLevelAttachments, ...perTrademarkAttachments].filter((item, index, list) => {
    const signature = `${String(item.documentType || '').trim().toLowerCase()}|${String(item.fileName || '').trim().toLowerCase()}|${String(item.referenceNumber || '').trim().toLowerCase()}`
    return list.findIndex((row) => `${String(row.documentType || '').trim().toLowerCase()}|${String(row.fileName || '').trim().toLowerCase()}|${String(row.referenceNumber || '').trim().toLowerCase()}` === signature) === index
  })

  form.trademarkRecordation.attachments = mergedAttachments
  form.requestType = form.trademarkRecordation.requestType
}

async function persistDraft() {
  normalizeTrademarkRowsForSave()
  const payload = { ...form }
  const draftId = effectiveApplicationId.value

  const persisted = draftId
    ? await dataStore.updateApplication(draftId, payload, { serviceKey: SERVICE_KEY })
    : await dataStore.submitApplication(payload, { serviceKey: SERVICE_KEY })

  currentApplicationId.value = String(persisted?.applicationId || currentApplicationId.value || '')
  return persisted
}

async function generateControlNumber() {
  if (!trademarkPaymentRequired.value) return null

  generatingControlNumber.value = true
  try {
    const persisted = await persistDraft()
    const existingControl = normalizeControlNumber(persisted)
    if (existingControl) {
      form.trademarkRecordation.payment.controlNumber = existingControl
      paymentVerificationFeedbackType.value = 'success'
      paymentVerificationFeedback.value = `Control number ready: ${existingControl}`
      return existingControl
    }

    const updated = await dataStore.generateTrademarkControlNumber(persisted.applicationId)
    mapApplicationToForm(updated)
    const generatedControl = normalizeControlNumber(updated)
    if (!generatedControl) {
      throw new Error('Control number was not returned. Please try again.')
    }
    paymentVerificationFeedbackType.value = 'success'
    paymentVerificationFeedback.value = `Control number generated: ${generatedControl}`
    ElMessage.success('Control number generated successfully.')
    return generatedControl
  } finally {
    generatingControlNumber.value = false
  }
}

function onPaymentProofFileChange(file) {
  selectedPaymentProofFile.value = file?.raw || null
  if (selectedPaymentProofFile.value?.name) {
    form.trademarkRecordation.payment.proofFileName = selectedPaymentProofFile.value.name
  }
}

async function uploadPaymentProofIfSelected(applicationId) {
  if (!selectedPaymentProofFile.value) {
    return String(form.trademarkRecordation.payment?.proofFileName || '').trim()
  }

  uploadingProof.value = true
  try {
    const uploaded = await dataStore.uploadTrademarkPaymentProof(
      applicationId,
      selectedPaymentProofFile.value,
      {
        title: 'Payment proof (GePG)',
        description: 'Applicant uploaded payment proof during self-service verification.'
      }
    )
    const proofFileName = normalizePaymentProofFileName(uploaded, selectedPaymentProofFile.value.name)
    form.trademarkRecordation.payment.proofFileName = proofFileName
    return proofFileName
  } finally {
    uploadingProof.value = false
  }
}

async function verifyPaymentViaGePG({ silent = false } = {}) {
  if (!trademarkPaymentRequired.value) {
    return { verified: true }
  }

  const controlNumber = String(form.trademarkRecordation.payment?.controlNumber || '').trim()
  if (!controlNumber) {
    throw new Error('Generate control number first, then pay before verification.')
  }
  if (!effectiveApplicationId.value) {
    throw new Error('Save application draft first before payment verification.')
  }

  verifyingPayment.value = true
  try {
    const verification = await dataStore.verifyTrademarkPaymentByControlNumber(controlNumber, {
      applicationId: effectiveApplicationId.value
    })
    const billStatus = String(verification?.billStatus || '').toLowerCase()
    const expectedAmount = Number(calculatedFees.value.total || 0)
    const paidAmount = Number(verification?.amountPaid || 0)
    const hasPaidEvent = ['paid', 'partially_paid'].includes(billStatus) && paidAmount > 0

    form.trademarkRecordation.payment.status = hasPaidEvent ? 'verified' : 'control_number_issued'
    form.trademarkRecordation.payment.amountPaid = paidAmount
    if (verification?.referenceNumber) {
      form.trademarkRecordation.payment.referenceNumber = verification.referenceNumber
    }
    if (verification?.receiptNumber) {
      form.trademarkRecordation.payment.receiptNumber = verification.receiptNumber
    }
    if (verification?.paidAt) {
      form.trademarkRecordation.payment.paidAt = verification.paidAt
    }

    if (!hasPaidEvent) {
      const message = 'Payment not yet visible in GePG. Please try verification again after payment posts.'
      paymentVerificationFeedbackType.value = 'warning'
      paymentVerificationFeedback.value = message
      if (!silent) ElMessage.warning(message)
      return { verified: false, verification }
    }

    if (paidAmount < expectedAmount) {
      const message = `GePG confirms partial payment (${formatTzs(paidAmount)}). Expected ${formatTzs(expectedAmount)}.`
      paymentVerificationFeedbackType.value = 'warning'
      paymentVerificationFeedback.value = message
      if (!silent) ElMessage.warning(message)
      return { verified: false, verification }
    }

    const proofFileName = await uploadPaymentProofIfSelected(effectiveApplicationId.value)
    const confirmed = await dataStore.confirmTrademarkPayment(effectiveApplicationId.value, {
      amountPaid: paidAmount,
      referenceNumber: form.trademarkRecordation.payment.referenceNumber || '',
      receiptNumber: form.trademarkRecordation.payment.receiptNumber || '',
      paidAt: form.trademarkRecordation.payment.paidAt || new Date().toISOString().slice(0, 10),
      proofFileName,
      notes: 'Payment verified via GePG control number lookup.'
    })
    mapApplicationToForm(confirmed)

    const successMessage = 'Payment verified via GePG.'
    paymentVerificationFeedbackType.value = 'success'
    paymentVerificationFeedback.value = successMessage
    if (!silent) ElMessage.success(successMessage)
    return { verified: true, verification, application: confirmed }
  } finally {
    verifyingPayment.value = false
  }
}

async function confirmPaymentUsingProofFallback(applicationId) {
  const expected = Number(calculatedFees.value.total || 0)
  const paidAmount = Number(form.trademarkRecordation.payment?.amountPaid || 0)

  if (paidAmount < expected) {
    throw new Error(`Amount paid must be at least ${formatTzs(expected)} to submit this application.`)
  }

  const hasProofFile = Boolean(selectedPaymentProofFile.value) || Boolean(String(form.trademarkRecordation.payment?.proofFileName || '').trim())
  if (!hasProofFile) {
    throw new Error('Upload payment proof if GePG verification is delayed.')
  }

  const proofFileName = await uploadPaymentProofIfSelected(applicationId)
  const confirmed = await dataStore.confirmTrademarkPayment(applicationId, {
    amountPaid: paidAmount,
    referenceNumber: form.trademarkRecordation.payment.referenceNumber || '',
    receiptNumber: form.trademarkRecordation.payment.receiptNumber || '',
    paidAt: form.trademarkRecordation.payment.paidAt || new Date().toISOString().slice(0, 10),
    proofFileName,
    notes: 'Payment confirmed with applicant proof upload (GePG verification pending).'
  })
  mapApplicationToForm(confirmed)
  return confirmed
}

// ── Step-specific validation ──────────────────────────────────────────────────

function hasRequiredTrademarkDocuments() {
  const requiredKeys = new Set(trademarkDocuments.value.map((item) => item.key))
  const uploaded = new Set(
    (form.trademarkRecordation.attachments || [])
      .map((item) => item?.documentType)
      .filter(Boolean)
  )
  for (const key of requiredKeys) {
    if (!uploaded.has(key)) return false
  }
  return true
}

function validateTrademarkSpecificStep() {
  const requestType = form.trademarkRecordation.requestType
  const errors = []
  const applicantRole = String(form.trademarkRecordation.applicantRole || 'brand_owner')
  const trademarkRows = Array.isArray(form.trademarkRecordation.trademarks)
    ? form.trademarkRecordation.trademarks
    : []

  if (!trademarkRows.length) {
    errors.push('Add at least one trademark before continuing.')
  }

  trademarkRows.forEach((row, index) => {
    const prefix = `Trademark #${index + 1}`
    if (!String(row.trademarkName || '').trim()) errors.push(`${prefix}: trademark name is required.`)
    if (!String(row.classOfGoods || '').trim()) errors.push(`${prefix}: class of goods is required.`)
    if (!String(row.countryOfOrigin || '').trim()) errors.push(`${prefix}: country of origin is required.`)
    if (!String(row.registrationReference || '').trim()) errors.push(`${prefix}: registration reference is required.`)
    if (!String(row.owner?.fullName || '').trim()) errors.push(`${prefix}: owner full name is required.`)
    if (!String(row.owner?.businessAddress || '').trim()) errors.push(`${prefix}: owner business address is required.`)
    if (!String(row.owner?.nationalityOrJurisdiction || '').trim()) errors.push(`${prefix}: owner nationality/jurisdiction is required.`)
    if (applicantRole === 'agent') {
      if (!String(row.agent?.name || '').trim()) errors.push(`${prefix}: agent name is required.`)
      if (!String(row.agent?.powerOfAttorneyNumber || '').trim()) errors.push(`${prefix}: power of attorney reference is required for agent filing.`)
    }
  })

  if (requestType === 'renewal' && !String(form.trademarkRecordation.currentRecordationNumber || '').trim()) {
    errors.push('Current recordation number is required for renewal.')
  }
  if (requestType === 'alteration' && !String(form.trademarkRecordation.alterationDetails || '').trim()) {
    errors.push('Provide alteration details before continuing.')
  }
  if (requestType === 'ownership_change') {
    if (!String(form.trademarkRecordation.previousOwnerName || '').trim()) errors.push('Previous owner name is required.')
    if (!String(form.trademarkRecordation.newOwnerName || '').trim()) errors.push('New owner name is required.')
    if (!String(form.trademarkRecordation.transferReason || '').trim()) errors.push('Transfer reason is required.')
  }
  if (requestType === 'name_change') {
    if (!String(form.trademarkRecordation.previousLegalName || '').trim()) errors.push('Current legal name is required.')
    if (!String(form.trademarkRecordation.newLegalName || '').trim()) errors.push('New legal name is required.')
  }
  if (requestType === 'agent_appointment') {
    const active = activeTrademark.value
    if (!String(active?.agent?.name || form.trademarkRecordation.agentName || '').trim()) errors.push('Agent name is required.')
    if (!String(active?.agent?.powerOfAttorneyNumber || form.trademarkRecordation.powerOfAttorneyNumber || '').trim()) errors.push('Power of Attorney number/reference is required.')
  }

  return errors
}

function validateActiveTrademarkSection() {
  const row = activeTrademark.value
  if (!row) return ['Add at least one trademark before continuing.']

  const sectionKey = currentTrademarkSection.value?.key || 'basic'
  const errors = []
  const prefix = `Trademark #${activeTrademarkIndex.value + 1}`
  const applicantRole = String(form.trademarkRecordation.applicantRole || 'brand_owner')

  if (sectionKey === 'basic') {
    if (!String(row.trademarkName || '').trim()) errors.push(`${prefix}: trademark name is required.`)
    if (!String(row.classOfGoods || '').trim()) errors.push(`${prefix}: class of goods is required.`)
    if (!String(row.countryOfOrigin || '').trim()) errors.push(`${prefix}: country of origin is required.`)
    if (!String(row.registrationReference || '').trim()) errors.push(`${prefix}: registration reference is required.`)
  }

  if (sectionKey === 'owner') {
    if (!String(row.owner?.fullName || '').trim()) errors.push(`${prefix}: owner full name is required.`)
    if (!String(row.owner?.businessAddress || '').trim()) errors.push(`${prefix}: owner business address is required.`)
    if (!String(row.owner?.nationalityOrJurisdiction || '').trim()) {
      errors.push(`${prefix}: owner nationality/jurisdiction is required.`)
    }

    if (applicantRole === 'agent' || form.trademarkRecordation.requestType === 'agent_appointment') {
      if (!String(row.agent?.name || '').trim()) errors.push(`${prefix}: agent name is required.`)
      if (!String(row.agent?.powerOfAttorneyNumber || '').trim()) {
        errors.push(`${prefix}: power of attorney reference is required.`)
      }
    }
  }

  return errors
}

// ── Step navigation ───────────────────────────────────────────────────────────

async function validateCurrentStep() {
  if (!formRef.value) return true

  const fields = stepFieldMap[stepIndex.value] || []
  if (fields.length) {
    await formRef.value.validateField(fields)
  }

  if (stepIndex.value === 1 || stepIndex.value === 2) {
    const errors = validateTrademarkSpecificStep()
    if (errors.length) throw new Error(errors[0])
  }

  return true
}

async function nextStep() {
  try {
    if (stepIndex.value === 1 && trademarkSectionIndex.value < trademarkSectionSteps.length - 1) {
      const sectionErrors = validateActiveTrademarkSection()
      if (sectionErrors.length) throw new Error(sectionErrors[0])
      await formRef.value?.validateField(['contactEmail', 'phoneNumber'])
      goToNextTrademarkSection()
      return
    }

    await validateCurrentStep()
    stepIndex.value = Math.min(stepIndex.value + 1, wizardSteps.length - 1)
  } catch (error) {
    if (error?.message) ElMessage.warning(error.message)
  }
}

function previousStep() {
  if (stepIndex.value === 1 && trademarkSectionIndex.value > 0) {
    goToPreviousTrademarkSection()
    return
  }
  stepIndex.value = Math.max(stepIndex.value - 1, 0)
}

// ── Load existing application (edit mode) ─────────────────────────────────────

async function loadExisting() {
  if (!isEditMode.value) return

  const applicationId = String(route.params.id || '')
  if (!applicationId) {
    router.push({ name: 'trademarks-overview' })
    return
  }

  loadingExisting.value = true
  try {
    const existing = await dataStore.getApplicationById(applicationId, { serviceKey: SERVICE_KEY })
    if (!existing) {
      ElMessage.error('Application not found.')
      router.push({ name: 'trademarks-overview' })
      return
    }
    mapApplicationToForm(existing)
    currentApplicationId.value = String(existing.applicationId || currentApplicationId.value || '')
  } finally {
    loadingExisting.value = false
  }
}

// ── Submit ────────────────────────────────────────────────────────────────────

async function submit() {
  if (!formRef.value) return

  submitting.value = true
  try {
    await formRef.value.validate()

    const stepErrors = validateTrademarkSpecificStep()
    if (stepErrors.length) throw new Error(stepErrors[0])

    if (!hasRequiredTrademarkDocuments()) {
      ElMessage.error('Please upload all required documents before submitting.')
      return
    }

    let nextRecord = await persistDraft()
    currentApplicationId.value = String(nextRecord?.applicationId || currentApplicationId.value || '')

    if (trademarkPaymentRequired.value) {
      if (!normalizeControlNumber(nextRecord)) {
        await generateControlNumber()
        ElMessage.success('Draft saved and control number generated. Complete payment, verify via GePG, then submit.')
        return
      }

      let paymentConfirmed = false
      try {
        const verificationResult = await verifyPaymentViaGePG({ silent: true })
        paymentConfirmed = Boolean(verificationResult?.verified)
        if (verificationResult?.application) {
          nextRecord = verificationResult.application
        }
      } catch {
        paymentConfirmed = false
      }

      if (
        !paymentConfirmed &&
        Number(form.trademarkRecordation.payment?.amountPaid || 0) >= Number(calculatedFees.value.total || 0)
      ) {
        nextRecord = await confirmPaymentUsingProofFallback(nextRecord.applicationId)
        paymentConfirmed = String(nextRecord?.overallPaymentStatus || '').toUpperCase() === 'PAID'
      }

      if (!paymentConfirmed) {
        ElMessage.warning('Draft saved. Pay using control number, verify payment via GePG, then submit.')
        return
      }
    }

    if (String(nextRecord.status || '').toLowerCase() === 'draft') {
      nextRecord = await dataStore.submitTrademarkApplication(nextRecord.applicationId)
    }

    ElMessage.success('Trademark application submitted to FCC successfully.')
    router.push({ name: 'trademark-details', params: { id: nextRecord.applicationId } })
  } catch (error) {
    ElMessage.error(error?.message || 'Failed to save application')
  } finally {
    submitting.value = false
  }
}

async function handleGenerateControlNumber() {
  try {
    await generateControlNumber()
  } catch (error) {
    ElMessage.error(error?.message || 'Failed to generate control number')
  }
}

async function handleVerifyPayment() {
  try {
    await verifyPaymentViaGePG()
  } catch (error) {
    ElMessage.error(error?.message || 'Payment verification failed')
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  if (isEditMode.value && route.params.id) {
    currentApplicationId.value = String(route.params.id)
  }
  if (route.query.requestType) {
    form.trademarkRecordation.requestType = String(route.query.requestType)
    form.requestType = form.trademarkRecordation.requestType
  }
  if (route.query.sourceApplicationId) {
    form.trademarkRecordation.currentRecordationNumber = String(route.query.sourceApplicationId)
  }
  if (authStore.email && !form.contactEmail) {
    form.contactEmail = authStore.email
  }
  await loadExisting()
})

watch(
  calculatedFees,
  (fees) => {
    form.applicationFee = Number(fees.total || 0)
    form.trademarkRecordation.payment.amountDue = Number(fees.total || 0)
  },
  { immediate: true, deep: true }
)

watch(
  () => form.trademarkRecordation.requestType,
  (next) => {
    form.requestType = next || 'new_recordation'
    if (next === 'agent_appointment') {
      form.trademarkRecordation.requiresAgent = true
    }
  },
  { immediate: true }
)

watch(
  () => form.trademarkRecordation.applicantRole,
  () => {
    ensureTrademarkRowsNormalized()
    form.trademarkRecordation.trademarks.forEach((row) => applyApplicantRoleDefaults(row))
  },
  { immediate: true }
)

watch(
  () => activeTrademark.value,
  (row) => {
    applyApplicantRoleDefaults(row)
  },
  { deep: true, immediate: true }
)

watch(
  () => form.trademarkRecordation.trademarks,
  () => {
    if (!Array.isArray(form.trademarkRecordation.trademarks) || !form.trademarkRecordation.trademarks.length) {
      form.trademarkRecordation.trademarks = [createTrademarkEntry(0)]
    }
    if (!activeTrademark.value) return
    applyApplicantRoleDefaults(activeTrademark.value)
  },
  { deep: false }
)

watch(
  () => activeTrademarkIndex.value,
  () => {
    trademarkSectionIndex.value = 0
  }
)
</script>

<template>
  <section>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-2xl font-semibold">{{ pageTitle }}</h2>
        <p class="mt-1 text-sm text-slate-600">
          Complete the wizard to {{ isEditMode ? 'update' : 'submit' }} your trademark recordation request.
        </p>
      </div>
      <router-link :to="{ name: 'trademarks-overview' }">
        <el-button>Back to Trademarks</el-button>
      </router-link>
    </div>

    <div class="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
      <div><span class="font-semibold">Application Type:</span> {{ service.label }}</div>
      <div class="mt-1"><span class="font-semibold">Process:</span> {{ processName }}</div>
    </div>

    <div class="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm">
      <p class="font-semibold">Process stages</p>
      <div class="mt-2 flex flex-wrap gap-2">
        <el-tag v-for="stage in processStages" :key="stage.key" effect="light">{{ stage.title }}</el-tag>
      </div>
    </div>

    <el-steps :active="stepIndex" class="mt-6">
      <el-step v-for="step in wizardSteps" :key="step.title" :title="step.title" />
    </el-steps>

    <el-form
      ref="formRef"
      class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"
      label-position="top"
      hide-required-asterisk
      :model="form"
      :rules="rules"
      v-loading="loadingExisting"
    >
      <!-- ── Step 0: Request Type ─────────────────────────────────────────── -->
      <template v-if="stepIndex === 0">
        <el-form-item label="Date Received" prop="dateReceived">
          <el-date-picker v-model="form.dateReceived" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>

        <el-form-item label="Sector" prop="sector">
          <el-input v-model="form.sector" placeholder="e.g. Intellectual Property" />
        </el-form-item>

        <el-form-item label="Calculated Fee (TZS)" prop="applicationFee">
          <el-input-number v-model="form.applicationFee" :min="0" controls-position="right" :controls="false" readonly />
        </el-form-item>

        <el-form-item label="Request Type" prop="trademarkRecordation.requestType" class="md:col-span-2 mb-0">
          <TrademarkRequestTypeSelector
            v-model="form.trademarkRecordation.requestType"
            :options="trademarkRequestOptions"
          />
        </el-form-item>

        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
          <p class="text-xs uppercase tracking-wide text-slate-500">Selected Request</p>
          <p class="mt-1 text-sm font-semibold text-slate-900">{{ labelTrademarkRequestType(form.trademarkRecordation.requestType) }}</p>
          <p class="mt-1 text-xs text-slate-600">
            Statutory fee: {{ formatTzs(calculatedFees.total) }}
            <span v-if="!trademarkPaymentRequired"> | No mandatory payment for this request type.</span>
          </p>
        </div>
      </template>

      <!-- ── Step 1: Owner & Trademark ──────────────────────────────────────── -->
      <template v-if="stepIndex === 1">
        <div class="md:col-span-2 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div class="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <el-form-item label="Applicant Role">
              <el-select v-model="form.trademarkRecordation.applicantRole">
                <el-option label="I am the Brand Owner" value="brand_owner" />
                <el-option label="I am an Agent filing for Brand Owner" value="agent" />
              </el-select>
            </el-form-item>

            <el-alert
              v-if="form.trademarkRecordation.applicantRole === 'brand_owner'"
              type="info"
              :closable="false"
              show-icon
              title="Owner details are auto-filled from your applicant profile. Update per trademark if needed."
            />
            <el-alert
              v-else
              type="warning"
              :closable="false"
              show-icon
              title="Agent details are auto-filled from your applicant profile. Add power of attorney details."
            />

            <el-form-item label="Contact Email" prop="contactEmail">
              <el-input v-model="form.contactEmail" />
            </el-form-item>
            <el-form-item label="Contact Phone Number" prop="phoneNumber" class="mb-0">
              <el-input v-model="form.phoneNumber" />
            </el-form-item>

            <div class="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-600">Trademarks</h3>
                <div class="flex gap-1">
                  <el-button plain @click="showTrademarkList = !showTrademarkList">
                    {{ showTrademarkList ? 'Back to Edit' : 'View All' }}
                  </el-button>
                  <el-button type="primary" plain @click="addTrademarkRow">Add</el-button>
                </div>
              </div>

              <!-- Submissions list panel -->
              <template v-if="showTrademarkList">
                <TrademarkSubmissionsList
                  :trademarks="form.trademarkRecordation.trademarks"
                  :request-types="trademarkRequestOptions"
                  @edit="handleTrademarkListEdit"
                  @remove="handleTrademarkListRemove"
                  @add="handleTrademarkListAdd"
                />
              </template>

              <!-- Normal per-trademark sidebar list -->
              <template v-else>
                <div class="space-y-2">
                  <button
                    v-for="(trademark, index) in form.trademarkRecordation.trademarks"
                    :key="trademark.submissionId || index"
                    type="button"
                    class="w-full rounded-lg border px-3 py-2 text-left text-sm transition"
                    :class="index === activeTrademarkIndex ? 'border-sky-500 bg-sky-50 text-sky-900' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'"
                    @click="activeTrademarkIndex = index; ownerMode = 'different'"
                  >
                    <p class="font-medium">Trademark #{{ index + 1 }}</p>
                    <p class="text-xs text-slate-500">
                      {{ trademark.trademarkName || 'Unnamed trademark' }}
                    </p>
                  </button>
                </div>
                <el-button
                 
                  type="danger"
                  plain
                  class="w-full"
                  :disabled="form.trademarkRecordation.trademarks.length <= 1"
                  @click="removeTrademarkRow(activeTrademarkIndex)"
                >
                  Remove Active Trademark
                </el-button>
              </template>
            </div>
          </div>

          <div class="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="text-sm font-semibold text-slate-900">
                Trademark #{{ activeTrademarkIndex + 1 }} Details
              </p>
              <el-tag effect="light" type="info">
                Section {{ trademarkSectionIndex + 1 }} of {{ trademarkSectionSteps.length }}
              </el-tag>
            </div>

            <el-steps :active="trademarkSectionIndex" finish-status="success" simple>
              <el-step
                v-for="section in trademarkSectionSteps"
                :key="section.key"
                :title="section.title"
              />
            </el-steps>

            <template v-if="activeTrademark">
              <div v-if="currentTrademarkSection.key === 'basic'" class="grid grid-cols-1 gap-3 md:grid-cols-2">
                <el-form-item label="Trademark Name" class="mb-0">
                  <el-input v-model="activeTrademark.trademarkName" />
                </el-form-item>
                <el-form-item label="Class of Goods" class="mb-0">
                  <el-input v-model="activeTrademark.classOfGoods" placeholder="e.g. Class 9, 35" />
                </el-form-item>
                <el-form-item label="Representation Type" class="mb-0">
                  <el-select v-model="activeTrademark.representationType">
                    <el-option label="Word Mark" value="Word Mark" />
                    <el-option label="Device Mark" value="Device Mark" />
                    <el-option label="Combined Mark" value="Combined Mark" />
                  </el-select>
                </el-form-item>
                <el-form-item label="Country of Origin" class="mb-0">
                  <CountrySelect v-model="activeTrademark.countryOfOrigin" placeholder="Select country of origin" />
                </el-form-item>
                <el-form-item label="Registration Reference" class="mb-0 md:col-span-2">
                  <el-input v-model="activeTrademark.registrationReference" />
                </el-form-item>
                <el-form-item label="Registration Certificate Number" class="mb-0 md:col-span-2">
                  <el-input v-model="activeTrademark.registrationCertificateNumber" />
                </el-form-item>
                <el-form-item label="Notes" class="mb-0 md:col-span-2">
                  <el-input v-model="activeTrademark.notes" type="textarea" :rows="2" />
                </el-form-item>
              </div>

              <div v-else-if="currentTrademarkSection.key === 'owner'" class="grid grid-cols-1 gap-3 md:grid-cols-2">
                <!-- Shared owner option for trademark index > 0 -->
                <div v-if="activeTrademarkIndex > 0" class="md:col-span-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p class="mb-2 text-xs font-semibold text-blue-800">Owner Source</p>
                  <el-radio-group :model-value="ownerMode" @update:model-value="handleOwnerModeChange">
                    <el-radio label="same" value="same">
                      Same owner as "{{ form.trademarkRecordation.trademarks[0]?.trademarkName || 'Trademark #1' }}"
                    </el-radio>
                    <el-radio label="different" value="different">Different owner</el-radio>
                  </el-radio-group>
                </div>

                <el-form-item label="Owner Category" class="mb-0">
                  <el-select v-model="activeTrademark.owner.ownerCategory">
                    <el-option label="Corporate Owner" value="Corporate Owner" />
                    <el-option label="Individual Owner" value="Individual Owner" />
                    <el-option label="Authorized Agent" value="Authorized Agent" />
                  </el-select>
                </el-form-item>
                <el-form-item label="Owner Full Name" class="mb-0">
                  <el-input v-model="activeTrademark.owner.fullName" />
                </el-form-item>
                <el-form-item label="Owner Business Address" class="mb-0 md:col-span-2">
                  <el-input v-model="activeTrademark.owner.businessAddress" />
                </el-form-item>
                <el-form-item label="Owner Nationality / Jurisdiction" class="mb-0">
                  <CountrySelect v-model="activeTrademark.owner.nationalityOrJurisdiction" placeholder="Select nationality or jurisdiction" />
                </el-form-item>

                <template v-if="form.trademarkRecordation.applicantRole === 'agent' || form.trademarkRecordation.requestType === 'agent_appointment'">
                  <div class="md:col-span-2 mt-1 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    Agent details are required for this filing.
                  </div>
                  <el-form-item label="Agent Name" class="mb-0">
                    <el-input v-model="activeTrademark.agent.name" />
                  </el-form-item>
                  <el-form-item label="Agent Firm" class="mb-0">
                    <el-input v-model="activeTrademark.agent.firm" />
                  </el-form-item>
                  <el-form-item label="Agent Email" class="mb-0">
                    <el-input v-model="activeTrademark.agent.email" />
                  </el-form-item>
                  <el-form-item label="Agent Phone" class="mb-0">
                    <el-input v-model="activeTrademark.agent.phone" />
                  </el-form-item>
                  <el-form-item label="Power of Attorney / Affidavit Reference" class="mb-0 md:col-span-2">
                    <el-input v-model="activeTrademark.agent.powerOfAttorneyNumber" />
                  </el-form-item>
                </template>
              </div>

              <div v-else-if="currentTrademarkSection.key === 'manufacturers'" class="space-y-3">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-slate-700">Manufacturers</p>
                  <el-button type="primary" plain @click="addArrayItemToActiveTrademark('manufacturers', createManufacturer)">Add Manufacturer</el-button>
                </div>
                <div
                  v-for="(manufacturer, manufacturerIndex) in activeTrademark.manufacturers"
                  :key="`m-${manufacturerIndex}`"
                  class="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-2"
                >
                  <el-form-item :label="`Name #${manufacturerIndex + 1}`" class="mb-0">
                    <el-input v-model="manufacturer.name" />
                  </el-form-item>
                  <el-form-item label="Country" class="mb-0">
                    <CountrySelect v-model="manufacturer.country" placeholder="Select country" />
                  </el-form-item>
                  <el-form-item label="Address" class="mb-0 md:col-span-2">
                    <el-input v-model="manufacturer.address" />
                  </el-form-item>
                  <el-form-item label="Contact Name" class="mb-0">
                    <el-input v-model="manufacturer.contactName" />
                  </el-form-item>
                  <el-form-item label="Contact Phone" class="mb-0">
                    <el-input v-model="manufacturer.contactPhone" />
                  </el-form-item>
                  <el-form-item label="Notes" class="mb-0 md:col-span-2">
                    <el-input v-model="manufacturer.notes" type="textarea" :rows="2" />
                  </el-form-item>
                  <div class="md:col-span-2">
                    <el-button type="danger" plain @click="removeArrayItemFromActiveTrademark('manufacturers', manufacturerIndex)">Remove</el-button>
                  </div>
                </div>
              </div>

              <div v-else-if="currentTrademarkSection.key === 'authorizedParties'" class="space-y-3">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-slate-700">Licensed / Authorized Parties</p>
                  <el-button type="primary" plain @click="addArrayItemToActiveTrademark('authorizedParties', createAuthorizedParty)">Add Party</el-button>
                </div>
                <div
                  v-for="(party, partyIndex) in activeTrademark.authorizedParties"
                  :key="`p-${partyIndex}`"
                  class="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-2"
                >
                  <el-form-item :label="`Full Name #${partyIndex + 1}`" class="mb-0">
                    <el-input v-model="party.fullName" />
                  </el-form-item>
                  <el-form-item label="Role" class="mb-0">
                    <el-input v-model="party.role" placeholder="e.g. Distributor" />
                  </el-form-item>
                  <el-form-item label="Address" class="mb-0 md:col-span-2">
                    <el-input v-model="party.address" />
                  </el-form-item>
                  <el-form-item label="Country" class="mb-0">
                    <CountrySelect v-model="party.country" placeholder="Select country" />
                  </el-form-item>
                  <el-form-item label="Email" class="mb-0">
                    <el-input v-model="party.email" />
                  </el-form-item>
                  <el-form-item label="Phone" class="mb-0">
                    <el-input v-model="party.phone" />
                  </el-form-item>
                  <el-form-item label="Notes" class="mb-0 md:col-span-2">
                    <el-input v-model="party.notes" type="textarea" :rows="2" />
                  </el-form-item>
                  <div class="md:col-span-2">
                    <el-button type="danger" plain @click="removeArrayItemFromActiveTrademark('authorizedParties', partyIndex)">Remove</el-button>
                  </div>
                </div>
              </div>

              <div v-else-if="currentTrademarkSection.key === 'affiliates'" class="space-y-3">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-slate-700">Affiliated Companies</p>
                  <el-button type="primary" plain @click="addArrayItemToActiveTrademark('affiliatedCompanies', createAffiliateCompany)">Add Affiliate</el-button>
                </div>
                <div
                  v-for="(company, companyIndex) in activeTrademark.affiliatedCompanies"
                  :key="`a-${companyIndex}`"
                  class="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-2"
                >
                  <el-form-item :label="`Company Name #${companyIndex + 1}`" class="mb-0">
                    <el-input v-model="company.companyName" />
                  </el-form-item>
                  <el-form-item label="Relationship" class="mb-0">
                    <el-input v-model="company.relationship" placeholder="e.g. Parent Company" />
                  </el-form-item>
                  <el-form-item label="Country" class="mb-0">
                    <CountrySelect v-model="company.country" placeholder="Select country" />
                  </el-form-item>
                  <el-form-item label="Notes" class="mb-0 md:col-span-2">
                    <el-input v-model="company.notes" type="textarea" :rows="2" />
                  </el-form-item>
                  <div class="md:col-span-2">
                    <el-button type="danger" plain @click="removeArrayItemFromActiveTrademark('affiliatedCompanies', companyIndex)">Remove</el-button>
                  </div>
                </div>
              </div>

              <div v-else-if="currentTrademarkSection.key === 'visuals'" class="space-y-3">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-slate-700">Trademark Visuals</p>
                  <el-button type="primary" plain @click="addArrayItemToActiveTrademark('visuals', createTrademarkVisual)">Add Visual</el-button>
                </div>
                <div
                  v-for="(visual, visualIndex) in activeTrademark.visuals"
                  :key="`v-${visualIndex}`"
                  class="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-2"
                >
                  <el-form-item :label="`Visual Type #${visualIndex + 1}`" class="mb-0">
                    <el-input v-model="visual.visualType" placeholder="e.g. Logo, Label, Package" />
                  </el-form-item>
                  <el-form-item label="Color Claim" class="mb-0">
                    <el-input v-model="visual.colorClaim" placeholder="e.g. Black and Gold" />
                  </el-form-item>
                  <el-form-item label="Description" class="mb-0 md:col-span-2">
                    <el-input v-model="visual.description" type="textarea" :rows="2" />
                  </el-form-item>
                  <el-form-item label="File Name / Link" class="mb-0 md:col-span-2">
                    <el-input v-model="visual.fileName" placeholder="e.g. mark-visual.png" />
                  </el-form-item>
                  <el-form-item label="Notes" class="mb-0 md:col-span-2">
                    <el-input v-model="visual.notes" type="textarea" :rows="2" />
                  </el-form-item>
                  <div class="md:col-span-2">
                    <el-button type="danger" plain @click="removeArrayItemFromActiveTrademark('visuals', visualIndex)">Remove</el-button>
                  </div>
                </div>
              </div>

              <div v-else class="space-y-3">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-slate-700">Per-trademark Attachments</p>
                  <el-button type="primary" plain @click="addArrayItemToActiveTrademark('attachments', createTrademarkAttachment)">Add Attachment</el-button>
                </div>
                <div
                  v-for="(attachment, attachmentIndex) in activeTrademark.attachments"
                  :key="attachment.attachmentId || `ta-${attachmentIndex}`"
                  class="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-2"
                >
                  <el-form-item :label="`Document Type #${attachmentIndex + 1}`" class="mb-0">
                    <el-select v-model="attachment.documentType" filterable placeholder="Select document type">
                      <el-option
                        v-for="option in trademarkAttachmentOptions"
                        :key="option.key"
                        :label="option.label"
                        :value="option.key"
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="File Name / Reference" class="mb-0">
                    <el-input v-model="attachment.fileName" />
                  </el-form-item>
                  <el-form-item label="Document Reference No." class="mb-0">
                    <el-input v-model="attachment.referenceNumber" />
                  </el-form-item>
                  <el-form-item label="Issued By" class="mb-0">
                    <el-input v-model="attachment.issuedBy" />
                  </el-form-item>
                  <el-form-item label="Issued Date" class="mb-0">
                    <el-date-picker v-model="attachment.issuedDate" type="date" value-format="YYYY-MM-DD" />
                  </el-form-item>
                  <el-form-item label="Notes" class="mb-0">
                    <el-input v-model="attachment.notes" type="textarea" :rows="2" />
                  </el-form-item>
                  <div class="md:col-span-2">
                    <el-button type="danger" plain @click="removeArrayItemFromActiveTrademark('attachments', attachmentIndex)">Remove</el-button>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>

      <!-- ── Step 2: Request Details ──────────────────────────────────────── -->
      <template v-if="stepIndex === 2">
        <el-form-item v-if="form.trademarkRecordation.requestType === 'renewal'" label="Current Recordation Number">
          <el-input v-model="form.trademarkRecordation.currentRecordationNumber" />
        </el-form-item>
        <el-form-item v-if="form.trademarkRecordation.requestType === 'renewal'" label="Requested Renewal Term (years)">
          <el-input-number v-model="form.trademarkRecordation.renewalTermYears" :min="1" :max="10" controls-position="right" />
        </el-form-item>

        <el-form-item v-if="form.trademarkRecordation.requestType === 'alteration'" label="Alteration Details" class="md:col-span-2">
          <el-input v-model="form.trademarkRecordation.alterationDetails" type="textarea" :rows="4" />
        </el-form-item>

        <template v-if="form.trademarkRecordation.requestType === 'ownership_change'">
          <el-form-item label="Previous Owner Name">
            <el-input v-model="form.trademarkRecordation.previousOwnerName" />
          </el-form-item>
          <el-form-item label="New Owner Name">
            <el-input v-model="form.trademarkRecordation.newOwnerName" />
          </el-form-item>
          <el-form-item label="Transfer Reason" class="md:col-span-2">
            <el-input v-model="form.trademarkRecordation.transferReason" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="Time-limited Rights Summary" class="md:col-span-2">
            <el-input v-model="form.trademarkRecordation.transferRightsSummary" type="textarea" :rows="3" />
          </el-form-item>
        </template>

        <template v-if="form.trademarkRecordation.requestType === 'name_change'">
          <el-form-item label="Current Legal Name">
            <el-input v-model="form.trademarkRecordation.previousLegalName" />
          </el-form-item>
          <el-form-item label="New Legal Name">
            <el-input v-model="form.trademarkRecordation.newLegalName" />
          </el-form-item>
          <el-form-item label="Reason For Name Change" class="md:col-span-2">
            <el-input v-model="form.trademarkRecordation.nameChangeReason" type="textarea" :rows="3" />
          </el-form-item>
        </template>

        <template v-if="form.trademarkRecordation.requestType === 'agent_appointment'">
          <el-form-item label="Agent Name">
            <el-input v-model="form.trademarkRecordation.agentName" />
          </el-form-item>
          <el-form-item label="Agent Firm">
            <el-input v-model="form.trademarkRecordation.agentFirm" />
          </el-form-item>
          <el-form-item label="Agent Email" prop="trademarkRecordation.agentEmail">
            <el-input v-model="form.trademarkRecordation.agentEmail" />
          </el-form-item>
          <el-form-item label="Agent Phone">
            <el-input v-model="form.trademarkRecordation.agentPhone" />
          </el-form-item>
          <el-form-item label="Power of Attorney Ref.">
            <el-input v-model="form.trademarkRecordation.powerOfAttorneyNumber" />
          </el-form-item>
        </template>

        <el-form-item v-if="form.trademarkRecordation.requestType === 'discontinuation'" label="Discontinuation Reason" class="md:col-span-2">
          <el-input v-model="form.trademarkRecordation.notes" type="textarea" :rows="4" />
        </el-form-item>

        <el-form-item
          v-if="!['agent_appointment', 'discontinuation'].includes(form.trademarkRecordation.requestType)"
          label="Additional Notes"
          class="md:col-span-2"
        >
          <el-input v-model="form.trademarkRecordation.notes" type="textarea" :rows="3" />
        </el-form-item>
      </template>

      <!-- ── Step 3: Payment, Documents & Declaration ────────────────────── -->
      <template v-if="stepIndex === 3">
        <div v-if="trademarkPaymentRequired" class="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <p class="font-semibold text-slate-800">GePG Payment Flow</p>
          <p class="mt-1 text-slate-600">
            Generate control number, complete payment in GePG, then verify payment before final submission.
          </p>
          <div class="mt-3 flex flex-wrap gap-2">
            <el-button type="primary" plain :loading="generatingControlNumber" @click="handleGenerateControlNumber">
              Generate / Refresh Control Number
            </el-button>
            <el-button
              type="success"
              plain
              :loading="verifyingPayment"
              :disabled="!hasControlNumber || !effectiveApplicationId"
              @click="handleVerifyPayment"
            >
              Verify Payment via GePG
            </el-button>
          </div>
          <el-alert
            v-if="paymentVerificationFeedback"
            class="mt-3"
            :type="paymentVerificationFeedbackType"
            :closable="false"
            :show-icon="true"
            :title="paymentVerificationFeedback"
          />
        </div>

        <div class="md:col-span-2">
          <TrademarkPaymentPanel
            v-model="form.trademarkRecordation.payment"
            :expected-amount="Number(calculatedFees.total || 0)"
            :payment-required="trademarkPaymentRequired"
            :control-number-readonly="true"
          />
        </div>

        <div class="md:col-span-2">
          <TrademarkAttachmentManager
            v-model="form.trademarkRecordation.attachments"
            :required-documents="trademarkDocuments"
          />
        </div>

        <el-form-item v-if="trademarkPaymentRequired" label="Proof of Payment (if GePG verification is delayed)" class="md:col-span-2">
          <el-upload
            :auto-upload="false"
            :limit="1"
            :show-file-list="false"
            :on-change="onPaymentProofFileChange"
          >
            <el-button plain :loading="uploadingProof">Choose Proof File</el-button>
          </el-upload>
          <p v-if="form.trademarkRecordation.payment?.proofFileName" class="mt-2 text-xs text-slate-600">
            Selected proof: {{ form.trademarkRecordation.payment.proofFileName }}
          </p>
        </el-form-item>

        <el-form-item label="Declarant Full Name" class="md:col-span-2">
          <el-input v-model="form.trademarkRecordation.declarationName" />
        </el-form-item>
        <el-form-item label="Declarant Title">
          <el-input v-model="form.trademarkRecordation.declarationTitle" />
        </el-form-item>
        <el-form-item label="Declaration Date">
          <el-date-picker v-model="form.trademarkRecordation.declarationDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item prop="trademarkRecordation.declarationAccepted" class="md:col-span-2">
          <el-checkbox v-model="form.trademarkRecordation.declarationAccepted" class="wizard-declaration-checkbox">
            I declare that the submitted information and documents are true and complete.
          </el-checkbox>
        </el-form-item>

        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm md:col-span-2">
          <p class="font-semibold text-slate-800">Submission readiness</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <el-tag :type="hasRequiredTrademarkDocuments() ? 'success' : 'warning'" effect="light">
              {{ hasRequiredTrademarkDocuments() ? 'All required documents attached' : 'Missing required documents' }}
            </el-tag>
            <el-tag
              :type="!trademarkPaymentRequired || isPaymentMarkedComplete ? 'success' : 'warning'"
              effect="light"
            >
              {{
                !trademarkPaymentRequired || isPaymentMarkedComplete
                  ? 'Payment condition met'
                  : hasControlNumber
                    ? 'Awaiting verified payment'
                    : 'Control number not generated'
              }}
            </el-tag>
          </div>
        </div>
      </template>
    </el-form>

    <div class="mt-2 flex gap-2">
      <el-button v-if="stepIndex > 0" @click="previousStep">Previous</el-button>
      <el-button v-if="stepIndex < wizardSteps.length - 1" type="primary" @click="nextStep">Next</el-button>
      <el-button v-else type="primary" :loading="submitting" @click="submit">
        {{ submitButtonLabel }}
      </el-button>
    </div>
  </section>
</template>
