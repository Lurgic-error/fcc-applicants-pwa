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

const LEGAL_OPINION_FEE = 250000

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
  { title: 'Legal Question' },
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
  legalQuestion: {
    subjectMatter: '',
    legalQuestion: '',
    relevantFacts: '',
    applicableLaws: '',
    attachments: []
  },
  declaration: {
    accepted: false,
    name: '',
    title: '',
    date: new Date().toISOString().slice(0, 10)
  }
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
    label: 'Legal Opinion Application Fee',
    description: form.legalQuestion.subjectMatter || 'Legal Opinion',
    amount: LEGAL_OPINION_FEE
  }
])

const rules = computed(() => ({
  'applicant.email': [{ required: true, type: 'email', message: 'Valid email is required', trigger: 'blur' }],
  'legalQuestion.subjectMatter': [{ required: true, message: 'Subject matter is required', trigger: 'blur' }],
  'legalQuestion.legalQuestion': [{ required: true, message: 'Legal question is required', trigger: 'blur' }],
  'legalQuestion.relevantFacts': [{ required: true, message: 'Relevant facts are required', trigger: 'blur' }]
}))

const stepFieldMap = [
  ['applicant.email'],
  ['legalQuestion.subjectMatter', 'legalQuestion.legalQuestion', 'legalQuestion.relevantFacts'],
  []
]

async function validateCurrentStep() {
  if (!formRef.value) return true
  const fields = stepFieldMap[stepIndex.value] || []
  if (fields.length) {
    await formRef.value.validateField(fields)
  }
  if (stepIndex.value === 2 && !form.declaration.accepted) {
    throw new Error('Accept the declaration before submitting.')
  }
  return true
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
    console.warn('[LegalOpinionWizard] Could not sync applicant profile:', err?.message || err)
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

  Object.assign(form.legalQuestion, {
    subjectMatter: serviceDetails.subjectMatter || raw.subjectMatter || serviceDetails.legalIssueCategory || '',
    legalQuestion: serviceDetails.legalQuestion || raw.legalQuestion || serviceDetails.questionSummary || '',
    relevantFacts: serviceDetails.relevantFacts || raw.relevantFacts || serviceDetails.supportingFacts || '',
    applicableLaws: serviceDetails.applicableLaws || raw.applicableLaws || ''
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
      legalQuestion: { ...form.legalQuestion },
      applicationFee: LEGAL_OPINION_FEE,
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
          Complete the wizard to {{ isEditMode ? 'update' : 'submit' }} your legal opinion request.
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

      <!-- Step 1: Legal Question -->
      <template v-if="stepIndex === 1">
        <div class="grid grid-cols-1 gap-4">
          <el-form-item label="Subject Matter" prop="legalQuestion.subjectMatter">
            <el-input
              v-model="form.legalQuestion.subjectMatter"
              placeholder="e.g. Exclusivity clauses in distribution agreements"
            />
          </el-form-item>

          <el-form-item label="Legal Question" prop="legalQuestion.legalQuestion">
            <el-input
              v-model="form.legalQuestion.legalQuestion"
              type="textarea"
              :rows="4"
              placeholder="State the specific legal question(s) you require an opinion on"
            />
          </el-form-item>

          <el-form-item label="Relevant Facts" prop="legalQuestion.relevantFacts">
            <el-input
              v-model="form.legalQuestion.relevantFacts"
              type="textarea"
              :rows="4"
              placeholder="Provide the relevant facts and circumstances"
            />
          </el-form-item>

          <el-form-item label="Applicable Laws / Regulations" prop="legalQuestion.applicableLaws">
            <el-input
              v-model="form.legalQuestion.applicableLaws"
              placeholder="e.g. Fair Competition Act, CAP 285; Consumer Protection Act"
            />
          </el-form-item>

          <el-form-item label="Supporting Documents (PDF)">
            <el-upload
              v-model:file-list="form.legalQuestion.attachments"
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
      </template>

      <!-- Step 2: Review & Submit -->
      <template v-if="stepIndex === 2">
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
            <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Legal Question</h3>
            <div class="grid grid-cols-1 gap-2 text-sm">
              <div><span class="text-slate-500">Subject Matter:</span> {{ form.legalQuestion.subjectMatter || '—' }}</div>
              <div class="mt-1">
                <span class="text-slate-500">Question:</span>
                <p class="mt-0.5 text-slate-800">{{ form.legalQuestion.legalQuestion || '—' }}</p>
              </div>
              <div v-if="form.legalQuestion.applicableLaws">
                <span class="text-slate-500">Applicable Laws:</span> {{ form.legalQuestion.applicableLaws }}
              </div>
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
