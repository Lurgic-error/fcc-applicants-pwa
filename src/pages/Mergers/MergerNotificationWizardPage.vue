<script setup>
/**
 * FCC-8 Merger Notification Wizard — Main Page
 *
 * Government Notice No. 344 FCC.8
 * Application for Merger Clearance — Rule 33(2)
 *
 * 26-step wizard with sidebar navigation, deep nested form state,
 * conditional steps, and auto-save.
 */
import { computed, defineAsyncComponent, nextTick, onMounted, provide, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { useDeepForm } from '@/composables/useDeepForm'
import { useAutoSave } from '@/composables/useAutoSave'
import { createInitialFormState, STEPS } from '@/constants/mergerFcc8Config'
import WizardSidebar from '@/components/wizards/WizardSidebar.vue'
import { FccPageHeader } from '@shared/design-system/components'
import ApplicationCompletenessDrawer from '@/components/ApplicationCompletenessDrawer.vue'

// ── Step components (lazy-loaded) ────────────────────────────────────
const stepComponents = {
  applicant: defineAsyncComponent(() => import('@/components/merger/steps/StepApplicant.vue')),
  acquiringFirms: defineAsyncComponent(() => import('@/components/merger/steps/StepAcquiringFirms.vue')),
  targetFirm: defineAsyncComponent(() => import('@/components/merger/steps/StepTargetFirm.vue')),
  localNexus: defineAsyncComponent(() => import('@/components/merger/steps/StepLocalNexus.vue')),
  acquisition: defineAsyncComponent(() => import('@/components/merger/steps/StepAcquisition.vue')),
  background: defineAsyncComponent(() => import('@/components/merger/steps/StepStructured.vue')),
  marketDef: defineAsyncComponent(() => import('@/components/merger/steps/StepMarketDefinition.vue')),
  suppliers: defineAsyncComponent(() => import('@/components/merger/steps/StepSuppliers.vue')),
  competitors: defineAsyncComponent(() => import('@/components/merger/steps/StepStructured.vue')),
  customers: defineAsyncComponent(() => import('@/components/merger/steps/StepCustomers.vue')),
  concentration: defineAsyncComponent(() => import('@/components/merger/steps/StepStructured.vue')),
  constraints: defineAsyncComponent(() => import('@/components/merger/steps/StepStructured.vue')),
  imports: defineAsyncComponent(() => import('@/components/merger/steps/StepStructured.vue')),
  exports: defineAsyncComponent(() => import('@/components/merger/steps/StepStructured.vue')),
  barriers: defineAsyncComponent(() => import('@/components/merger/steps/StepStructured.vue')),
  dynamics: defineAsyncComponent(() => import('@/components/merger/steps/StepStructured.vue')),
  vigorous: defineAsyncComponent(() => import('@/components/merger/steps/StepStructured.vue')),
  vertical: defineAsyncComponent(() => import('@/components/merger/steps/StepStructured.vue')),
  prices: defineAsyncComponent(() => import('@/components/merger/steps/StepStructured.vue')),
  related: defineAsyncComponent(() => import('@/components/merger/steps/StepStructured.vue')),
  otherGrounds: defineAsyncComponent(() => import('@/components/merger/steps/StepStructured.vue')),
  counterfactual: defineAsyncComponent(() => import('@/components/merger/steps/StepStructured.vue')),
  international: defineAsyncComponent(() => import('@/components/merger/steps/StepInternational.vue')),
  attachments: defineAsyncComponent(() => import('@/components/merger/steps/StepStructured.vue')),
  mergerFees: defineAsyncComponent(() => import('@/components/merger/steps/StepMergerFees.vue')),
  undertaking: defineAsyncComponent(() => import('@/components/merger/steps/StepStructured.vue')),
  review: defineAsyncComponent(() => import('@/components/merger/steps/StepReview.vue'))
}

const router = useRouter()

// ── Form state ───────────────────────────────────────────────────────
const { form, get, set, toPlain } = useDeepForm(createInitialFormState())
const currentStep = ref(0)
const stepHeadingRef = ref(null)
const contentRef = ref(null)

const { lastSavedAt: lastSaved, hasDraft: showResumePrompt, save: saveDraft, restore: resumeDraft, clearDraft } = useAutoSave(
  'fcc_wizard_draft_merger-clearance',
  { value: form },
  { onRestore: (data) => Object.assign(form, data) }
)

watch(currentStep, () => {
  nextTick(() => {
    stepHeadingRef.value?.focus()
  })
})

// ── Preview drawer ───────────────────────────────────────────────────
const previewDrawerVisible = ref(false)
const DRAFT_KEY_PREFIX = 'fcc_wizard_draft_'

function saveDraftToLocalStorage() {
  localStorage.setItem(`${DRAFT_KEY_PREFIX}merger-clearance`, JSON.stringify(toPlain()))
}

function openFullPreview() {
  previewDrawerVisible.value = false
  saveDraftToLocalStorage()
  router.push({
    name: 'application-preview-draft',
    params: { serviceKey: 'merger-clearance' },
    query: { editing: '1', step: currentStep.value }
  })
}

function jumpToStepFromPreview(index) {
  previewDrawerVisible.value = false
  currentStep.value = index
}

// Provide deep form utilities to all step components via inject
provide('wizardGet', get)
provide('wizardSet', set)
provide('wizardForm', form)

// ── Visible steps (Local Nexus is conditional) ───────────────────────
const visibleSteps = computed(() =>
  STEPS.filter(s => !s.conditional || form.localNexus.isApplicable)
)

const currentStepKey = computed(() => visibleSteps.value[currentStep.value]?.id || '')

const sidebarSteps = computed(() =>
  visibleSteps.value.map(s => ({ key: s.id, label: s.label }))
)

const currentStepDef = computed(() => visibleSteps.value[currentStep.value])
const currentComponent = computed(() => {
  const id = currentStepDef.value?.id
  return id ? stepComponents[id] : null
})

// ── Navigation ───────────────────────────────────────────────────────
function goToStep(index) {
  if (index < 0 || index >= visibleSteps.value.length) return
  currentStep.value = index
  contentRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

function nextStep() {
  saveDraft()
  goToStep(currentStep.value + 1)
}

function previousStep() {
  saveDraft()
  goToStep(currentStep.value - 1)
}

// ── Actions ──────────────────────────────────────────────────────────
function saveManualDraft() {
  try {
    saveDraft()
    ElMessage.success('Draft saved locally')
  } catch {
    ElMessage.warning('Could not save draft')
  }
}

function submitApplication() {
  clearDraft()
  ElMessage.info('Submission will be wired to the applicant API')
}

// ── Step props (for StepStructured generic steps) ────────────────────
const stepProps = computed(() => {
  const def = currentStepDef.value
  if (!def) return {}
  return { stepId: def.id, stepDef: def }
})

// ── Route leave guard ────────────────────────────────────────────────
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
      'You have unsaved changes. Leave this page?',
      'Unsaved Changes',
      { confirmButtonText: 'Leave', cancelButtonText: 'Stay', type: 'warning' }
    )
    return true
  } catch {
    return false
  }
})

