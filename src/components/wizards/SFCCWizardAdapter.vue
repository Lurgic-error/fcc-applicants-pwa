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
  fetchApplicantProfile,
  registerApplicantAccount,
  updateApplicantProfile
} from '@/services/applicantApi'
import { useApplicantDataStore } from '@/stores/applications'
import { useAuthStore } from '@/stores/auth'
import { useAutoSave } from '@/composables/useAutoSave'
import ApplicantInfoStep from '@/components/wizards/ApplicantInfoStep.vue'
import ApplicationFeeSummary from '@/components/wizards/ApplicationFeeSummary.vue'
import SFCCContractDialog from '@/components/wizards/SFCCContractDialog.vue'
import GePGPaymentPanel from '@/components/forms/GePGPaymentPanel.vue'
import {
  generateTrademarkControlNumber,
  verifyTrademarkPaymentByControlNumber
} from '@/services/applicantApi'

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
const contractDialogVisible = ref(false)
const editingContract = ref(null)
const editingContractIndex = ref(-1)

watch(stepIndex, () => {
  nextTick(() => {
    stepHeadingRef.value?.focus()
  })
})

const service = computed(() => getApplicationServiceByKey(props.serviceKey))
const overviewRoute = computed(() => buildServiceOverviewRoute(props.serviceKey))
const isEditMode = computed(() => props.mode === 'update')
const pageTitle = computed(() => `${isEditMode.value ? 'Update' : 'New'} ${service.value.label}`)

const wizardSteps = [
  { title: 'Applicant' },
  { title: 'Business Information' },
  { title: 'Contracts' },
  { title: 'Fee Summary' },
  { title: 'Payment' },
  { title: 'Review & Submit' }
]

const form = reactive({
  applicant: {
    type: 'individual',
    firstName: '',
    surname: '',
    email: '',
    phoneNumber: '',
    nationality: '',
    nationalId: '',
    dateOfBirth: '',
    postalAddress: '',
    physicalAddress: '',
    companyName: '',
    registrationNumber: '',
    countryOfIncorporation: '',
    businessDescription: '',
    contactPerson: { name: '', designation: '', email: '', phone: '' }
  },
  business: {
    companyName: '',
    registrationNumber: '',
    tin: '',
    address: '',
    contactPerson: '',
    businessDescription: ''
  },
  contracts: [],
  payment: {
    status: 'pending_control_number',
    controlNumber: '',
    referenceNumber: '',
    amountPaid: 0,
    paidAt: '',
    receiptNumber: ''
  },
  declaration: {
    accepted: false,
    name: '',
    title: '',
    date: new Date().toISOString().slice(0, 10)
  }
})

const payerName = computed(() => {
  if (form.applicant.type === 'company') return form.applicant.companyName || ''
  return [form.applicant.firstName, form.applicant.surname].filter(Boolean).join(' ')
})

const { lastSaved, showResumePrompt, saveDraft, resumeDraft, discardDraft, clearDraft, checkForExistingDraft } = useAutoSave(
  `fcc_wizard_draft_${props.serviceKey}`,
  () => ({ ...form }),
  (data) => Object.assign(form, data)
)

const formSnapshot = ref('')

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

// Fee computed
const feeItems = computed(() =>
  form.contracts.map((c, i) => ({
    label: `Contract #${i + 1}: ${c.title || 'Untitled'}`,
    description: c.purpose || '',
    amount: 95000
  }))
)

const totalFee = computed(() => feeItems.value.reduce((s, i) => s + i.amount, 0))

