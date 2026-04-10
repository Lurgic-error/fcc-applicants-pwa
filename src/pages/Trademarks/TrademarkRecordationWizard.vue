<script setup>
/**
 * Trademark Recordation Wizard — Main Page
 *
 * Left-sidebar navigation with nested sub-steps, auto-save, draft resume,
 * profile pre-fill, route leave guard, and lazy-loaded step components.
 * Follows the merger FCC-8 wizard pattern.
 */
import { computed, defineAsyncComponent, nextTick, onMounted, provide, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useDeepForm } from '@/composables/useDeepForm'
import { useAutoSave } from '@/composables/useAutoSave'
import {
  TRADEMARK_WIZARD_STEPS,
  TRADEMARK_FLAT_STEP_KEYS,
  createTrademarkFormState,
  isTrademarkPaymentRequired,
  labelTrademarkRequestType
} from '@/constants/trademarkRecordation'
import WizardSidebar from '@/components/wizards/WizardSidebar.vue'
import MobileStepNavigator from '@/components/MobileStepNavigator.vue'
import { useApplicantDataStore } from '@/stores/applications'
import { useAuthStore } from '@/stores/auth'
import { fetchApplicantProfile } from '@/services/applicantApi'

// ── Step components (lazy-loaded) ─────────────────────────────────────
const stepComponentMap = {
  'request-type': defineAsyncComponent(() => import('@/components/trademark/steps/StepRequestType.vue')),
  'applicant-identity': defineAsyncComponent(() => import('@/components/trademark/steps/StepApplicantIdentity.vue')),
  'brand-owner': defineAsyncComponent(() => import('@/components/trademark/steps/StepBrandOwner.vue')),
  'trademark-details': defineAsyncComponent(() => import('@/components/trademark/steps/StepTrademarkDetails.vue')),
  'affiliated-companies': defineAsyncComponent(() => import('@/components/trademark/steps/StepAffiliatedCompanies.vue')),
  'manufacturers': defineAsyncComponent(() => import('@/components/trademark/steps/StepManufacturers.vue')),
  'authorized-parties': defineAsyncComponent(() => import('@/components/trademark/steps/StepAuthorizedParties.vue')),
  'trademark-visuals': defineAsyncComponent(() => import('@/components/trademark/steps/StepTrademarkVisuals.vue')),
  'request-details': defineAsyncComponent(() => import('@/components/trademark/steps/StepRequestDetails.vue')),
  'documents': defineAsyncComponent(() => import('@/components/trademark/steps/StepDocuments.vue')),
  'payment-declaration': defineAsyncComponent(() => import('@/components/trademark/steps/StepPaymentDeclaration.vue')),
}

const router = useRouter()
const route = useRoute()
const dataStore = useApplicantDataStore()
const authStore = useAuthStore()

// ── Form state ────────────────────────────────────────────────────────
const { form, get, set, toPlain, reset } = useDeepForm(createTrademarkFormState())

provide('wizardForm', form)
provide('wizardGet', get)
provide('wizardSet', set)

// ── Refs ──────────────────────────────────────────────────────────────
const currentStepKey = ref(TRADEMARK_FLAT_STEP_KEYS[0])
const stepHeadingRef = ref(null)
const contentRef = ref(null)
const showResumeDraftDialog = ref(false)
const submitting = ref(false)

// ── Auto-save ─────────────────────────────────────────────────────────
const { lastSavedAt, hasDraft, save: saveDraft, restore: restoreDraft, clearDraft } = useAutoSave(
  'trademark-recordation',
  ref(form),
  { onRestore: (data) => Object.assign(form, data) }
)

// ── Navigation computeds ──────────────────────────────────────────────
const currentFlatIndex = computed(() => TRADEMARK_FLAT_STEP_KEYS.indexOf(currentStepKey.value))
const isFirstStep = computed(() => currentFlatIndex.value === 0)
const isLastStep = computed(() => currentFlatIndex.value === TRADEMARK_FLAT_STEP_KEYS.length - 1)
const currentComponent = computed(() => stepComponentMap[currentStepKey.value] ?? null)

/** Find the label for the current step key by searching TRADEMARK_WIZARD_STEPS */
const currentStepLabel = computed(() => {
  for (const step of TRADEMARK_WIZARD_STEPS) {
    if (step.key === currentStepKey.value) return step.label
    if (step.children) {
      const child = step.children.find(c => c.key === currentStepKey.value)
      if (child) return child.label
    }
  }
  return ''
})

