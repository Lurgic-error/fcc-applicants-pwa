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
  getApplicationProcessStages,
  getApplicationServiceFields
} from '@/constants/applicationProcesses'
import { calculateServiceFees } from '@/constants/applicationServiceRules'
import ApplicationCompletenessDrawer from '@/components/ApplicationCompletenessDrawer.vue'
import ApplicantInfoStep from './ApplicantInfoStep.vue'
import MobileStepNavigator from '@/components/MobileStepNavigator.vue'
import {
  fetchApplicantProfile,
  registerApplicantAccount,
  updateApplicantProfile
} from '@/services/applicantApi'
import SchemaWizardShell from './SchemaWizardShell.vue'
import WizardShell from './WizardShell.vue'
import WizardSidebar from './WizardSidebar.vue'
import { useApplicantDataStore } from '@/stores/applications'
import { useApplicantServiceCatalogStore } from '@/stores/serviceCatalog'
import { useAuthStore } from '@/stores/auth'
import { useAutoSave } from '@/composables/useAutoSave'
import { getFieldHelp } from '@/constants/fieldHelpText'

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
const catalogStore = useApplicantServiceCatalogStore()
const authStore = useAuthStore()

const catalogProfile = ref(null)

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
const isFirmApplicant = computed(() => form.applicantType === 'firm')
const isSfccService = computed(() => props.serviceKey === 'sfcc-registration')
const isMergerService = computed(() => props.serviceKey === 'merger-clearance')
const mergerServiceFieldKeys = new Set([
  'transactionType',
  'partiesInvolved',
  'estimatedTurnover',
  'transactionValue',
  'targetFirmName',
  'targetFirmBusiness',
  'acquisitionDescription',
  'commercialRationale',
  'relevantMarketDefinition',
  'confidentialityClaimRequired',
  'confidentialityStatement'
])
const hiddenGenericFields = computed(() => {
  if (isMergerService.value) {
    return mergerServiceFieldKeys
  }
  return new Set()
})
const serviceFields = computed(() =>
  getApplicationServiceFields(props.serviceKey).filter((field) => !hiddenGenericFields.value.has(field.key))
)

const hasSchemaFields = computed(() =>
  catalogProfile.value?.steps?.some(s => (s.structuredFields?.length > 0) || (s.repeatableGroups?.length > 0))
)

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

const wizardSteps = [
  { key: 'application', title: 'Application' },
  { key: 'applicant', title: 'Applicant' }
]

const sidebarSteps = computed(() => wizardSteps.map(s => ({ key: s.key, label: s.title })))
const currentStepKey = computed(() => wizardSteps[stepIndex.value]?.key || '')

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

