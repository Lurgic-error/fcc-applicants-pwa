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
import GePGPaymentPanel from '@/components/forms/GePGPaymentPanel.vue'
import {
  generateTrademarkControlNumber,
  verifyTrademarkPaymentByControlNumber
} from '@/services/applicantApi'

const EXEMPTION_FEE = 180000

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
const overviewRoute = computed(() => buildServiceOverviewRoute(props.serviceKey))
const isEditMode = computed(() => props.mode === 'update')
const pageTitle = computed(() => `${isEditMode.value ? 'Update' : 'New'} ${service.value.label}`)

const wizardSteps = [
  { title: 'Applicant' },
  { title: 'Exemption Details' },
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
  exemption: {
    exemptionType: '',
    agreementDescription: '',
    partiesInvolved: '',
    relevantMarket: '',
    justification: '',
    durationYears: 1,
    attachments: []
  },
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

const feeItems = computed(() => [
  {
    label: 'Exemption Application Fee',
    description: form.exemption.exemptionType || 'Exemption',
    amount: EXEMPTION_FEE
  }
])

const rules = computed(() => ({
  'applicant.email': [{ required: true, type: 'email', message: 'Valid email is required', trigger: 'blur' }],
  'exemption.exemptionType': [{ required: true, message: 'Exemption type is required', trigger: 'change' }],
  'exemption.agreementDescription': [{ required: true, message: 'Agreement description is required', trigger: 'blur' }],
  'exemption.justification': [{ required: true, message: 'Justification is required', trigger: 'blur' }]
}))

const stepFieldMap = [
  ['applicant.email'],
  ['exemption.exemptionType', 'exemption.agreementDescription', 'exemption.justification'],
  [],
  []
]

async function validateCurrentStep() {
  if (!formRef.value) return true
  const fields = stepFieldMap[stepIndex.value] || []
  if (fields.length) {
    await formRef.value.validateField(fields)
  }
  if (stepIndex.value === 3 && !form.declaration.accepted) {
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
      amountDue: payment.amountDue || EXEMPTION_FEE,
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
      status: paid >= EXEMPTION_FEE ? 'paid' : 'pending_payment'
    }
    if (paid >= EXEMPTION_FEE) {
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

async function ensureApplicantProfile() {
  try {
    const isCompany = form.applicant.type === 'company'
    const applicantData = {
      applicantType: isCompany ? 'firm' : 'individual',
      companyName: isCompany ? (form.applicant.companyName || undefined) : undefined,
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
    } catch { /* no profile */ }
    await registerApplicantAccount(applicantData)
  } catch (err) {
    console.warn('[ExemptionWizard] Could not sync applicant profile:', err?.message || err)
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
    contactPerson: {
      name: applicant.contactPerson?.name || '',
      designation: applicant.contactPerson?.designation || '',
      email: applicant.contactPerson?.email || '',
      phone: applicant.contactPerson?.phone || ''
    }
  })

  Object.assign(form.exemption, {
    exemptionType: serviceDetails.exemptionType || raw.exemptionType || '',
    agreementDescription: serviceDetails.agreementDescription || raw.agreementDescription || '',
    partiesInvolved: serviceDetails.partiesInvolved || raw.partiesInvolved || '',
    relevantMarket: serviceDetails.relevantMarket || raw.relevantMarket || '',
    justification: serviceDetails.justification || raw.justification || '',
    durationYears: Number(serviceDetails.durationYears || raw.durationYears || 1)
  })

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
    if (!form.declaration.accepted) throw new Error('Accept the declaration before submitting.')

    await ensureApplicantProfile()

    const isCompany = form.applicant.type === 'company'
    const payload = {
      serviceKey: props.serviceKey,
      serviceType: props.serviceKey,
      applicant: {
        type: isCompany ? 'firm' : 'individual',
        ...(isCompany
          ? { companyName: form.applicant.companyName, registrationNumber: form.applicant.registrationNumber }
          : { firstName: form.applicant.firstName, surname: form.applicant.surname }),
        email: form.applicant.email,
        phoneNumber: form.applicant.phoneNumber,
        postalAddress: form.applicant.postalAddress,
        physicalAddress: form.applicant.physicalAddress
      },
      exemption: { ...form.exemption },
      applicationFee: EXEMPTION_FEE,
      payment: { ...form.payment },
      declaration: { ...form.declaration }
    }

    const persisted = isEditMode.value
      ? await dataStore.updateApplication(String(route.params.id), payload, { serviceKey: props.serviceKey })
      : await dataStore.submitApplication(payload, { serviceKey: props.serviceKey })

    ElMessage.success(`${service.value.label} application ${isEditMode.value ? 'updated' : 'submitted'} successfully`)
    clearDraft()
    router.push(buildApplicationDetailsRoute(persisted.serviceKey, persisted.applicationId))
  } catch (error) {
    ElMessage.error(error?.message || 'Failed to save application')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  if (route.query.step != null) stepIndex.value = Number(route.query.step)
  if (authStore.email && !form.applicant.email) form.applicant.email = authStore.email

  await dataStore.ensureProcessTemplate?.()
  await loadExisting()

  if (!isEditMode.value && !route.query.cloneFrom) {
    try {
      const profile = await fetchApplicantProfile({ email: authStore.email, userId: authStore.userId })
      if (profile) {
        const applicant = profile.applicant || {}
        if (!form.applicant.email) form.applicant.email = applicant.email || authStore.email || ''
        if (!form.applicant.firstName) form.applicant.firstName = applicant.firstName || ''
        if (!form.applicant.surname) form.applicant.surname = applicant.surname || ''
        if (!form.applicant.phoneNumber) form.applicant.phoneNumber = applicant.phoneNumber || ''
        if (!form.applicant.companyName) form.applicant.companyName = applicant.companyName || ''
      }
    } catch { /* ignore */ }
  }

  captureSnapshot()
  if (!isEditMode.value) checkForExistingDraft()
})
</script>

<template>
  <section>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-2xl font-semibold">{{ pageTitle }}</h2>
        <p class="mt-1 text-sm text-slate-600">
          Complete the wizard to {{ isEditMode ? 'update' : 'submit' }} your exemption application.
        </p>
      </div>
      <router-link :to="overviewRoute">
        <el-button>Back to {{ service.label }}</el-button>
      </router-link>
    </div>

    <el-steps :active="stepIndex" class="mt-6 hidden lg:flex">
      <el-step v-for="step in wizardSteps" :key="step.title" :title="step.title" />
    </el-steps>

    <div class="mt-4 flex items-center gap-2 text-sm text-slate-500 lg:hidden">
      <span class="font-semibold text-slate-800">Step {{ stepIndex + 1 }}</span> of {{ wizardSteps.length }}: {{ wizardSteps[stepIndex]?.title }}
    </div>

    <h2 ref="stepHeadingRef" tabindex="-1" class="sr-only outline-none">
      Step {{ stepIndex + 1 }} of {{ wizardSteps.length }}: {{ wizardSteps[stepIndex]?.title }}
    </h2>

    <div v-if="showResumePrompt" class="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
      <p class="text-sm font-medium text-blue-800">You have an unsaved draft. Resume?</p>
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

      <!-- Step 1: Exemption Details -->
      <template v-if="stepIndex === 1">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <el-form-item label="Exemption Type" prop="exemption.exemptionType" class="md:col-span-2">
            <el-select v-model="form.exemption.exemptionType" placeholder="Select exemption type">
              <el-option label="Block Exemption" value="Block Exemption" />
              <el-option label="Individual Exemption" value="Individual Exemption" />
              <el-option label="Temporary Exemption" value="Temporary Exemption" />
            </el-select>
          </el-form-item>

          <el-form-item label="Agreement Description" prop="exemption.agreementDescription" class="md:col-span-2">
            <el-input
              v-model="form.exemption.agreementDescription"
              type="textarea"
              :rows="4"
              placeholder="Describe the agreement or arrangement for which exemption is sought"
            />
          </el-form-item>

          <el-form-item label="Parties Involved" prop="exemption.partiesInvolved">
            <el-input v-model="form.exemption.partiesInvolved" placeholder="Names of parties involved" />
          </el-form-item>

          <el-form-item label="Relevant Market" prop="exemption.relevantMarket">
            <el-input v-model="form.exemption.relevantMarket" placeholder="Define the relevant market" />
          </el-form-item>

          <el-form-item label="Justification" prop="exemption.justification" class="md:col-span-2">
            <el-input
              v-model="form.exemption.justification"
              type="textarea"
              :rows="4"
              placeholder="Provide justification for the exemption request"
            />
          </el-form-item>

          <el-form-item label="Duration Requested (Years)" prop="exemption.durationYears">
            <el-input-number v-model="form.exemption.durationYears" :min="1" controls-position="right" />
          </el-form-item>

          <div class="md:col-span-2">
            <el-form-item label="Supporting Documents (PDF)">
              <el-upload
                v-model:file-list="form.exemption.attachments"
                accept=".pdf"
                :auto-upload="false"
                multiple
              >
                <el-button>Select PDF Files</el-button>
                <template #tip>
                  <div class="el-upload__tip">Only .pdf files are accepted</div>
                </template>
              </el-upload>
            </el-form-item>
          </div>
        </div>
      </template>

      <!-- Step 2: Payment -->
      <template v-if="stepIndex === 2">
        <GePGPaymentPanel
          v-model="form.payment"
          :expected-amount="EXEMPTION_FEE"
          :payment-required="true"
          :payer-name="payerName"
          :payer-email="form.applicant.email"
          :payer-phone="form.applicant.phoneNumber"
          @generate-control-number="handleGenerateControlNumber"
          @verify-payment="handleVerifyPayment"
        />
      </template>

      <!-- Step 3: Review & Submit -->
      <template v-if="stepIndex === 3">
        <div class="space-y-6">
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Applicant</h3>
            <div class="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              <template v-if="form.applicant.type === 'individual'">
                <div><span class="text-slate-500">Name:</span> {{ form.applicant.firstName }} {{ form.applicant.surname }}</div>
                <div><span class="text-slate-500">Email:</span> {{ form.applicant.email }}</div>
              </template>
              <template v-else>
                <div><span class="text-slate-500">Company:</span> {{ form.applicant.companyName }}</div>
                <div><span class="text-slate-500">Email:</span> {{ form.applicant.email }}</div>
              </template>
            </div>
          </div>

          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Exemption Details</h3>
            <div class="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              <div><span class="text-slate-500">Type:</span> {{ form.exemption.exemptionType || '—' }}</div>
              <div><span class="text-slate-500">Duration:</span> {{ form.exemption.durationYears }} year(s)</div>
              <div class="md:col-span-2"><span class="text-slate-500">Relevant Market:</span> {{ form.exemption.relevantMarket || '—' }}</div>
              <div class="md:col-span-2"><span class="text-slate-500">Parties:</span> {{ form.exemption.partiesInvolved || '—' }}</div>
            </div>
          </div>

          <ApplicationFeeSummary :items="feeItems" currency="TZS" />

          <div class="rounded-xl border border-slate-200 bg-white p-4">
            <el-checkbox v-model="form.declaration.accepted">
              I declare that the information provided is accurate and complete to the best of my knowledge.
            </el-checkbox>
            <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <el-form-item label="Full Name">
                <el-input v-model="form.declaration.name" placeholder="Signatory full name" />
              </el-form-item>
              <el-form-item label="Title / Designation">
                <el-input v-model="form.declaration.title" placeholder="e.g. CEO, Director" />
              </el-form-item>
              <el-form-item label="Date">
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
  </section>
</template>