onMounted(() => {
  captureSnapshot()
  resumeDraft()
})
</script>

<template>
  <div class="merger-wizard">
    <!-- ── Top Bar ──────────────────────────────────────────── -->
    <header class="merger-wizard__header">
      <div>
        <h1 class="merger-wizard__title">FCC-8 Merger Notification</h1>
      </div>
      <div class="merger-wizard__header-actions">
        <el-button plain @click="saveManualDraft">Save Draft</el-button>
      </div>
    </header>

    <div class="merger-wizard__body">
      <!-- ── Sidebar ──────────────────────────────────────── -->
      <WizardSidebar
        :steps="sidebarSteps"
        :current-step-key="currentStepKey"
        title="Merger Notification"
        subtitle="FCC Form 8"
        @step-click="(key) => goToStep(sidebarSteps.findIndex(s => s.key === key))"
      />

      <!-- ── Content ──────────────────────────────────────── -->
      <div ref="contentRef" class="merger-wizard__content">
        <div v-if="showResumePrompt" class="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <p class="text-sm font-medium text-blue-800 dark:text-blue-200">
            You have an unsaved draft from a previous session. Would you like to resume?
          </p>
          <div class="mt-3 flex gap-2">
            <el-button type="primary" @click="resumeDraft">Resume Draft</el-button>
            <el-button @click="clearDraft">Start Fresh</el-button>
          </div>
        </div>

        <div class="merger-wizard__card">
          <!-- Step heading -->
          <div v-if="currentStepDef" class="merger-wizard__step-header">
            <div class="merger-wizard__step-heading">
              <h2
              ref="stepHeadingRef"
              tabindex="-1"
              class="merger-wizard__step-title outline-none"
            >{{ currentStepDef.label }}</h2>
              <span v-if="currentStepDef.fcc !== '—'" class="merger-wizard__step-badge">{{ currentStepDef.fcc }}</span>
            </div>
            <p v-if="currentStepDef.desc" class="merger-wizard__step-desc">{{ currentStepDef.desc }}</p>
          </div>

          <!-- Dynamic step component -->
          <component :is="currentComponent" v-bind="stepProps" />
        </div>
      </div>
    </div>

    <!-- ── Footer Navigation ──────────────────────────────── -->
    <footer class="merger-wizard__footer">
      <el-button :disabled="currentStep === 0" @click="previousStep">Previous</el-button>
      <span class="merger-wizard__footer-count">{{ currentStep + 1 }} / {{ visibleSteps.length }}</span>
      <span v-if="lastSaved" class="text-xs text-slate-400 dark:text-slate-500">
        Draft saved {{ new Date(lastSaved).toLocaleTimeString() }}
      </span>
      <el-button v-if="currentStep === visibleSteps.length - 1" type="primary" @click="submitApplication">Submit Application</el-button>
      <el-button v-else type="primary" @click="nextStep">Next</el-button>
    </footer>

    <button
      class="fixed bottom-6 right-6 z-40 flex h-12 items-center gap-2 rounded-2xl bg-fcc-brand px-5 text-sm font-semibold text-white shadow-lg transition hover:bg-fcc-brand/90"
      @click="previewDrawerVisible = true"
    >
      <i class="fa-solid fa-eye" />
      Preview
    </button>

    <ApplicationCompletenessDrawer
      :visible="previewDrawerVisible"
      service-key="merger-clearance"
      :form-data="toPlain()"
      :current-step-index="currentStep"
      @close="previewDrawerVisible = false"
      @jump-to-step="jumpToStepFromPreview"
      @open-full-preview="openFullPreview"
    />
  </div>