function createTrademarkRecordation() {
  return {
    requestType: 'new_recordation',
    trademarkName: '',
    classOfGoods: '',
    representationType: 'Combined Mark',
    countryOfOrigin: 'Tanzania',
    registrationReference: '',
    registrationCertificateNumber: '',
    trademarks: [],
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
    attachments: [],
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

function createContract() {
  return {
    contractId: '',
    contractName: '',
    contractCategory: '',
    language: 'English',
    pages: 1,
    notes: ''
  }
}

function createTrademarkVersion() {
  return {
    versionId: '',
    versionTag: '',
    markName: '',
    purpose: 'Initial Filing',
    classCount: 1,
    notes: ''
  }
}

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

const { lastSavedAt: lastSaved, hasDraft: showResumePrompt, save: saveDraft, restore: resumeDraft, clearDraft } = useAutoSave(
  `fcc_wizard_draft_${props.serviceKey}`,
  { value: form },
  { onRestore: (data) => Object.assign(form, data) }
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

  nextRules.contactEmail = [{ required: true, type: 'email', message: 'Valid email is required', trigger: 'blur' }]
  nextRules.phoneNumber = [{ required: true, message: 'Phone number is required', trigger: 'blur' }]
  nextRules.postalAddress = [{ required: true, message: 'Postal address is required', trigger: 'blur' }]
  nextRules.physicalAddress = [{ required: true, message: 'Physical address is required', trigger: 'blur' }]
  nextRules.businessDescription = [{ required: true, message: 'Description is required', trigger: 'blur' }]

  if (isFirmApplicant.value) {
    nextRules.companyName = [{ required: true, message: 'Company name is required', trigger: 'blur' }]
    nextRules.registrationNumber = [{ required: true, message: 'Registration number is required', trigger: 'blur' }]
    nextRules.contactPersonName = [{ required: true, message: 'Contact person name is required', trigger: 'blur' }]
    nextRules.contactPersonEmail = [{ required: true, type: 'email', message: 'Contact person email is required', trigger: 'blur' }]
    nextRules.contactPersonPhone = [{ required: true, message: 'Contact person phone is required', trigger: 'blur' }]
  } else {
    nextRules.firstName = [{ required: true, message: 'First name is required', trigger: 'blur' }]
    nextRules.surname = [{ required: true, message: 'Surname is required', trigger: 'blur' }]
  }

  for (const field of serviceFields.value) {
    if (field.required) {
      nextRules[field.key] = [{ required: true, message: `${field.label} is required`, trigger: 'blur' }]
    }
  }

  if (isMergerService.value) {
    nextRules['mergerClearance.targetFirmName'] = [
      { required: true, message: 'Target firm name is required', trigger: 'blur' }
    ]
    nextRules['mergerClearance.targetFirmBusiness'] = [
      { required: true, message: 'Target firm business description is required', trigger: 'blur' }
    ]
    nextRules['mergerClearance.acquisitionDescription'] = [
      { required: true, message: 'Acquisition description is required', trigger: 'blur' }
    ]
    nextRules['mergerClearance.commercialRationale'] = [
      { required: true, message: 'Commercial rationale is required', trigger: 'blur' }
    ]
    nextRules['mergerClearance.relevantMarketDefinition'] = [
      { required: true, message: 'Relevant market definition is required', trigger: 'blur' }
    ]
    nextRules['mergerClearance.confidentialityStatement'] = [
      {
        validator: (_rule, value, callback) => {
          if (form.mergerClearance.confidentialityClaimRequired && !String(value || '').trim()) {
            callback(new Error('Provide confidentiality statement for FCC-2 claim.'))
            return
          }
          callback()
        },
        trigger: 'blur'
      }
    ]
  }

  return nextRules
})

const stepFieldMap = computed(() => {
  const mergerStep0Fields = isMergerService.value
    ? [
        'mergerClearance.transactionType',
        'mergerClearance.partiesInvolved',
        'mergerClearance.estimatedTurnover',
        'mergerClearance.transactionValue',
        'mergerClearance.targetFirmName',
        'mergerClearance.targetFirmBusiness',
        'mergerClearance.acquisitionDescription',
        'mergerClearance.commercialRationale',
        'mergerClearance.relevantMarketDefinition',
        'mergerClearance.confidentialityStatement'
      ]
    : []
  const step0Fields = [
    'dateReceived',
    'sector',
    'fileNumber',
    'paymentStatus',
    ...serviceFields.value.map((item) => item.key),
    ...mergerStep0Fields
  ]

  // Step 1 combines applicant identity + contacts (handled by ApplicantInfoStep component)
  const step1Fields = isFirmApplicant.value
    ? ['applicantType', 'companyName', 'registrationNumber', 'countryOfIncorporation', 'contactPersonName', 'contactPersonEmail', 'contactPersonPhone', 'contactEmail', 'phoneNumber', 'postalAddress', 'physicalAddress', 'businessDescription']
    : ['applicantType', 'firstName', 'surname', 'nationalId', 'countryOfResidence', 'contactEmail', 'phoneNumber', 'postalAddress', 'physicalAddress', 'businessDescription']

  return [step0Fields, step1Fields]
})

function resetServiceSpecificFields() {
  for (const field of serviceFields.value) {
    if (typeof form[field.key] === 'undefined') {
      form[field.key] = field.type === 'number' ? null : ''
    }
  }

  if (!Array.isArray(form.trademarkVersions)) {
    form.trademarkVersions = []
  }
  if (!Array.isArray(form.contracts)) {
    form.contracts = []
  }

  if (isSfccService.value && form.contracts.length === 0) {
    form.contracts.push(createContract())
  }
}

function mapApplicationToForm(application) {
  const raw = application?.raw || {}
  const applicant = raw.applicant || {}
  const serviceDetails = raw.serviceDetails || raw.metadata?.serviceDetails || {}

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
    requestType: 'new_recordation',
    trademarkRecordation: createTrademarkRecordation(),

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
      (raw.transactionType || raw.mergerNotification || raw.confidentialityClaim
        ? {
            transactionType: raw.transactionType || 'Merger',
            partiesInvolved: (raw.parties || []).map((party) => party.name).filter(Boolean).join(', '),
            estimatedTurnover: raw.turnover || null,
            transactionValue: raw.assetsValue || null,
            targetFirmName: raw.mergerNotification?.targetFirm?.name || '',
            targetFirmBusiness: raw.mergerNotification?.targetFirm?.businessDescription || '',
            acquisitionDescription: raw.mergerNotification?.acquisitionNarrative || '',
            commercialRationale: raw.mergerNotification?.commercialRationale || '',
            relevantMarketDefinition: raw.mergerNotification?.relevantMarketDefinition || '',
            confidentialityClaimRequired: Boolean(raw.confidentialityClaim?.hasClaim),
            confidentialityStatement: raw.confidentialityClaim?.statement || ''
          }
        : {
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
          })
  })

  for (const field of serviceFields.value) {
    form[field.key] = serviceDetails[field.key] ?? raw[field.key] ?? form[field.key] ?? (field.type === 'number' ? null : '')
  }

  if (isSfccService.value && form.contracts.length === 0) {
    form.contracts.push(createContract())
  }
}

