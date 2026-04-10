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
      <p style="font-size: 0.875rem; color: var(--el-text-color-regular);">
        You have an unsaved draft from a previous session. Would you like to resume where you left off?
      </p>
      <template #footer>
        <el-button @click="handleStartFresh">Start Fresh</el-button>
        <el-button type="primary" @click="handleResumeDraft">Resume Draft</el-button>
      </template>
    </el-dialog>

    <!-- ── Header ──────────────────────────────────────────────────── -->
    <div class="trademark-wizard__header">
      <div class="trademark-wizard__header-text">
        <h1 class="trademark-wizard__title">Trademark Recordation</h1>
        <p class="trademark-wizard__subtitle">
          <span class="trademark-wizard__subtitle-separator">&#8250;</span>
          {{ labelTrademarkRequestType(form.requestType) || 'New Application' }}
        </p>
      </div>
      <div class="trademark-wizard__header-actions">
        <span v-if="lastSavedAt" class="trademark-wizard__last-saved">
          Last saved at {{ lastSavedAt.toLocaleTimeString() }}
        </span>
        <el-button type="info" plain size="default" @click="saveManualDraft">Save Draft</el-button>
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
            class="trademark-wizard__step-heading"
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
        <el-button type="info" plain @click="saveManualDraft">Save Draft</el-button>
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
  height: 100dvh; /* dynamic viewport height for mobile browsers */
  overflow: hidden; /* NEVER scrolls */
  background: var(--el-bg-color-page, #f5f7fa);
}

.trademark-wizard__header {
  flex-shrink: 0;
  padding: 0.875rem 1.25rem;
  background: var(--el-bg-color, #fff);
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.trademark-wizard__header-text {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  min-width: 0;
}

.trademark-wizard__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: var(--el-text-color-primary);
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.trademark-wizard__subtitle {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trademark-wizard__subtitle-separator {
  color: var(--el-text-color-placeholder);
  margin-right: 0.125rem;
}

.trademark-wizard__header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.trademark-wizard__last-saved {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}

.trademark-wizard__body {
  display: flex;
  flex: 1;
  min-height: 0; /* allows flex children to shrink */
  overflow: hidden;
}

.trademark-wizard__content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 2rem;
  background: var(--el-bg-color-page, #f5f7fa);
}

.trademark-wizard__content-inner {
}

.trademark-wizard__step-heading {
  font-size: 1rem;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0 0 0.25rem;
  line-height: 1.4;
  outline: none;
}

.trademark-wizard__footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  background: var(--el-bg-color, #fff);
  border-top: 1px solid var(--el-border-color-lighter, #ebeef5);
  gap: 0.75rem;
}

.trademark-wizard__footer-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* ── Wizard step shared styles (cascade into step components) ──────────── */
:deep(.wizard-step__title) {
  font-size: 1rem;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0 0 0.25rem;
  line-height: 1.4;
}

:deep(.wizard-step__description) {
  font-size: 0.8125rem;
  color: var(--el-text-color-secondary);
  margin: 0 0 1.25rem;
  line-height: 1.5;
}

:deep(.wizard-step__section-title) {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 0.75rem;
}

:deep(.wizard-step__info) {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  line-height: 1.5;
  background: var(--el-color-primary-light-9, #ecf5ff);
  color: var(--el-color-primary-dark-2);
  border: 1px solid var(--el-color-primary-light-7, #c6e2ff);
  margin-bottom: 1rem;
}

:deep(.wizard-step__info strong) {
  font-weight: 600;
}

:deep(.wizard-step__info ul) {
  margin: 0.5rem 0 0;
  padding-left: 1.25rem;
}

:deep(.wizard-step__info li) {
  margin-bottom: 0.25rem;
}

:deep(.wizard-step__success) {
  background: var(--el-color-success-light-9, #f0f9eb);
  color: var(--el-color-success-dark-2);
  border-color: var(--el-color-success-light-5, #b3e19d);
}
</style>