</template>

<style scoped>
.merger-wizard {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--fcc-bg-app, #f4f7fb);
  margin: -1rem -1rem -1.5rem;
  height: calc(100% + 1rem + 1.5rem);
}

@media (min-width: 768px) {
  .merger-wizard {
    margin: -1.5rem;
    height: calc(100% + 3rem);
  }
}

.merger-wizard__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 1.5rem;
  background: var(--fcc-bg-surface, #fff);
  border-bottom: 1px solid var(--fcc-border, #dbe3ef);
  flex-shrink: 0;
}

.merger-wizard__title {
  margin: 0;
  font-family: var(--fcc-font-heading, 'Outfit', sans-serif);
  font-size: var(--fcc-text-lg, 1rem);
  font-weight: 800;
  color: var(--fcc-text-primary, #0f172a);
  letter-spacing: -0.01em;
}

.merger-wizard__subtitle {
  margin: 0;
  font-size: var(--fcc-text-xs, 0.75rem);
  color: var(--fcc-text-muted, #64748b);
}

.merger-wizard__header-actions {
  display: flex;
  gap: 0.5rem;
}

.merger-wizard__body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.merger-wizard__content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 2rem 1.5rem;
}

.merger-wizard__card {
  background: var(--fcc-bg-surface, #fff);
  border: 1px solid var(--fcc-border, #dbe3ef);
  border-radius: var(--fcc-radius-panel, 12px);
  padding: 1.75rem 2rem;
  box-shadow: var(--fcc-shadow-sm);
}

.merger-wizard__step-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1.5px solid var(--fcc-border, #dbe3ef);
}

.merger-wizard__step-heading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.merger-wizard__step-title {
  margin: 0;
  font-family: var(--fcc-font-heading, 'Outfit', sans-serif);
  font-size: var(--fcc-text-xl, 1.125rem);
  font-weight: 800;
  color: var(--fcc-text-primary, #0f172a);
  letter-spacing: -0.02em;
}

.merger-wizard__step-badge {
  display: inline-block;
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--fcc-secondary-500, #0ea5e9);
  background: color-mix(in srgb, var(--fcc-secondary-500, #0ea5e9) 8%, var(--fcc-bg-surface, #fff));
  padding: 0.1875rem 0.5rem;
  border-radius: 999px;
}

.merger-wizard__step-desc {
  margin: 0.25rem 0 0;
  font-size: var(--fcc-text-sm, 0.8125rem);
  color: var(--fcc-text-muted, #64748b);
  line-height: 1.5;
}

.merger-wizard__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: var(--fcc-bg-surface, #fff);
  border-top: 1px solid var(--fcc-border, #dbe3ef);
  flex-shrink: 0;
}

.merger-wizard__footer-count {
  font-size: var(--fcc-text-xs, 0.75rem);
  font-weight: 600;
  color: var(--fcc-text-disabled, #94a3b8);
}

@media (max-width: 768px) {
  .merger-wizard__content {
    padding: 1rem;
  }
  .merger-wizard__card {
    padding: 1.25rem;
  }
}

/* ── Scrollbar ── */
.merger-wizard__content::-webkit-scrollbar,
.wizard-sidebar__nav::-webkit-scrollbar {
  width: 6px;
}

.merger-wizard__content::-webkit-scrollbar-track,
.wizard-sidebar__nav::-webkit-scrollbar-track {
  background: transparent;
}

.merger-wizard__content::-webkit-scrollbar-thumb,
.wizard-sidebar__nav::-webkit-scrollbar-thumb {
  background: var(--fcc-border);
  border-radius: 3px;
}

.merger-wizard__content::-webkit-scrollbar-thumb:hover,
.wizard-sidebar__nav::-webkit-scrollbar-thumb:hover {
  background: var(--fcc-border-strong);
}
</style>
