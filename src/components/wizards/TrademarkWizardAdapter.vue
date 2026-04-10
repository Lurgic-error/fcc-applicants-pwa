// DEPRECATED: Replaced by TrademarkRecordationWizard.vue (2026-04-10)
// This file is kept for reference but is no longer routed to.
<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import {
  buildApplicationDetailsRoute,
  buildServiceOverviewRoute,
  getApplicationServiceByKey
} from '@/constants/applicationCatalog'
import {
  getApplicationProcessName,
  getApplicationProcessStages
} from '@/constants/applicationProcesses'
import { calculateServiceFees } from '@/constants/applicationServiceRules'
import {
  TRADEMARK_REQUEST_TYPE_OPTIONS,
  formatTzs,
  getTrademarkRequiredDocuments,
  isTrademarkPaymentRequired,
  labelTrademarkRequestType
} from '@/constants/trademarkRecordation'
import ApplicantInfoStep from './ApplicantInfoStep.vue'
import TrademarkAttachmentManager from '@/components/trademark/TrademarkAttachmentManager.vue'
import TrademarkPaymentPanel from '@/components/trademark/TrademarkPaymentPanel.vue'
import TrademarkRequestTypeSelector from '@/components/trademark/TrademarkRequestTypeSelector.vue'
import ApplicationCompletenessDrawer from '@/components/ApplicationCompletenessDrawer.vue'
import MobileStepNavigator from '@/components/MobileStepNavigator.vue'
import {
  fetchApplicantProfile,
  registerApplicantAccount,
  updateApplicantProfile
} from '@/services/applicantApi'
import { useApplicantDataStore } from '@/stores/applications'
import { useAuthStore } from '@/stores/auth'
import { useAutoSave } from '@/composables/useAutoSave'

