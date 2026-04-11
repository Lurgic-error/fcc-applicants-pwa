<script setup>
/**
 * WizardShell — shared nested wizard layout for all applicants portal wizards.
 *
 * Provides a fixed-height shell inside the main app content area:
 *   - Header: always visible (title, metadata, save draft)
 *   - Body: sidebar (scrollable step list) + content pane (scrollable form)
 *   - Footer: always visible (Previous / Next / Submit / Save Draft)
 *
 * Only the sidebar step list and the content pane scroll. The user never
 * scrolls the whole page to reach action buttons.
 */
import { ref, nextTick, watch } from 'vue'
import WizardSidebar from './WizardSidebar.vue'

const props = defineProps({
  title: { type: String, default: 'Application' },
  subtitle: { type: String, default: '' },
  steps: { type: Array, default: () => [] },
  currentStepKey: { type: String, default: '' },
  currentStepIndex: { type: Number, default: 0 },
  totalSteps: { type: Number, default: 0 },
  isFirstStep: { type: Boolean, default: true },
  isLastStep: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
  lastSaved: { type: [Date, String, null], default: null },
  backRoute: { type: [Object, String], default: null },
  backLabel: { type: String, default: 'Back' },
  stepTitle: { type: String, default: '' },
  stepDescription: { type: String, default: '' },
  submitLabel: { type: String, default: 'Submit Application' },
  showSaveDraft: { type: Boolean, default: true },
})

const emit = defineEmits([
  'previous',
  'next',
  'submit',
  'save-draft',
  'step-click',
])

const contentRef = ref(null)

function scrollContentToTop() {
  nextTick(() => {
    contentRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

watch(() => props.currentStepKey, scrollContentToTop)
watch(() => props.currentStepIndex, scrollContentToTop)

function formatSavedTime(val) {
  if (!val) return ''
  const d = val instanceof Date ? val : new Date(val)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

defineExpose({ contentRef, scrollContentToTop })
</script>

<template>
  <div class="wz-shell" v-loading="loading">
    <!-- ── Header ── -->
    <header class="wz-header">
      <div class="wz-header__left">
        <router-link v-if="backRoute" :to="backRoute" class="wz-header__back">
          <i class="fa-solid fa-arrow-left" />
        </router-link>
        <div class="wz-header__text">
          <h1 class="wz-header__title">{{ title }}</h1>
          <p v-if="subtitle" class="wz-header__subtitle">
            <span class="wz-header__sep">/</span> {{ subtitle }}
          </p>
        </div>
      </div>
      <div class="wz-header__right">
        <slot name="header-actions">
          <span v-if="lastSaved" class="wz-header__saved">
            Saved {{ formatSavedTime(lastSaved) }}
          </span>
          <el-button v-if="showSaveDraft" type="info" plain @click="emit('save-draft')">
            Save Draft
          </el-button>
        </slot>
      </div>
    </header>

    <!-- ── Mobile step indicator ── -->
    <div class="wz-mobile-nav">
      <span class="wz-mobile-nav__label">Step {{ currentStepIndex + 1 }} of {{ totalSteps }}</span>
      <el-progress
        :percentage="totalSteps > 0 ? Math.round(((currentStepIndex + 1) / totalSteps) * 100) : 0"
        :show-text="false"
        :stroke-width="4"
        class="wz-mobile-nav__progress"
      />
    </div>

    <!-- ── Body ── -->
    <div class="wz-body">
      <!-- Sidebar -->
      <aside class="wz-sidebar">
        <slot name="sidebar">
          <WizardSidebar
            v-if="steps.length"
            :steps="steps"
            :current-step-key="currentStepKey"
            @navigate="emit('step-click', $event)"
          />
        </slot>
      </aside>

      <!-- Content -->
      <div ref="contentRef" class="wz-content">
        <div class="wz-content__inner">
          <div class="wz-card">
            <div v-if="stepTitle" class="wz-step-header">
              <h2 class="wz-step-title">{{ stepTitle }}</h2>
              <p v-if="stepDescription" class="wz-step-desc">{{ stepDescription }}</p>
            </div>
            <slot />
          </div>
        </div>
      </div>
    </div>

    <!-- ── Footer ── -->
    <footer class="wz-footer">
      <div class="wz-footer__left">
        <slot name="footer-left">
          <el-button :disabled="isFirstStep" @click="emit('previous')">
            <i class="fa-solid fa-chevron-left" style="margin-right: 6px" />
            Previous
          </el-button>
        </slot>
      </div>
      <div class="wz-footer__center">
        <slot name="footer-center">
          <span class="wz-footer__step-count">{{ currentStepIndex + 1 }} / {{ totalSteps }}</span>
        </slot>
      </div>
      <div class="wz-footer__right">
        <slot name="footer-right">
          <el-button
            v-if="showSaveDraft"
            type="info"
            plain
            @click="emit('save-draft')"
          >
            Save Draft
          </el-button>
          <el-button
            v-if="!isLastStep"
            type="primary"
            @click="emit('next')"
          >
            Next
            <i class="fa-solid fa-chevron-right" style="margin-left: 6px" />
          </el-button>
          <el-button
            v-else
            type="primary"
            :loading="submitting"
            @click="emit('submit')"
          >
            {{ submitLabel }}
          </el-button>
        </slot>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.wz-shell {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--fcc-bg-surface-muted, #f8fafc);
  margin: -1rem -1rem -1.5rem;
  height: calc(100% + 1rem + 1.5rem);
}

@media (min-width: 768px) {
  .wz-shell {
    margin: -1.5rem;
    height: calc(100% + 3rem);
  }
}

/* ── Header ── */
.wz-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  background: var(--fcc-bg-surface);
  border-bottom: 1px solid var(--fcc-border);
}

.wz-header__left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.wz-header__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--fcc-radius-base);
  color: var(--fcc-text-muted);
  text-decoration: none;
  transition: all 150ms ease;
  flex-shrink: 0;
}

.wz-header__back:hover {
  background: var(--fcc-bg-surface-muted);
  color: var(--fcc-text-primary);
}

.wz-header__text {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  min-width: 0;
}

.wz-header__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--fcc-text-primary);
  white-space: nowrap;
}