/** mobileSteps maps flat keys to { title } objects for MobileStepNavigator */
const mobileSteps = computed(() =>
  TRADEMARK_FLAT_STEP_KEYS.map(key => {
    for (const step of TRADEMARK_WIZARD_STEPS) {
      if (step.key === key) return { title: step.label }
      if (step.children) {
        const child = step.children.find(c => c.key === key)
        if (child) return { title: child.label }
      }
    }
    return { title: key }
  })
)

// ── Focus step heading on step change ────────────────────────────────
watch(currentStepKey, () => {
  nextTick(() => {
    stepHeadingRef.value?.focus()
  })
})

// ── Navigation ────────────────────────────────────────────────────────
function goToStep(stepKey) {
  if (!TRADEMARK_FLAT_STEP_KEYS.includes(stepKey)) return
  currentStepKey.value = stepKey
  saveDraft()
  nextTick(() => {
    contentRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

function nextStep() {
  const nextIdx = currentFlatIndex.value + 1
  if (nextIdx < TRADEMARK_FLAT_STEP_KEYS.length) {
    goToStep(TRADEMARK_FLAT_STEP_KEYS[nextIdx])
  }
}

function previousStep() {
  const prevIdx = currentFlatIndex.value - 1
  if (prevIdx >= 0) {
    goToStep(TRADEMARK_FLAT_STEP_KEYS[prevIdx])
  }
}

function handleSidebarClick(stepKey) {
  goToStep(stepKey)
}

function handleMobileStepChange(flatIndex) {
  const key = TRADEMARK_FLAT_STEP_KEYS[flatIndex]
  if (key) goToStep(key)
}

// ── Manual save draft ─────────────────────────────────────────────────
function saveManualDraft() {
  try {
    saveDraft()
    ElMessage.success('Draft saved')
  } catch {
    ElMessage.warning('Could not save draft')
  }
}

// ── Draft resume dialog ───────────────────────────────────────────────
async function handleResumeDraft() {
  showResumeDraftDialog.value = false
  await restoreDraft()
  ElMessage.success('Draft restored')
}

function handleStartFresh() {
  showResumeDraftDialog.value = false
  reset()
  clearDraft()
}

// ── Submit logic ──────────────────────────────────────────────────────
async function submitApplication() {
  // Validate declaration
  if (!form.declarationAccepted) {
    ElMessage.warning('Please accept the declaration before submitting.')
    return
  }

  // Validate payment if required
  if (isTrademarkPaymentRequired(form.requestType) && form.payment.status !== 'paid') {
    ElMessage.warning('Payment must be completed before submitting.')
    return
  }

  try {
    await ElMessageBox.confirm(
      'Are you sure you want to submit this trademark recordation application? You will not be able to edit it after submission.',
      'Submit Application',
      { confirmButtonText: 'Submit', cancelButtonText: 'Cancel', type: 'warning' }
    )
  } catch {
    return
  }

  submitting.value = true
  try {
    await dataStore.submitApplication(toPlain(), { serviceKey: 'trademark-recordation' })
    await clearDraft()
    ElMessage.success('Application submitted successfully')
    router.push({ name: 'trademarks-overview' })
  } catch (err) {
    ElMessage.error(err?.message || 'Submission failed. Please try again.')
  } finally {
    submitting.value = false
  }
}

// ── Route leave guard ─────────────────────────────────────────────────
const formSnapshot = ref('')

function captureSnapshot() {
  formSnapshot.value = JSON.stringify(toPlain())
}

const isDirty = computed(() => {
  if (!formSnapshot.value) return false
  return JSON.stringify(toPlain()) !== formSnapshot.value
})

onBeforeRouteLeave(async () => {
  if (!isDirty.value) return true
  try {
    await ElMessageBox.confirm(
      'You have unsaved changes. Would you like to save a draft before leaving?',
      'Unsaved Changes',
      {
        distinguishCancelAndClose: true,
        confirmButtonText: 'Save & Leave',
        cancelButtonText: 'Leave Without Saving',
        type: 'warning'
      }
    )
    saveDraft()
    return true
  } catch (action) {
    // 'cancel' means "Leave Without Saving", 'close' means stay
    return action === 'cancel'
  }
})

// ── On mount: check draft, pre-fill profile ───────────────────────────
onMounted(async () => {
  // Check for an existing draft
  if (hasDraft.value) {
    showResumeDraftDialog.value = true
  }

  // Pre-fill from applicant profile
  try {
    const profile = await fetchApplicantProfile({
      email: authStore.email,
      userId: authStore.userId
    })
    if (profile && !showResumeDraftDialog.value) {
      const applicant = profile.applicant || {}
      const applicantType = String(applicant.type || '').toLowerCase().includes('individual')
        ? 'individual'
        : 'firm'

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
    // Profile fetch failed — not critical, continue without pre-fill
  }

  captureSnapshot()
})
</script>

<template>
  <div class="trademark-wizard">

    <!-- ── Resume Draft Dialog ──────────────────────────────────────── -->
    <el-dialog
      v-model="showResumeDraftDialog"
      title="Resume Draft"
      width="420px"
      :close-on-click-modal="false"
      :show-close="false"
    >
      <p class="text-sm text-slate-600">
        You have an unsaved draft from a previous session. Would you like to resume where you left off?
      </p>
      <template #footer>
        <el-button @click="handleStartFresh">Start Fresh</el-button>
        <el-button type="primary" @click="handleResumeDraft">Resume Draft</el-button>
      </template>
    </el-dialog>

    <!-- ── Header ──────────────────────────────────────────────────── -->
    <div class="trademark-wizard__header">
      <div>
        <h1 class="trademark-wizard__title">Trademark Recordation</h1>
        <p class="trademark-wizard__subtitle">{{ labelTrademarkRequestType(form.requestType) }}</p>
      </div>
      <div class="trademark-wizard__header-actions">
        <span v-if="lastSavedAt" class="trademark-wizard__last-saved">
          Saved {{ lastSavedAt.toLocaleTimeString() }}
        </span>
        <el-button plain size="small" @click="saveManualDraft">Save Draft</el-button>
      </div>
    </div>

    <!-- ── Mobile navigator (hidden on lg+) ───────────────────────── -->
    <div class="lg:hidden px-4 py-2" style="flex-shrink: 0">
      <MobileStepNavigator
        :steps="mobileSteps"
        :current-step="currentFlatIndex"
        @update:current-step="handleMobileStepChange"
      />
    </div>

    <!-- ── Body: sidebar + content ─────────────────────────────────── -->
    <div class="trademark-wizard__body">
      <WizardSidebar
        :steps="TRADEMARK_WIZARD_STEPS"
        :current-step-key="currentStepKey"
        title="Trademark Recordation"
        :subtitle="labelTrademarkRequestType(form.requestType)"
        @step-click="handleSidebarClick"
      />

      <main ref="contentRef" class="trademark-wizard__content">
        <div class="trademark-wizard__content-inner">
          <h2
            ref="stepHeadingRef"
            tabindex="-1"
            class="text-base font-bold text-slate-800 mb-1 outline-none"
          >
            {{ currentStepLabel }}
          </h2>
          <component :is="currentComponent" v-if="currentComponent" />
        </div>
      </main>
    </div>

    <!-- ── Footer ──────────────────────────────────────────────────── -->
    <div class="trademark-wizard__footer">
      <el-button :disabled="isFirstStep" @click="previousStep">Previous</el-button>

      <div class="trademark-wizard__footer-right">
        <el-button plain size="small" @click="saveManualDraft">Save Draft</el-button>
        <el-button
          v-if="isLastStep"
          type="primary"
          :loading="submitting"
          @click="submitApplication"
        >
          Submit Application
        </el-button>
        <el-button v-else type="primary" @click="nextStep">Next</el-button>
      </div>
    </div>

  </div>
</template>

<style scoped>
.trademark-wizard {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden; /* outer shell never scrolls */
  background: var(--fcc-bg-canvas, #f1f5f9);
}

.trademark-wizard__header {
  padding: 0.75rem 1rem;
  background: var(--fcc-bg-surface, #fff);
  border-bottom: 1px solid var(--fcc-border, #dbe3ef);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.trademark-wizard__title {
  margin: 0;
  font-size: var(--fcc-text-lg, 1rem);
  font-weight: 800;
  color: var(--fcc-text-primary, #0f172a);
  font-family: var(--fcc-font-heading, 'Outfit', sans-serif);
  letter-spacing: -0.01em;
}

.trademark-wizard__subtitle {
  margin: 0;
  font-size: var(--fcc-text-xs, 0.75rem);
  color: var(--fcc-text-muted, #64748b);
}

.trademark-wizard__header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.trademark-wizard__last-saved {
  font-size: 0.75rem;
  color: var(--fcc-text-muted, #64748b);
}

.trademark-wizard__body {
  display: flex;
  flex: 1;
  min-height: 0; /* allows flex children to shrink below content size */
  overflow: hidden; /* prevents body-level scroll */
}

.trademark-wizard__content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.trademark-wizard__content-inner {
}

.trademark-wizard__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--fcc-bg-surface, #fff);
  border-top: 1px solid var(--fcc-border, #dbe3ef);
  flex-shrink: 0;
}

.trademark-wizard__footer-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