const props = defineProps({
  serviceKey: {
    type: String,
    required: true
  },
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
const stepHeadingRef = ref(null)
const existingApplication = ref(null)

watch(stepIndex, () => {
  nextTick(() => {
    stepHeadingRef.value?.focus()
  })
})

const service = computed(() => getApplicationServiceByKey(props.serviceKey))
const processName = computed(() => getApplicationProcessName(props.serviceKey))
const processStages = computed(() => getApplicationProcessStages(props.serviceKey))
const overviewRoute = computed(() => buildServiceOverviewRoute(props.serviceKey))
const isEditMode = computed(() => props.mode === 'update')
const pageTitle = computed(() => `${isEditMode.value ? 'Update' : 'New'} ${service.value.label}`)

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

function createTrademarkEntry(index = 0) {
  return {
    submissionId: `TM-SUB-${index + 1}`,
    trademarkName: '',
    classOfGoods: '',
    representationType: 'Combined Mark',
    countryOfOrigin: 'Tanzania',
    registrationReference: '',
    registrationCertificateNumber: '',
    notes: ''
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
      receiptNumber: ''
    }
  }
}

const calculatedFees = computed(() =>
  calculateServiceFees(props.serviceKey, {
    applicationFee: form.applicationFee,
    trademarkRecordation: form.trademarkRecordation,
    trademarkRequestType: form.trademarkRecordation?.requestType,
    trademarkVersions: form.trademarkVersions,
    contracts: form.contracts,
    mergerClearance: form.mergerClearance,
    transactionValue: form.mergerClearance?.transactionValue
  })
)
// Computed adapter: maps between ApplicantInfoStep shape and flat form fields
const applicantModel = computed({
  get() {
    const typeMap = { firm: 'company', individual: 'individual' }
    return {
      type: typeMap[form.applicantType] || 'company',
      companyName: form.companyName,
      registrationNumber: form.registrationNumber,
      countryOfIncorporation: form.countryOfIncorporation,
      firstName: form.firstName,
      surname: form.surname,
      nationalId: form.nationalId,
      nationality: form.countryOfResidence,
      email: form.contactEmail,
      phoneNumber: form.phoneNumber,
      postalAddress: form.postalAddress,
      physicalAddress: form.physicalAddress,
      businessDescription: form.businessDescription,
      contactPerson: form.contactPersonName
        ? {
            name: form.contactPersonName,
            email: form.contactPersonEmail,
            phone: form.contactPersonPhone,
            designation: ''
          }
        : undefined
    }
  },
  set(val) {
    const typeMap = { company: 'firm', individual: 'individual' }
    form.applicantType = typeMap[val.type] || 'firm'
    form.companyName = val.companyName || ''
    form.registrationNumber = val.registrationNumber || ''
    form.countryOfIncorporation = val.countryOfIncorporation || 'Tanzania'
    form.firstName = val.firstName || ''
    form.surname = val.surname || ''
    form.nationalId = val.nationalId || ''
    form.countryOfResidence = val.nationality || 'Tanzania'
    form.contactEmail = val.email || ''
    form.phoneNumber = val.phoneNumber || ''
    form.postalAddress = val.postalAddress || ''
    form.physicalAddress = val.physicalAddress || ''
    form.businessDescription = val.businessDescription || ''
    form.contactPersonName = val.contactPerson?.name || ''
    form.contactPersonEmail = val.contactPerson?.email || ''
    form.contactPersonPhone = val.contactPerson?.phone || ''
  }
})

const trademarkRequestOptions = TRADEMARK_REQUEST_TYPE_OPTIONS
const trademarkDocuments = computed(() =>
  getTrademarkRequiredDocuments(form.trademarkRecordation.requestType, {
    includePaymentProof: isTrademarkPaymentRequired(form.trademarkRecordation.requestType),
    requiresAgent: Boolean(form.trademarkRecordation.requiresAgent)
  })
)
const trademarkPaymentRequired = computed(() => isTrademarkPaymentRequired(form.trademarkRecordation.requestType))

const wizardSteps = [
  { title: 'Request Type' },
  { title: 'Owner & Trademark' },
  { title: 'Request Details' },
  { title: 'Documents' },
  { title: 'Payment & Declaration' }
]

const form = reactive({
  dateReceived: new Date().toISOString().slice(0, 10),
  sector: '',
  applicationFee: 0,
  fileNumber: '',
  paymentStatus: 'Pending',
  amountPaid: 0,
  paymentControlNumber: '',
  paymentReferenceNumber: '',

  activity: '',
  task: '',
  directorate: '',
  section: '',
  office: '',

  applicantType: 'firm',
  companyName: '',
  registrationNumber: '',
  countryOfIncorporation: 'Tanzania',

  firstName: '',
  surname: '',
  nationalId: '',
  countryOfResidence: 'Tanzania',

  contactPersonName: '',
  contactPersonEmail: '',
  contactPersonPhone: '',

  contactEmail: '',
  phoneNumber: '',
  postalAddress: '',
  physicalAddress: '',
  businessDescription: '',

  requestType: 'new_recordation',
  trademarkRecordation: createTrademarkRecordation(),
  trademarkVersions: [],
  contracts: [],
  mergerClearance: {
    transactionType: 'Merger',
    partiesInvolved: '',
    estimatedTurnover: null,
    transactionValue: null,
    targetFirmName: '',
    targetFirmBusiness: '',
    acquisitionDescription: '',
    commercialRationale: '',
    relevantMarketDefinition: '',
    confidentialityClaimRequired: false,
    confidentialityStatement: ''
  }
})

const { lastSaved, showResumePrompt, saveDraft, resumeDraft, discardDraft, clearDraft, checkForExistingDraft } = useAutoSave(
  `fcc_wizard_draft_${props.serviceKey}`,
  () => ({ ...form }),
  (data) => Object.assign(form, data)
)

const formSnapshot = ref('')
const previewDrawerVisible = ref(false)
const DRAFT_KEY_PREFIX = 'fcc_wizard_draft_'

function saveDraftToLocalStorage() {
  localStorage.setItem(`${DRAFT_KEY_PREFIX}${props.serviceKey}`, JSON.stringify(form))
}

function openFullPreview() {
  previewDrawerVisible.value = false
  saveDraftToLocalStorage()
  const id = isEditMode.value ? String(route.params.id) : 'draft'
  router.push({
    name: id === 'draft' ? 'application-preview-draft' : 'application-preview',
    params: { serviceKey: props.serviceKey, ...(id !== 'draft' ? { id } : {}) },
    query: { editing: '1', step: stepIndex.value }
  })
}

function jumpToStep(index) {
  previewDrawerVisible.value = false
  stepIndex.value = index
}

function captureSnapshot() {
  formSnapshot.value = JSON.stringify(form)
}

const isDirty = computed(() => {
  if (!formSnapshot.value) return false
  return JSON.stringify(form) !== formSnapshot.value
})

onBeforeRouteLeave(async () => {
  if (!isDirty.value || submitting.value) return true
  try {
    await ElMessageBox.confirm(
      'You have unsaved changes. Leave this page?',
      'Unsaved Changes',
      { confirmButtonText: 'Leave', cancelButtonText: 'Stay', type: 'warning' }
    )
    return true
  } catch {
    return false
  }
})

const rules = computed(() => {
  const nextRules = {
    dateReceived: [{ required: true, message: 'Submission date is required', trigger: 'change' }],
    sector: [{ required: true, message: 'Sector is required', trigger: 'blur' }]
  }

  nextRules.contactEmail = [{ required: true, type: 'email', message: 'Contact email is required', trigger: 'blur' }]
  nextRules.phoneNumber = [{ required: true, message: 'Contact phone number is required', trigger: 'blur' }]
  nextRules['trademarkRecordation.requestType'] = [{ required: true, message: 'Request type is required', trigger: 'change' }]
  nextRules['trademarkRecordation.ownerFullName'] = [{ required: true, message: 'Owner full name is required', trigger: 'blur' }]
  nextRules['trademarkRecordation.ownerBusinessAddress'] = [{ required: true, message: 'Owner business address is required', trigger: 'blur' }]
  nextRules['trademarkRecordation.ownerNationalityOrJurisdiction'] = [{ required: true, message: 'Owner nationality/jurisdiction is required', trigger: 'blur' }]

  nextRules['trademarkRecordation.agentEmail'] = [
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
  ]

  nextRules['trademarkRecordation.payment.controlNumber'] = [
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
  ]

  nextRules['trademarkRecordation.payment.amountPaid'] = [
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
  ]

  nextRules['trademarkRecordation.declarationAccepted'] = [
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

  return nextRules
})

const stepFieldMap = computed(() => {
  return [
    ['dateReceived', 'sector', 'fileNumber', 'trademarkRecordation.requestType'],
    [
      'contactEmail',
      'phoneNumber',
      'trademarkRecordation.ownerFullName',
      'trademarkRecordation.ownerBusinessAddress',
      'trademarkRecordation.ownerNationalityOrJurisdiction'
    ],
    [],
    [],
    [
      'trademarkRecordation.payment.controlNumber',
      'trademarkRecordation.payment.amountPaid',
      'trademarkRecordation.declarationAccepted'
    ]
  ]
})

function resetServiceSpecificFields() {
  if (!form.trademarkRecordation || typeof form.trademarkRecordation !== 'object') {
    form.trademarkRecordation = createTrademarkRecordation()
  }
  if (!Array.isArray(form.trademarkRecordation.trademarks) || !form.trademarkRecordation.trademarks.length) {
    form.trademarkRecordation.trademarks = [createTrademarkEntry(0)]
  }
  form.requestType = form.trademarkRecordation.requestType

  if (!Array.isArray(form.trademarkVersions)) {
    form.trademarkVersions = []
  }
  if (!Array.isArray(form.contracts)) {
    form.contracts = []
  }
}

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
            registrationCertificateNumber:
              row.registrationCertificateNumber || row?.trademarkDraft?.registrationCertificateNumber || '',
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

  Object.assign(form, {
    dateReceived: raw.dateReceived || application.submittedAt || form.dateReceived,
    sector: raw.sector || '',
    applicationFee: Number(raw.applicationFee || application?.fees?.total || 0) || 0,
    fileNumber: raw.fileNumber || '',
    paymentStatus: raw.paymentStatus || 'Pending',
    amountPaid: Number(raw.payment?.amountPaid || 0) || 0,
    paymentControlNumber: raw.payment?.controlNumber || '',
    paymentReferenceNumber: raw.payment?.referenceNumber || '',

    activity: raw.activity?._id || raw.activity?.activityId || '',
    task: raw.task?._id || raw.task?.taskId || '',
    directorate: raw.directorate?._id || raw.directorate?.directorateId || '',
    section: raw.section?._id || raw.section?.sectionId || '',
    office: raw.office?._id || raw.office?.officeId || '',

    applicantType: String(applicant.type || 'firm').toLowerCase().includes('individual') ? 'individual' : 'firm',
    companyName: applicant.companyName || '',
    registrationNumber: applicant.registrationNumber || '',
    countryOfIncorporation: applicant.countryOfIncorporation || 'Tanzania',

    firstName: applicant.firstName || '',
    surname: applicant.surname || '',
    nationalId: applicant.nationalId || '',
    countryOfResidence: applicant.countryOfResidence || 'Tanzania',

    contactPersonName: applicant.contactPerson?.name || '',
    contactPersonEmail: applicant.contactPerson?.email || '',
    contactPersonPhone: applicant.contactPerson?.phoneNumber || '',

    contactEmail: applicant.email || applicant.contactPerson?.email || authStore.email || '',
    phoneNumber: applicant.phoneNumber || applicant.contactPerson?.phoneNumber || '',
    postalAddress: applicant.postalAddress || '',
    physicalAddress: applicant.physicalAddress || '',
    businessDescription: applicant.businessDescription || '',
    requestType: mappedTrademarkRecordation.requestType || 'new_recordation',
    trademarkRecordation: {
      ...createTrademarkRecordation(),
      ...mappedTrademarkRecordation,
      trademarks: mappedTrademarkRows.length ? mappedTrademarkRows : [createTrademarkEntry(0)],
      attachments: Array.isArray(mappedTrademarkRecordation.attachments) && mappedTrademarkRecordation.attachments.length
        ? mappedTrademarkRecordation.attachments
        : [createTrademarkAttachment()],
      payment: {
        ...createTrademarkRecordation().payment,
        ...(mappedTrademarkRecordation.payment || {}),
        amountPaid: Number(mappedTrademarkRecordation.payment?.amountPaid || raw.payment?.amountPaid || 0) || 0
      }
    },

    trademarkVersions: Array.isArray(raw.trademarkVersions)
      ? raw.trademarkVersions
      : Array.isArray(serviceDetails.trademarkVersions)
        ? serviceDetails.trademarkVersions
        : [],
    contracts: Array.isArray(raw.contracts)
      ? raw.contracts
      : Array.isArray(serviceDetails.contracts)
        ? serviceDetails.contracts
        : [],
    mergerClearance:
      raw.mergerClearance ||
      serviceDetails.mergerClearance ||
      {
        transactionType: 'Merger',
        partiesInvolved: '',
        estimatedTurnover: null,
        transactionValue: null,
        targetFirmName: '',
        targetFirmBusiness: '',
        acquisitionDescription: '',
        commercialRationale: '',
        relevantMarketDefinition: '',
        confidentialityClaimRequired: false,
        confidentialityStatement: ''
      }
  })

  form.paymentControlNumber = form.trademarkRecordation.payment.controlNumber || form.paymentControlNumber
  form.paymentReferenceNumber = form.trademarkRecordation.payment.referenceNumber || form.paymentReferenceNumber
  form.amountPaid = Number(form.trademarkRecordation.payment.amountPaid || form.amountPaid || 0)
  form.paymentStatus = form.trademarkRecordation.payment.status || form.paymentStatus
}

function hasRequiredTrademarkDocuments() {
  const requiredKeys = new Set(trademarkDocuments.value.map((item) => item.key))
  const uploaded = new Set(
    (form.trademarkRecordation.attachments || [])
      .map((item) => item?.documentType)
      .filter(Boolean)
  )

  for (const key of requiredKeys) {
    if (!uploaded.has(key)) {
      return false
    }
  }
  return true
}

function validateTrademarkSpecificStep() {
  const requestType = form.trademarkRecordation.requestType
  const errors = []
  const trademarkRows = Array.isArray(form.trademarkRecordation.trademarks)
    ? form.trademarkRecordation.trademarks
    : []

  if (!trademarkRows.length) {
    errors.push('Add at least one trademark before continuing.')
  }

  trademarkRows.forEach((row, index) => {
    const prefix = `Trademark #${index + 1}`
    if (!String(row.trademarkName || '').trim()) {
      errors.push(`${prefix}: trademark name is required.`)
    }
    if (!String(row.classOfGoods || '').trim()) {
      errors.push(`${prefix}: class of goods is required.`)
    }
    if (!String(row.countryOfOrigin || '').trim()) {
      errors.push(`${prefix}: country of origin is required.`)
    }
    if (!String(row.registrationReference || '').trim()) {
      errors.push(`${prefix}: registration reference is required.`)
    }
  })

  if (requestType === 'renewal' && !String(form.trademarkRecordation.currentRecordationNumber || '').trim()) {
    errors.push('Current recordation number is required for renewal.')
  }

  if (requestType === 'alteration' && !String(form.trademarkRecordation.alterationDetails || '').trim()) {
    errors.push('Provide alteration details before continuing.')
  }

  if (requestType === 'ownership_change') {
    if (!String(form.trademarkRecordation.previousOwnerName || '').trim()) {
      errors.push('Previous owner name is required.')
    }
    if (!String(form.trademarkRecordation.newOwnerName || '').trim()) {
      errors.push('New owner name is required.')
    }
    if (!String(form.trademarkRecordation.transferReason || '').trim()) {
      errors.push('Transfer reason is required.')
    }
  }

  if (requestType === 'name_change') {
    if (!String(form.trademarkRecordation.previousLegalName || '').trim()) {
      errors.push('Current legal name is required.')
    }
    if (!String(form.trademarkRecordation.newLegalName || '').trim()) {
      errors.push('New legal name is required.')
    }
  }

  if (requestType === 'agent_appointment') {
    if (!String(form.trademarkRecordation.agentName || '').trim()) {
      errors.push('Agent name is required.')
    }
    if (!String(form.trademarkRecordation.powerOfAttorneyNumber || '').trim()) {
      errors.push('Power of Attorney number/reference is required.')
    }
  }

  return errors
}

async function loadExisting() {
  if (!isEditMode.value) {
    return
  }

  const applicationId = String(route.params.id || '')
  if (!applicationId) {
    router.push(overviewRoute.value)
    return
  }

  loadingExisting.value = true
  try {
    existingApplication.value = await dataStore.getApplicationById(applicationId, { serviceKey: props.serviceKey })
    if (!existingApplication.value) {
      ElMessage.error('Application not found for this service.')
      router.push(overviewRoute.value)
      return
    }
    mapApplicationToForm(existingApplication.value)
    captureSnapshot()
  } finally {
    loadingExisting.value = false
  }
}

async function validateCurrentStep() {
  if (!formRef.value) {
    return true
  }
  const fields = stepFieldMap.value[stepIndex.value] || []
  if (fields.length) {
    await formRef.value.validateField(fields)
  }

  if (stepIndex.value === 1 || stepIndex.value === 2) {
    const errors = validateTrademarkSpecificStep()
    if (errors.length) {
      throw new Error(errors[0])
    }
  }

  if (stepIndex.value === 3 && !hasRequiredTrademarkDocuments()) {
    throw new Error('Upload all required documents to continue.')
  }

  return true
}

async function nextStep() {
  try {
    await validateCurrentStep()
    saveDraft()
    stepIndex.value = Math.min(stepIndex.value + 1, wizardSteps.length - 1)
  } catch (error) {
    if (error?.message) {
      ElMessage.warning(error.message)
    }
  }
}

function previousStep() {
  saveDraft()
  stepIndex.value = Math.max(stepIndex.value - 1, 0)
}

function addTrademarkRow() {
  const rows = Array.isArray(form.trademarkRecordation.trademarks)
    ? form.trademarkRecordation.trademarks
    : []
  form.trademarkRecordation.trademarks = [...rows, createTrademarkEntry(rows.length)]
}

function removeTrademarkRow(index) {
  const rows = Array.isArray(form.trademarkRecordation.trademarks)
    ? [...form.trademarkRecordation.trademarks]
    : []
  rows.splice(index, 1)
  form.trademarkRecordation.trademarks = rows.length ? rows : [createTrademarkEntry(0)]
}

async function ensureApplicantProfile() {
  try {
    const applicantData = {
      applicantType: form.applicantType,
      companyName: form.companyName || undefined,
      registrationNumber: form.registrationNumber || undefined,
      firstName: form.firstName || undefined,
      surname: form.surname || undefined,
      email: form.contactEmail || form.email || undefined,
      phoneNumber: form.phoneNumber || undefined,
      contactPerson: form.contactPersonName ? {
        name: form.contactPersonName,
        email: form.contactEmail,
        phone: form.phoneNumber,
      } : undefined,
      address: form.address || undefined,
    }

    // Try to update existing profile first
    try {
      const profile = await fetchApplicantProfile()
      if (profile?.applicantId) {
        await updateApplicantProfile({ applicantId: profile.applicantId, changes: applicantData })
        return
      }
    } catch {
      // Profile doesn't exist yet, will create below
    }

    // Create new applicant profile
    await registerApplicantAccount(applicantData)
  } catch (err) {
    console.warn('[ApplicationWizard] Could not sync applicant profile:', err?.message || err)
  }
}

async function submit() {
  if (!formRef.value) {
    return
  }

  submitting.value = true
  try {
    await formRef.value.validate()

    const stepErrors = validateTrademarkSpecificStep()
    if (stepErrors.length) {
      throw new Error(stepErrors[0])
    }

    if (!hasRequiredTrademarkDocuments()) {
      throw new Error('Please upload all required documents before submission.')
    }

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

    form.requestType = form.trademarkRecordation.requestType
    form.paymentStatus = form.trademarkRecordation.payment.status
    form.amountPaid = Number(form.trademarkRecordation.payment.amountPaid || 0)
    form.paymentControlNumber = form.trademarkRecordation.payment.controlNumber || ''
    form.paymentReferenceNumber = form.trademarkRecordation.payment.referenceNumber || ''

    await ensureApplicantProfile()

    const persisted = isEditMode.value
      ? await dataStore.updateApplication(String(route.params.id), { ...form }, { serviceKey: props.serviceKey })
      : await dataStore.submitApplication({ ...form }, { serviceKey: props.serviceKey })

    let nextRecord = persisted

    if (trademarkPaymentRequired.value && !String(nextRecord.payment?.controlNumber || '').trim()) {
      nextRecord = await dataStore.generateTrademarkControlNumber(nextRecord.applicationId)
    }

    if (trademarkPaymentRequired.value) {
      const paymentStatus = String(form.trademarkRecordation.payment.status || '').toLowerCase()
      const wantsImmediateSubmit = ['paid', 'verified'].includes(paymentStatus)

      if (wantsImmediateSubmit) {
        nextRecord = await dataStore.confirmTrademarkPayment(nextRecord.applicationId, {
          source: 'gepg-bill-verification'
        })

        const status = String(nextRecord.status || '').toLowerCase()
        if (status === 'draft') {
          nextRecord = await dataStore.submitTrademarkApplication(nextRecord.applicationId)
        }
        ElMessage.success('Trademark application submitted to FCC successfully.')
      } else {
        ElMessage.success('Trademark draft saved. Use the generated control number to pay, then refresh or verify the payment before submission.')
      }
    } else {
      const status = String(nextRecord.status || '').toLowerCase()
      if (status === 'draft') {
        nextRecord = await dataStore.submitTrademarkApplication(nextRecord.applicationId)
      }
      ElMessage.success('Trademark application submitted to FCC successfully.')
    }

    clearDraft()
    router.push(buildApplicationDetailsRoute(nextRecord.serviceKey, nextRecord.applicationId))
  } catch (error) {
    ElMessage.error(error?.message || 'Failed to save application')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  if (route.query.step != null) {
    stepIndex.value = Number(route.query.step)
  }

  resetServiceSpecificFields()

  if (!isEditMode.value && route.query.requestType) {
    const requestedType = String(route.query.requestType)
    form.trademarkRecordation.requestType = requestedType
    form.requestType = requestedType
  }

  if (!isEditMode.value && route.query.sourceApplicationId) {
    form.trademarkRecordation.currentRecordationNumber = String(route.query.sourceApplicationId)
  }

  if (authStore.email && !form.contactEmail) {
    form.contactEmail = authStore.email
  }

  if (authStore.fullName && !form.contactPersonName) {
    form.contactPersonName = authStore.fullName
  }

  if (authStore.email && !form.contactPersonEmail) {
    form.contactPersonEmail = authStore.email
  }

  await dataStore.ensureProcessTemplate()
  await loadExisting()

  if (!isEditMode.value && route.query.cloneFrom) {
    try {
      const source = await dataStore.getApplicationById(String(route.query.cloneFrom), { serviceKey: props.serviceKey })
      if (source) {
        mapApplicationToForm(source)
        form.fileNumber = ''
        form.paymentControlNumber = ''
        form.paymentReferenceNumber = ''
        form.paymentStatus = 'Pending'
        form.amountPaid = 0
        form.dateReceived = new Date().toISOString().slice(0, 10)
        if (form.trademarkRecordation?.payment) {
          form.trademarkRecordation.payment.controlNumber = ''
          form.trademarkRecordation.payment.referenceNumber = ''
          form.trademarkRecordation.payment.amountPaid = 0
          form.trademarkRecordation.payment.status = 'pending_control_number'
        }
        ElMessage.success('Application data cloned. Review and submit as a new application.')
      }
    } catch {
      ElMessage.warning('Could not load source application for cloning.')
    }
  }

  // Pre-fill from profile for new applications (not edit, not clone)
  if (!isEditMode.value && !route.query.cloneFrom) {
    try {
      const profile = await fetchApplicantProfile({
        email: authStore.email,
        userId: authStore.userId
      })
      if (profile) {
        const applicant = profile.applicant || {}
        const applicantType = String(applicant.type || '').toLowerCase().includes('individual') ? 'individual' : 'firm'

        if (!form.applicantType || form.applicantType === 'firm') form.applicantType = applicantType
        if (!form.companyName) form.companyName = applicant.companyName || profile.companyName || ''
        if (!form.registrationNumber) form.registrationNumber = applicant.registrationNumber || ''
        if (!form.countryOfIncorporation) form.countryOfIncorporation = applicant.countryOfIncorporation || 'Tanzania'
        if (!form.firstName) form.firstName = applicant.firstName || ''
        if (!form.surname) form.surname = applicant.surname || ''
        if (!form.nationalId) form.nationalId = applicant.nationalId || ''
        if (!form.countryOfResidence) form.countryOfResidence = applicant.countryOfResidence || 'Tanzania'
        if (!form.contactEmail) form.contactEmail = applicant.email || profile.email || authStore.email || ''
        if (!form.phoneNumber) form.phoneNumber = applicant.phoneNumber || profile.phoneNumber || ''
        if (!form.contactPersonName) form.contactPersonName = applicant.contactPerson?.name || ''
        if (!form.contactPersonEmail) form.contactPersonEmail = applicant.contactPerson?.email || ''
        if (!form.contactPersonPhone) form.contactPersonPhone = applicant.contactPerson?.phoneNumber || ''
        if (!form.postalAddress) form.postalAddress = applicant.postalAddress || profile.postalAddress || ''
        if (!form.physicalAddress) form.physicalAddress = applicant.physicalAddress || profile.physicalAddress || ''
        if (!form.businessDescription) form.businessDescription = applicant.businessDescription || profile.businessDescription || ''
      }
    } catch {
      // Profile fetch failed — not critical, no pre-fill
    }
  }

  captureSnapshot()

  if (!isEditMode.value) {
    checkForExistingDraft()
  }
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
</script>

<template>
  <section>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-2xl font-semibold">{{ pageTitle }}</h2>
        <p class="mt-1 text-sm text-slate-600">
          Complete the wizard to {{ isEditMode ? 'update' : 'submit' }} your {{ service.label.toLowerCase() }} request.
        </p>
      </div>
      <router-link :to="overviewRoute">
        <el-button>Back to {{ service.label }}</el-button>
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

    <MobileStepNavigator
      :steps="wizardSteps"
      :current-step="stepIndex"
      @update:current-step="stepIndex = $event"
    />

    <el-steps :active="stepIndex" class="mt-6 hidden lg:flex">
      <el-step v-for="step in wizardSteps" :key="step.title" :title="step.title" />
    </el-steps>

    <h2
      ref="stepHeadingRef"
      tabindex="-1"
      class="sr-only outline-none"
    >
      Step {{ stepIndex + 1 }} of {{ wizardSteps.length }}: {{ wizardSteps[stepIndex]?.title }}
    </h2>

    <div v-if="showResumePrompt" class="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
      <p class="text-sm font-medium text-blue-800 dark:text-blue-200">
        You have an unsaved draft from a previous session. Would you like to resume?
      </p>
      <div class="mt-3 flex gap-2">
        <el-button type="primary" size="small" @click="resumeDraft">Resume Draft</el-button>
        <el-button size="small" @click="discardDraft">Start Fresh</el-button>
      </div>
    </div>

    <el-form
      ref="formRef"
      class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"
      label-position="top"
      :model="form"
      :rules="rules"
      v-loading="loadingExisting"
    >
      <template v-if="stepIndex === 0">
        <el-form-item label="Date Received" prop="dateReceived">
          <el-date-picker v-model="form.dateReceived" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>

        <el-form-item label="Sector" prop="sector">
          <el-input v-model="form.sector" placeholder="e.g. Intellectual Property" />
        </el-form-item>

        <el-form-item label="File Number (optional)" prop="fileNumber">
          <el-input v-model="form.fileNumber" placeholder="FCC-TM-XXXX" />
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

      <template v-if="stepIndex === 1">
        <el-form-item label="Owner Full Name" prop="trademarkRecordation.ownerFullName">
          <el-input v-model="form.trademarkRecordation.ownerFullName" />
        </el-form-item>
        <el-form-item label="Owner Category" prop="trademarkRecordation.ownerCategory">
          <el-select v-model="form.trademarkRecordation.ownerCategory">
            <el-option label="Corporate Owner" value="Corporate Owner" />
            <el-option label="Individual Owner" value="Individual Owner" />
            <el-option label="Authorized Agent" value="Authorized Agent" />
          </el-select>
        </el-form-item>
        <el-form-item label="Owner Business Address" prop="trademarkRecordation.ownerBusinessAddress" class="md:col-span-2">
          <el-input v-model="form.trademarkRecordation.ownerBusinessAddress" />
        </el-form-item>
        <el-form-item label="Owner Nationality / Jurisdiction" prop="trademarkRecordation.ownerNationalityOrJurisdiction">
          <el-input v-model="form.trademarkRecordation.ownerNationalityOrJurisdiction" />
        </el-form-item>
        <div class="md:col-span-2">
          <p class="mb-2 text-sm font-semibold text-slate-600">Applicant Information</p>
          <ApplicantInfoStep v-model="applicantModel" />
        </div>

        <div class="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-600">Submitted Trademarks</h3>
            <el-button size="small" type="primary" plain @click="addTrademarkRow">Add Trademark</el-button>
          </div>

          <div
            v-for="(trademark, index) in form.trademarkRecordation.trademarks"
            :key="trademark.submissionId || index"
            class="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-2"
          >
            <el-input v-model="trademark.trademarkName" placeholder="Trademark name" />
            <el-input v-model="trademark.classOfGoods" placeholder="Class of goods (e.g. Class 9, 35)" />
            <el-select v-model="trademark.representationType">
              <el-option label="Word Mark" value="Word Mark" />
              <el-option label="Device Mark" value="Device Mark" />
              <el-option label="Combined Mark" value="Combined Mark" />
            </el-select>
            <el-input v-model="trademark.countryOfOrigin" placeholder="Country of origin" />
            <el-input v-model="trademark.registrationReference" class="md:col-span-2" placeholder="Registration reference" />
            <el-input v-model="trademark.registrationCertificateNumber" class="md:col-span-2" placeholder="Registration certificate number" />
            <el-input v-model="trademark.notes" class="md:col-span-2" type="textarea" :rows="2" placeholder="Trademark notes (optional)" />
            <div class="md:col-span-2">
              <el-button size="small" type="danger" plain @click="removeTrademarkRow(index)">Remove Trademark</el-button>
            </div>
          </div>
        </div>

        <el-form-item label="Place(s) of Manufacture" class="md:col-span-2">
          <el-input v-model="form.trademarkRecordation.goodsManufacturePlaces" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="Licensed Foreign Users" class="md:col-span-2">
          <el-input v-model="form.trademarkRecordation.licensedUsers" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="Affiliated Companies Abroad" class="md:col-span-2">
          <el-input v-model="form.trademarkRecordation.affiliatedCompanies" type="textarea" :rows="2" />
        </el-form-item>
      </template>

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

        <el-form-item v-if="!['agent_appointment', 'discontinuation'].includes(form.trademarkRecordation.requestType)" label="Additional Notes" class="md:col-span-2">
          <el-input v-model="form.trademarkRecordation.notes" type="textarea" :rows="3" />
        </el-form-item>
      </template>

      <template v-if="stepIndex === 3">
        <div class="md:col-span-2">
          <TrademarkAttachmentManager
            v-model="form.trademarkRecordation.attachments"
            :required-documents="trademarkDocuments"
          />
        </div>
      </template>

      <template v-if="stepIndex === 4">
        <div class="md:col-span-2">
          <TrademarkPaymentPanel
            v-model="form.trademarkRecordation.payment"
            :expected-amount="Number(calculatedFees.total || 0)"
            :payment-required="trademarkPaymentRequired"
          />
        </div>

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
          <el-checkbox v-model="form.trademarkRecordation.declarationAccepted">
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
              :type="!trademarkPaymentRequired || ['paid', 'verified'].includes(String(form.trademarkRecordation.payment.status || '').toLowerCase()) ? 'success' : 'warning'"
              effect="light"
            >
              {{
                !trademarkPaymentRequired || ['paid', 'verified'].includes(String(form.trademarkRecordation.payment.status || '').toLowerCase())
                  ? 'Payment condition met'
                  : 'Payment not yet complete'
              }}
            </el-tag>
          </div>
        </div>
      </template>
    </el-form>

    <div class="mt-2 flex items-center gap-2">
      <el-button v-if="stepIndex > 0" @click="previousStep">Previous</el-button>
      <el-button v-if="stepIndex < wizardSteps.length - 1" type="primary" @click="nextStep">Next</el-button>
      <el-button v-else type="primary" :loading="submitting" data-test="application-submit" @click="submit">
        {{ isEditMode ? 'Save Updates' : 'Submit Application' }}
      </el-button>
      <span v-if="lastSaved" class="text-xs text-slate-400 dark:text-slate-500">
        Draft saved {{ new Date(lastSaved).toLocaleTimeString() }}
      </span>
    </div>

    <button
      class="fixed bottom-6 right-6 z-40 flex h-12 items-center gap-2 rounded-2xl bg-fcc-brand px-5 text-sm font-semibold text-white shadow-lg transition hover:bg-fcc-brand/90"
      @click="previewDrawerVisible = true"
    >
      <i class="fa-solid fa-eye" />
      Preview
    </button>

    <ApplicationCompletenessDrawer
      :visible="previewDrawerVisible"
      :service-key="serviceKey"
      :form-data="form"
      :current-step-index="stepIndex"
      @close="previewDrawerVisible = false"
      @jump-to-step="jumpToStep"
      @open-full-preview="openFullPreview"
    />
  </section>
</template>