.wz-header__subtitle {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--fcc-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wz-header__sep {
  color: var(--fcc-text-disabled);
  margin-right: 0.125rem;
}

.wz-header__right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.wz-header__saved {
  font-size: 0.75rem;
  color: var(--fcc-text-muted);
  white-space: nowrap;
}

/* ── Mobile nav ── */
.wz-mobile-nav {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1.25rem;
  background: var(--fcc-bg-surface);
  border-bottom: 1px solid var(--fcc-border-light);
}

.wz-mobile-nav__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--fcc-text-muted);
  white-space: nowrap;
}

.wz-mobile-nav__progress {
  flex: 1;
}

@media (min-width: 1024px) {
  .wz-mobile-nav {
    display: none;
  }
}

/* ── Body ── */
.wz-body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* ── Sidebar ── */
.wz-sidebar {
  display: none;
  flex-shrink: 0;
  width: 16rem;
  border-right: 1px solid var(--fcc-border);
  background: var(--fcc-bg-surface);
  overflow-y: auto;
}

@media (min-width: 1024px) {
  .wz-sidebar {
    display: flex;
    flex-direction: column;
  }
}

/* ── Content ── */
.wz-content {
  flex: 1;
  overflow-y: auto;
  background: var(--fcc-bg-surface-muted, #f8fafc);
}

.wz-content__inner {
  padding: 1.5rem 2rem;
}

.wz-card {
  background: var(--fcc-bg-surface);
  border: 1px solid var(--fcc-border);
  border-radius: var(--fcc-radius-panel, 10px);
  padding: 1.75rem 2rem;
  box-shadow: var(--fcc-shadow-sm);
}

.wz-step-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1.5px solid var(--fcc-border);
}

.wz-step-title {
  margin: 0;
  font-family: var(--fcc-font-heading, 'Outfit', sans-serif);
  font-size: var(--fcc-text-xl, 1.125rem);
  font-weight: 800;
  color: var(--fcc-text-primary);
  letter-spacing: -0.02em;
}

.wz-step-desc {
  margin: 0.35rem 0 0;
  font-size: var(--fcc-text-sm, 0.8125rem);
  color: var(--fcc-text-muted);
  line-height: 1.5;
}

@media (max-width: 767px) {
  .wz-content__inner {
    padding: 1rem;
  }
  .wz-card {
    padding: 1.25rem;
  }
}

/* ── Scrollbar ── */
.wz-content::-webkit-scrollbar,
.wz-sidebar::-webkit-scrollbar {
  width: 6px;
}

.wz-content::-webkit-scrollbar-track,
.wz-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.wz-content::-webkit-scrollbar-thumb,
.wz-sidebar::-webkit-scrollbar-thumb {
  background: var(--fcc-border);
  border-radius: 3px;
}

.wz-content::-webkit-scrollbar-thumb:hover,
.wz-sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--fcc-border-strong);
}

/* ── Footer ── */
.wz-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 1.25rem;
  background: var(--fcc-bg-surface);
  border-top: 1px solid var(--fcc-border);
  gap: 0.75rem;
}

.wz-footer__left,
.wz-footer__right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.wz-footer__center {
  flex: 1;
  text-align: center;
}

.wz-footer__step-count {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--fcc-text-muted);
}

/* ── Form label enforcement ── */
.wz-content :deep(.el-form-item) {
  margin-bottom: 1rem;
}

.wz-content :deep(.el-form--label-top .el-form-item__label),
.wz-content :deep(.el-form-item__label) {
  display: block;
  text-align: left;
  padding-bottom: 4px;
  font-weight: 600;
  font-size: 0.82rem;
}
</style>