// Validation rules
const rules = computed(() => ({
  'applicant.email': [{ required: true, type: 'email', message: 'Valid email is required', trigger: 'blur' }],
  'applicant.firstName': [
    {
      validator: (_rule, value, callback) => {
        if (form.applicant.type === 'individual' && !String(value || '').trim()) {
          callback(new Error('First name is required'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  'applicant.companyName': [
    {
      validator: (_rule, value, callback) => {
        if (form.applicant.type === 'company' && !String(value || '').trim()) {
          callback(new Error('Company name is required'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  'business.companyName': [{ required: true, message: 'Company name is required', trigger: 'blur' }],
  'business.registrationNumber': [{ required: true, message: 'Registration number is required', trigger: 'blur' }],
  'business.businessDescription': [{ required: true, message: 'Business description is required', trigger: 'blur' }]
}))

const stepFieldMap = [
  ['applicant.email', 'applicant.firstName', 'applicant.companyName'],
  ['business.companyName', 'business.registrationNumber', 'business.businessDescription'],
  [],
  [],
  [],
  []
]

async function validateCurrentStep() {
  if (!formRef.value) return true
  const fields = stepFieldMap[stepIndex.value] || []
  if (fields.length) {
    await formRef.value.validateField(fields)
  }

  if (stepIndex.value === 2 && form.contracts.length === 0) {
    throw new Error('Add at least one contract before continuing.')
  }

  if (stepIndex.value === 5 && !form.declaration.accepted) {
    throw new Error('Accept the declaration before submitting.')
  }

  return true
}

async function handleGenerateControlNumber() {
  if (!existingApplication.value?.applicationId) {
    ElMessage.warning('Please save a draft first before generating a control number.')
    return
  }
  try {
    const result = await generateTrademarkControlNumber(existingApplication.value.applicationId)
    const payment = result?.payment || {}
    form.payment = {
      ...form.payment,
      controlNumber: payment.controlNumber || result?.controlNumber || '',
      amountDue: payment.amountDue || totalFee.value,
      amountPaid: payment.amountPaid || 0,
      status: 'control_number_issued'
    }
    ElMessage.success('Control number generated successfully.')
  } catch (err) {
    ElMessage.error(err?.message || 'Failed to generate control number. Please try again.')
  }
}

async function handleVerifyPayment(controlNumber) {
  if (!controlNumber) return
  try {
    const result = await verifyTrademarkPaymentByControlNumber(controlNumber, {
      applicationId: existingApplication.value?.applicationId || ''
    })
    const bill = result?.bill || result || {}
    const paid = Number(bill.amountPaid || bill.paidAmount || 0)
    form.payment = {
      ...form.payment,
      amountPaid: paid,
      paidAt: bill.paidAt || '',
      referenceNumber: bill.referenceNumber || '',
      receiptNumber: bill.receiptNumber || '',
      status: paid >= totalFee.value ? 'paid' : 'pending_payment'
    }
    if (paid >= totalFee.value) {
      ElMessage.success('Payment confirmed!')
    } else if (paid > 0) {
      ElMessage.warning(`Partial payment received: TZS ${paid.toLocaleString()}`)
    } else {
      ElMessage.info('Payment not yet received. Please check again later.')
    }
  } catch (err) {
    ElMessage.error(err?.message || 'Failed to verify payment.')
  }
}

async function nextStep() {
  try {
    await validateCurrentStep()
    saveDraft()
    stepIndex.value = Math.min(stepIndex.value + 1, wizardSteps.length - 1)
  } catch (error) {
    if (error?.message) ElMessage.warning(error.message)
  }
}

function previousStep() {
  saveDraft()
  stepIndex.value = Math.max(stepIndex.value - 1, 0)
}

// Contract management
function openAddContract() {
  editingContract.value = null
  editingContractIndex.value = -1
  contractDialogVisible.value = true
}

function openEditContract(index) {
  editingContract.value = { ...form.contracts[index] }
  editingContractIndex.value = index
  contractDialogVisible.value = true
}

function removeContract(index) {
  form.contracts.splice(index, 1)
}

function handleContractSave(contractData) {
  if (editingContractIndex.value >= 0) {
    form.contracts[editingContractIndex.value] = contractData
  } else {
    form.contracts.push(contractData)
  }
}

// Applicant profile sync
async function ensureApplicantProfile() {
  try {
    const isCompany = form.applicant.type === 'company'
    const applicantData = {
      applicantType: isCompany ? 'firm' : 'individual',
      companyName: isCompany ? (form.applicant.companyName || undefined) : undefined,
      registrationNumber: isCompany ? (form.applicant.registrationNumber || undefined) : undefined,
      firstName: !isCompany ? (form.applicant.firstName || undefined) : undefined,
      surname: !isCompany ? (form.applicant.surname || undefined) : undefined,
      email: form.applicant.email || undefined,
      phoneNumber: form.applicant.phoneNumber || undefined,
      postalAddress: form.applicant.postalAddress || undefined,
      physicalAddress: form.applicant.physicalAddress || undefined
    }
    try {
      const profile = await fetchApplicantProfile()
      if (profile?.applicantId) {
        await updateApplicantProfile({ applicantId: profile.applicantId, changes: applicantData })
        return
      }
    } catch {
      // no existing profile
    }
    await registerApplicantAccount(applicantData)
  } catch (err) {
    console.warn('[SFCCWizard] Could not sync applicant profile:', err?.message || err)
  }
}

function mapApplicationToForm(application) {
  const raw = application?.raw || {}
  const applicant = raw.applicant || {}
  const serviceDetails = raw.serviceDetails || raw.metadata?.serviceDetails || {}
  const isIndividual = String(applicant.type || '').toLowerCase().includes('individual')

  Object.assign(form.applicant, {
    type: isIndividual ? 'individual' : 'company',
    firstName: applicant.firstName || '',
    surname: applicant.surname || '',
    email: applicant.email || applicant.contactPerson?.email || authStore.email || '',
    phoneNumber: applicant.phoneNumber || '',
    nationalId: applicant.nationalId || '',
    postalAddress: applicant.postalAddress || '',
    physicalAddress: applicant.physicalAddress || '',
    companyName: applicant.companyName || '',
    registrationNumber: applicant.registrationNumber || '',
    countryOfIncorporation: applicant.countryOfIncorporation || '',
    businessDescription: applicant.businessDescription || '',
    contactPerson: {
      name: applicant.contactPerson?.name || '',
      designation: applicant.contactPerson?.designation || '',
      email: applicant.contactPerson?.email || '',
      phone: applicant.contactPerson?.phoneNumber || applicant.contactPerson?.phone || ''
    }
  })

  Object.assign(form.business, {
    companyName: serviceDetails.companyName || raw.companyName || applicant.companyName || '',
    registrationNumber: serviceDetails.registrationNumber || raw.registrationNumber || applicant.registrationNumber || '',
    tin: serviceDetails.tin || raw.tin || '',
    address: serviceDetails.address || raw.address || applicant.postalAddress || '',
    contactPerson: serviceDetails.contactPerson || raw.contactPerson || '',
    businessDescription: serviceDetails.businessDescription || raw.businessDescription || applicant.businessDescription || ''
  })

  form.contracts = Array.isArray(raw.contracts)
    ? raw.contracts
    : Array.isArray(serviceDetails.contracts)
      ? serviceDetails.contracts
      : []

  const rawPayment = raw.payment || {}
  Object.assign(form.payment, {
    status: rawPayment.status || 'pending_control_number',
    controlNumber: rawPayment.controlNumber || '',
    referenceNumber: rawPayment.referenceNumber || '',
    amountPaid: Number(rawPayment.amountPaid || 0),
    paidAt: rawPayment.paidAt || '',
    receiptNumber: rawPayment.receiptNumber || ''
  })
}

async function loadExisting() {
  if (!isEditMode.value) return

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

async function submit() {
  if (!formRef.value) return

  submitting.value = true
  try {
    await formRef.value.validate()

    if (form.contracts.length === 0) {
      throw new Error('Add at least one contract before submitting.')
    }

    if (!form.declaration.accepted) {
      throw new Error('Accept the declaration before submitting.')
    }

    await ensureApplicantProfile()

    const isCompany = form.applicant.type === 'company'
    const payload = {
      serviceKey: props.serviceKey,
      serviceType: props.serviceKey,
      applicant: {
        type: isCompany ? 'firm' : 'individual',
        ...(isCompany
          ? {
              companyName: form.applicant.companyName,
              registrationNumber: form.applicant.registrationNumber,
              countryOfIncorporation: form.applicant.countryOfIncorporation,
              businessDescription: form.applicant.businessDescription,
              contactPerson: form.applicant.contactPerson
            }
          : {
              firstName: form.applicant.firstName,
              surname: form.applicant.surname,
              nationalId: form.applicant.nationalId,
              dateOfBirth: form.applicant.dateOfBirth,
              nationality: form.applicant.nationality
            }),
        email: form.applicant.email,
        phoneNumber: form.applicant.phoneNumber,
        postalAddress: form.applicant.postalAddress,
        physicalAddress: form.applicant.physicalAddress
      },
      business: { ...form.business },
      contracts: form.contracts,
      applicationFee: totalFee.value,
      payment: { ...form.payment },
      declaration: { ...form.declaration }
    }

    const persisted = isEditMode.value
      ? await dataStore.updateApplication(String(route.params.id), payload, { serviceKey: props.serviceKey })
      : await dataStore.submitApplication(payload, { serviceKey: props.serviceKey })

    if (isEditMode.value) {
      ElMessage.success(`${service.value.label} application updated successfully`)
    } else {
      ElMessage.success(`${service.value.label} application submitted successfully`)
    }
    clearDraft()
    router.push(buildApplicationDetailsRoute(persisted.serviceKey, persisted.applicationId))
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

  if (authStore.email && !form.applicant.email) {
    form.applicant.email = authStore.email
  }

  await dataStore.ensureProcessTemplate?.()
  await loadExisting()

  if (!isEditMode.value && !route.query.cloneFrom) {
    try {
      const profile = await fetchApplicantProfile({ email: authStore.email, userId: authStore.userId })
      if (profile) {
        const applicant = profile.applicant || {}
        const isIndividual = String(applicant.type || '').toLowerCase().includes('individual')
        form.applicant.type = isIndividual ? 'individual' : 'company'
        if (!form.applicant.firstName) form.applicant.firstName = applicant.firstName || ''
        if (!form.applicant.surname) form.applicant.surname = applicant.surname || ''
        if (!form.applicant.email) form.applicant.email = applicant.email || profile.email || authStore.email || ''
        if (!form.applicant.phoneNumber) form.applicant.phoneNumber = applicant.phoneNumber || ''
        if (!form.applicant.companyName) form.applicant.companyName = applicant.companyName || profile.companyName || ''
        if (!form.applicant.registrationNumber) form.applicant.registrationNumber = applicant.registrationNumber || ''
        if (!form.applicant.postalAddress) form.applicant.postalAddress = applicant.postalAddress || ''
        if (!form.applicant.physicalAddress) form.applicant.physicalAddress = applicant.physicalAddress || ''
        if (!form.business.companyName) form.business.companyName = applicant.companyName || profile.companyName || ''
        if (!form.business.registrationNumber) form.business.registrationNumber = applicant.registrationNumber || ''
        if (!form.business.businessDescription) form.business.businessDescription = applicant.businessDescription || ''
      }
    } catch {
      // profile fetch not critical
    }
  }

  captureSnapshot()

  if (!isEditMode.value) {
    checkForExistingDraft()
  }
})
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

    <MobileStepNavigator
      v-if="false"
      :steps="wizardSteps"
      :current-step="stepIndex"
      @update:current-step="stepIndex = $event"
    />

    <el-steps :active="stepIndex" class="mt-6 hidden lg:flex">
      <el-step v-for="step in wizardSteps" :key="step.title" :title="step.title" />
    </el-steps>

    <!-- Mobile step indicator -->
    <div class="mt-4 flex items-center gap-2 text-sm text-slate-500 lg:hidden">
      <span class="font-semibold text-slate-800">Step {{ stepIndex + 1 }}</span> of {{ wizardSteps.length }}: {{ wizardSteps[stepIndex]?.title }}
    </div>

    <h2 ref="stepHeadingRef" tabindex="-1" class="sr-only outline-none">
      Step {{ stepIndex + 1 }} of {{ wizardSteps.length }}: {{ wizardSteps[stepIndex]?.title }}
    </h2>

    <div v-if="showResumePrompt" class="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
      <p class="text-sm font-medium text-blue-800">You have an unsaved draft from a previous session. Resume?</p>
      <div class="mt-3 flex gap-2">
        <el-button type="primary" size="small" @click="resumeDraft">Resume Draft</el-button>
        <el-button size="small" @click="discardDraft">Start Fresh</el-button>
      </div>
    </div>

    <el-form
      ref="formRef"
      class="mt-5"
      label-position="top"
      :model="form"
      :rules="rules"
      v-loading="loadingExisting"
    >
      <!-- Step 0: Applicant -->
      <template v-if="stepIndex === 0">
        <ApplicantInfoStep v-model="form.applicant" mode="edit" />
      </template>

      <!-- Step 1: Business Information -->
      <template v-if="stepIndex === 1">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <el-form-item label="Company Name" prop="business.companyName">
            <el-input v-model="form.business.companyName" placeholder="Registered company name" />
          </el-form-item>

          <el-form-item label="Registration Number" prop="business.registrationNumber">
            <el-input v-model="form.business.registrationNumber" placeholder="Company registration number" />
          </el-form-item>

          <el-form-item label="TIN (Tax ID)" prop="business.tin">
            <el-input v-model="form.business.tin" placeholder="Tax identification number" />
          </el-form-item>

          <el-form-item label="Contact Person" prop="business.contactPerson">
            <el-input v-model="form.business.contactPerson" placeholder="Contact person name and role" />
          </el-form-item>

          <el-form-item label="Business Address" prop="business.address" class="md:col-span-2">
            <el-input v-model="form.business.address" placeholder="Full business address" />
          </el-form-item>

          <el-form-item label="Business Description" prop="business.businessDescription" class="md:col-span-2">
            <el-input
              v-model="form.business.businessDescription"
              type="textarea"
              :rows="4"
              placeholder="Describe the nature of your business"
            />
          </el-form-item>
        </div>
      </template>

      <!-- Step 2: Contracts -->
      <template v-if="stepIndex === 2">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold text-slate-800">Submitted Contracts</h3>
          </div>

          <div v-if="!form.contracts.length" class="rounded-lg border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">
            No contracts added yet. Click "+ Add Contract" to begin.
          </div>

          <div
            v-for="(contract, index) in form.contracts"
            :key="contract.contractId || index"
            class="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4"
          >
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-slate-900">{{ contract.title || 'Untitled Contract' }}</p>
              <p v-if="contract.purpose" class="mt-0.5 text-sm text-slate-500">{{ contract.purpose }}</p>
              <p v-if="contract.partiesInvolved" class="mt-0.5 text-sm text-slate-500">Parties: {{ contract.partiesInvolved }}</p>
              <p class="mt-1 text-sm font-medium text-slate-700">95,000 TZS</p>
            </div>
            <div class="flex gap-2 flex-shrink-0">
              <el-button size="small" type="primary" plain @click="openEditContract(index)">Edit</el-button>
              <el-button size="small" type="danger" plain @click="removeContract(index)">Remove</el-button>
            </div>
          </div>

          <!-- Total row -->
          <div v-if="form.contracts.length" class="flex justify-between border-t border-slate-200 pt-3 text-sm font-semibold">
            <span>Total Fee</span>
            <span>{{ totalFee.toLocaleString() }} TZS</span>
          </div>

          <div>
            <el-button type="primary" @click="openAddContract">+ Add Contract</el-button>
          </div>
        </div>
      </template>

      <!-- Step 3: Fee Summary -->
      <template v-if="stepIndex === 3">
        <ApplicationFeeSummary :items="feeItems" currency="TZS" />
      </template>

      <!-- Step 4: Payment -->
      <template v-if="stepIndex === 4">
        <GePGPaymentPanel
          v-model="form.payment"
          :expected-amount="totalFee"
          :payment-required="true"
          :payer-name="payerName"
          :payer-email="form.applicant.email"
          :payer-phone="form.applicant.phoneNumber"
          @generate-control-number="handleGenerateControlNumber"
          @verify-payment="handleVerifyPayment"
        />
      </template>

      <!-- Step 5: Review & Submit -->
      <template v-if="stepIndex === 5">
        <div class="space-y-6">
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Applicant</h3>
            <div class="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              <template v-if="form.applicant.type === 'individual'">
                <div><span class="text-slate-500">Name:</span> {{ form.applicant.firstName }} {{ form.applicant.surname }}</div>
                <div><span class="text-slate-500">Email:</span> {{ form.applicant.email }}</div>
                <div><span class="text-slate-500">Phone:</span> {{ form.applicant.phoneNumber }}</div>
              </template>
              <template v-else>
                <div><span class="text-slate-500">Company:</span> {{ form.applicant.companyName }}</div>
                <div><span class="text-slate-500">Reg No:</span> {{ form.applicant.registrationNumber }}</div>
                <div><span class="text-slate-500">Email:</span> {{ form.applicant.email }}</div>
              </template>
            </div>
          </div>

          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Business</h3>
            <div class="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              <div><span class="text-slate-500">Company:</span> {{ form.business.companyName }}</div>
              <div><span class="text-slate-500">Reg No:</span> {{ form.business.registrationNumber }}</div>
              <div><span class="text-slate-500">TIN:</span> {{ form.business.tin || '—' }}</div>
              <div><span class="text-slate-500">Contracts:</span> {{ form.contracts.length }}</div>
            </div>
          </div>

          <ApplicationFeeSummary :items="feeItems" currency="TZS" />

          <div class="rounded-xl border border-slate-200 bg-white p-4">
            <el-checkbox v-model="form.declaration.accepted">
              I declare that the information provided is accurate and complete to the best of my knowledge.
            </el-checkbox>
            <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <el-form-item label="Full Name" prop="declaration.name">
                <el-input v-model="form.declaration.name" placeholder="Signatory full name" />
              </el-form-item>
              <el-form-item label="Title / Designation" prop="declaration.title">
                <el-input v-model="form.declaration.title" placeholder="e.g. CEO, Director" />
              </el-form-item>
              <el-form-item label="Date" prop="declaration.date">
                <el-date-picker v-model="form.declaration.date" type="date" value-format="YYYY-MM-DD" />
              </el-form-item>
            </div>
          </div>
        </div>
      </template>
    </el-form>

    <div class="mt-4 flex items-center gap-2">
      <el-button v-if="stepIndex > 0" @click="previousStep">Previous</el-button>
      <el-button v-if="stepIndex < wizardSteps.length - 1" type="primary" @click="nextStep">Next</el-button>
      <el-button
        v-else
        type="primary"
        :loading="submitting"
        :disabled="!form.declaration.accepted"
        @click="submit"
      >
        {{ isEditMode ? 'Save Updates' : 'Submit Application' }}
      </el-button>
      <span v-if="lastSaved" class="text-xs text-slate-400">
        Draft saved {{ new Date(lastSaved).toLocaleTimeString() }}
      </span>
    </div>

    <SFCCContractDialog
      v-model:visible="contractDialogVisible"
      :contract="editingContract"
      @save="handleContractSave"
    />
  </section>
</template>