function getFieldDataTest(fieldKey) {
  return `application-${fieldKey.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
}

function addTrademarkVersion() {
  form.trademarkVersions.push(createTrademarkVersion())
}

function removeTrademarkVersion(index) {
  form.trademarkVersions.splice(index, 1)
}

function addContract() {
  form.contracts.push(createContract())
}

function removeContract(index) {
  form.contracts.splice(index, 1)
  if (isSfccService.value && form.contracts.length === 0) {
    form.contracts.push(createContract())
  }
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

    await ensureApplicantProfile()

    const persisted = isEditMode.value
      ? await dataStore.updateApplication(String(route.params.id), { ...form }, { serviceKey: props.serviceKey })
      : await dataStore.submitApplication({ ...form }, { serviceKey: props.serviceKey })

    if (isEditMode.value) {
      ElMessage.success(`${service.value.label} application updated successfully`)
      clearDraft()
      router.push(buildApplicationDetailsRoute(persisted.serviceKey, persisted.applicationId))
      return
    }

    ElMessage.success(`${service.value.label} application submitted successfully`)
    clearDraft()
    router.push(buildApplicationDetailsRoute(persisted.serviceKey, persisted.applicationId))
  } catch (error) {
    ElMessage.error(error?.message || 'Failed to save application')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  catalogProfile.value = await catalogStore.fetchServiceProfile(props.serviceKey)

  if (route.query.step != null) {
    stepIndex.value = Number(route.query.step)
  }

  resetServiceSpecificFields()

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
    resumeDraft()
  }
})

watch(
  calculatedFees,
  (fees) => {
    form.applicationFee = Number(fees.total || 0)
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <WizardShell
    :title="service.label"
    :subtitle="isEditMode ? 'Edit Application' : 'New Application'"
    :step-title="wizardSteps[stepIndex]?.title || ''"
    :current-step-index="stepIndex"
    :total-steps="wizardSteps.length"
    :is-first-step="stepIndex === 0"
    :is-last-step="stepIndex >= wizardSteps.length - 1"
    :submitting="submitting"
    :last-saved="lastSaved"
    :back-route="overviewRoute"
    :submit-label="isEditMode ? 'Save Updates' : 'Submit Application'"
    :loading="loadingExisting"
    @previous="previousStep"
    @next="nextStep"
    @submit="submit"
    @save-draft="saveDraft"
  >
    <template #sidebar>
      <WizardSidebar
        :steps="sidebarSteps"
        :current-step-key="currentStepKey"
        @step-click="(key) => { stepIndex = wizardSteps.findIndex(s => s.key === key) }"
      />
    </template>

    <h2
      ref="stepHeadingRef"
      tabindex="-1"
      class="sr-only outline-none"
    >
      Step {{ stepIndex + 1 }} of {{ wizardSteps.length }}: {{ wizardSteps[stepIndex]?.title }}
    </h2>

    <div v-if="showResumePrompt" class="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
      <p class="text-sm font-medium text-blue-800 dark:text-blue-200">
        You have an unsaved draft from a previous session. Would you like to resume?
      </p>
      <div class="mt-3 flex gap-2">
        <el-button type="primary" @click="resumeDraft">Resume Draft</el-button>
        <el-button @click="clearDraft">Start Fresh</el-button>
      </div>
    </div>

    <el-form
      ref="formRef"
      class="grid grid-cols-1 gap-4 md:grid-cols-2"
      label-position="top"
      :model="form"
      :rules="rules"
    >
      <template v-if="stepIndex === 0">
        <el-form-item prop="dateReceived" data-test="application-date">
          <template #label>
            Date Received
            <el-tooltip :content="getFieldHelp('dateReceived')" placement="top" :show-after="300">
              <i class="fa-solid fa-circle-question ml-1 text-xs text-slate-400 cursor-help" />
            </el-tooltip>
          </template>
          <el-date-picker v-model="form.dateReceived" type="date" value-format="YYYY-MM-DD" data-test="application-date" />
        </el-form-item>

        <el-form-item prop="sector" data-test="application-sector">
          <template #label>
            Sector
            <el-tooltip :content="getFieldHelp('sector')" placement="top" :show-after="300">
              <i class="fa-solid fa-circle-question ml-1 text-xs text-slate-400 cursor-help" />
            </el-tooltip>
          </template>
          <el-input v-model="form.sector" placeholder="e.g. Telecommunications" data-test="application-sector" />
        </el-form-item>

        <el-form-item prop="applicationFee" data-test="application-fee">
          <template #label>
            Calculated Application Fee (TZS)
            <el-tooltip :content="getFieldHelp('applicationFee')" placement="top" :show-after="300">
              <i class="fa-solid fa-circle-question ml-1 text-xs text-slate-400 cursor-help" />
            </el-tooltip>
          </template>
          <el-input-number v-model="form.applicationFee" :min="0" controls-position="right" :controls="false" readonly data-test="application-fee" />
        </el-form-item>

        <el-form-item label="File Number (optional)" prop="fileNumber" data-test="application-file-number">
          <el-input v-model="form.fileNumber" data-test="application-file-number" />
        </el-form-item>

        <el-form-item label="Payment Status" prop="paymentStatus" data-test="application-payment-status">
          <el-select v-model="form.paymentStatus">
            <el-option label="Pending" value="Pending" />
            <el-option label="Completed" value="Completed" />
            <el-option label="Not Processed" value="Not Processed" />
          </el-select>
        </el-form-item>

        <el-form-item label="Amount Paid (TZS)" prop="amountPaid">
          <el-input-number v-model="form.amountPaid" :min="0" controls-position="right" />
        </el-form-item>

        <el-form-item label="Payment Control Number" prop="paymentControlNumber">
          <el-input v-model="form.paymentControlNumber" />
        </el-form-item>

        <el-form-item label="Payment Reference Number" prop="paymentReferenceNumber">
          <el-input v-model="form.paymentReferenceNumber" />
        </el-form-item>

        <el-form-item
          v-for="field in serviceFields"
          :key="field.key"
          :prop="field.key"
          class="md:col-span-2"
          :data-test="getFieldDataTest(field.key)"
        >
          <template #label>
            {{ field.label }}
            <el-tooltip v-if="getFieldHelp(field.key)" :content="getFieldHelp(field.key)" placement="top" :show-after="300">
              <i class="fa-solid fa-circle-question ml-1 text-xs text-slate-400 cursor-help" />
            </el-tooltip>
          </template>

          <el-input-number
            v-if="field.type === 'number'"
            v-model="form[field.key]"
            :min="0"
            controls-position="right"
            :data-test="getFieldDataTest(field.key)"
          />

          <el-select v-else-if="field.type === 'select'" v-model="form[field.key]" :data-test="getFieldDataTest(field.key)">
            <el-option v-for="option in field.options || []" :key="option" :label="option" :value="option" />
          </el-select>

          <el-input
            v-else-if="field.type === 'textarea'"
            v-model="form[field.key]"
            type="textarea"
            :rows="4"
            :data-test="getFieldDataTest(field.key)"
          />

          <el-input v-else v-model="form[field.key]" :data-test="getFieldDataTest(field.key)" />
        </el-form-item>

        <div v-if="isSfccService" class="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50 md:col-span-2">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-600">Submitted Contracts</h3>
            <el-button type="primary" plain @click="addContract">Add Contract</el-button>
          </div>

          <div v-for="(contract, index) in form.contracts" :key="`ctr-${index}`" class="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 p-3 md:grid-cols-2">
            <el-input v-model="contract.contractName" placeholder="Contract Name" />
            <el-input v-model="contract.contractCategory" placeholder="Contract Category" />
            <el-input v-model="contract.language" placeholder="Language" />
            <el-input-number v-model="contract.pages" :min="1" controls-position="right" placeholder="Pages" />
            <el-input v-model="contract.notes" class="md:col-span-2" placeholder="Contract notes" />
            <div class="md:col-span-2">
              <el-button type="danger" plain @click="removeContract(index)">Remove Contract</el-button>
            </div>
          </div>
        </div>

        <div v-if="isMergerService" class="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50 md:col-span-2">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-600">Merger Notification (FCC-8)</h3>
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <el-form-item prop="mergerClearance.transactionType" class="mb-0">
              <template #label>
                Transaction Type
                <el-tooltip :content="getFieldHelp('transactionType')" placement="top" :show-after="300">
                  <i class="fa-solid fa-circle-question ml-1 text-xs text-slate-400 cursor-help" />
                </el-tooltip>
              </template>
              <el-select v-model="form.mergerClearance.transactionType">
                <el-option label="Merger" value="Merger" />
                <el-option label="Acquisition" value="Acquisition" />
                <el-option label="Joint Venture" value="Joint Venture" />
              </el-select>
            </el-form-item>

            <el-form-item prop="mergerClearance.transactionValue" class="mb-0">
              <template #label>
                Transaction Value (TZS)
                <el-tooltip :content="getFieldHelp('transactionValue')" placement="top" :show-after="300">
                  <i class="fa-solid fa-circle-question ml-1 text-xs text-slate-400 cursor-help" />
                </el-tooltip>
              </template>
              <el-input-number v-model="form.mergerClearance.transactionValue" :min="0" controls-position="right" placeholder="Transaction Value (TZS)" />
            </el-form-item>

            <el-form-item prop="mergerClearance.estimatedTurnover" class="mb-0">
              <template #label>
                Estimated Turnover (TZS)
                <el-tooltip :content="getFieldHelp('estimatedTurnover')" placement="top" :show-after="300">
                  <i class="fa-solid fa-circle-question ml-1 text-xs text-slate-400 cursor-help" />
                </el-tooltip>
              </template>
              <el-input-number v-model="form.mergerClearance.estimatedTurnover" :min="0" controls-position="right" placeholder="Estimated Turnover (TZS)" />
            </el-form-item>

            <el-form-item prop="mergerClearance.partiesInvolved" class="md:col-span-2 mb-0">
              <template #label>
                Parties Involved
                <el-tooltip :content="getFieldHelp('partiesInvolved')" placement="top" :show-after="300">
                  <i class="fa-solid fa-circle-question ml-1 text-xs text-slate-400 cursor-help" />
                </el-tooltip>
              </template>
              <el-input v-model="form.mergerClearance.partiesInvolved" placeholder="Parties involved" />
            </el-form-item>

            <el-form-item prop="mergerClearance.targetFirmName" class="md:col-span-2 mb-0">
              <template #label>
                Target Firm Name
                <el-tooltip :content="getFieldHelp('targetFirmName')" placement="top" :show-after="300">
                  <i class="fa-solid fa-circle-question ml-1 text-xs text-slate-400 cursor-help" />
                </el-tooltip>
              </template>
              <el-input v-model="form.mergerClearance.targetFirmName" placeholder="Target firm name" />
            </el-form-item>

            <el-form-item prop="mergerClearance.targetFirmBusiness" class="md:col-span-2 mb-0">
              <template #label>
                Target Firm Business
                <el-tooltip :content="getFieldHelp('targetFirmBusiness')" placement="top" :show-after="300">
                  <i class="fa-solid fa-circle-question ml-1 text-xs text-slate-400 cursor-help" />
                </el-tooltip>
              </template>
              <el-input v-model="form.mergerClearance.targetFirmBusiness" type="textarea" :rows="2" placeholder="Target firm business description" />
            </el-form-item>

            <el-form-item prop="mergerClearance.acquisitionDescription" class="md:col-span-2 mb-0">
              <template #label>
                Acquisition Description
                <el-tooltip :content="getFieldHelp('acquisitionDescription')" placement="top" :show-after="300">
                  <i class="fa-solid fa-circle-question ml-1 text-xs text-slate-400 cursor-help" />
                </el-tooltip>
              </template>
              <el-input v-model="form.mergerClearance.acquisitionDescription" type="textarea" :rows="3" placeholder="Nature and details of the acquisition" />
            </el-form-item>

            <el-form-item prop="mergerClearance.commercialRationale" class="md:col-span-2 mb-0">
              <template #label>
                Commercial Rationale
                <el-tooltip :content="getFieldHelp('commercialRationale')" placement="top" :show-after="300">
                  <i class="fa-solid fa-circle-question ml-1 text-xs text-slate-400 cursor-help" />
                </el-tooltip>
              </template>
              <el-input v-model="form.mergerClearance.commercialRationale" type="textarea" :rows="3" placeholder="Commercial rationale for the acquisition" />
            </el-form-item>

            <el-form-item prop="mergerClearance.relevantMarketDefinition" class="md:col-span-2 mb-0">
              <template #label>
                Relevant Market Definition
                <el-tooltip :content="getFieldHelp('relevantMarketDefinition')" placement="top" :show-after="300">
                  <i class="fa-solid fa-circle-question ml-1 text-xs text-slate-400 cursor-help" />
                </el-tooltip>
              </template>
              <el-input v-model="form.mergerClearance.relevantMarketDefinition" type="textarea" :rows="3" placeholder="Relevant market definition" />
            </el-form-item>
          </div>

          <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-600">Confidentiality Claim (FCC-2)</h3>
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <el-switch
              v-model="form.mergerClearance.confidentialityClaimRequired"
              inline-prompt
              active-text="Claim"
              inactive-text="No claim"
              class="md:col-span-2"
            />
            <el-form-item prop="mergerClearance.confidentialityStatement" class="md:col-span-2 mb-0">
              <template #label>
                Confidentiality Statement
                <el-tooltip :content="getFieldHelp('confidentialityStatement')" placement="top" :show-after="300">
                  <i class="fa-solid fa-circle-question ml-1 text-xs text-slate-400 cursor-help" />
                </el-tooltip>
              </template>
              <el-input
                v-model="form.mergerClearance.confidentialityStatement"
                type="textarea"
                :rows="3"
                :disabled="!form.mergerClearance.confidentialityClaimRequired"
                placeholder="Statement of confidentiality and summary of claimed information"
              />
            </el-form-item>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50 md:col-span-2">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-600">Application Fees Breakdown</h3>
          <ul class="mt-2 space-y-2 text-sm">
            <li v-for="row in calculatedFees.breakdown" :key="row.lineId" class="flex items-center justify-between rounded-md bg-white px-3 py-2">
              <span>{{ row.label }}</span>
              <span class="font-semibold">{{ Number(row.amount || 0).toLocaleString() }} {{ calculatedFees.currency }}</span>
            </li>
            <li class="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 px-1 pt-2 font-semibold">
              <span>Total</span>
              <span>{{ Number(calculatedFees.total || 0).toLocaleString() }} {{ calculatedFees.currency }}</span>
            </li>
          </ul>
        </div>

        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50 md:col-span-2">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-600">Planning References</h3>
          <div class="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
            <el-input v-model="form.activity" placeholder="Activity ID / Reference" />
            <el-input v-model="form.task" placeholder="Task ID / Reference" />
            <el-input v-model="form.directorate" placeholder="Directorate ID / Reference" />
            <el-input v-model="form.section" placeholder="Section ID / Reference" />
            <el-input v-model="form.office" placeholder="Office ID / Reference" />
          </div>
        </div>
      </template>

      <template v-if="stepIndex === 1">
        <div class="md:col-span-2">
          <ApplicantInfoStep v-model="applicantModel" />
        </div>
      </template>
    </el-form>

    <ApplicationCompletenessDrawer
      :visible="previewDrawerVisible"
      :service-key="serviceKey"
      :form-data="form"
      :current-step-index="stepIndex"
      @close="previewDrawerVisible = false"
      @jump-to-step="jumpToStep"
      @open-full-preview="openFullPreview"
    />
  </WizardShell>
</template>
