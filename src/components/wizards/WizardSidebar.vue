<script setup>
/**
 * Generic sidebar step navigation with nested step support.
 * Supports top-level steps and child sub-steps with indented display.
 * Matches MergerWizardSidebar visual style (same CSS variables, class naming).
 */
import { computed } from 'vue'

const props = defineProps({
  steps: { type: Array, required: true },
  currentStepKey: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' }
})

const emit = defineEmits(['step-click'])

/**
 * Flat list of all navigable keys (children expand in place of parents).
 * Parent steps with children are NOT included — only leaf keys.
 */
const flatKeys = computed(() =>
  props.steps.flatMap(step =>
    step.children?.length ? step.children.map(c => c.key) : [step.key]
  )
)

const currentFlatIndex = computed(() => flatKeys.value.indexOf(props.currentStepKey))

const progress = computed(() => {
  const idx = currentFlatIndex.value
  if (idx < 0) return 0
  return Math.round(((idx + 1) / flatKeys.value.length) * 100)
})

const progressLabel = computed(() => {
  const idx = currentFlatIndex.value
  const total = flatKeys.value.length
  return `Step ${idx < 0 ? 1 : idx + 1}/${total} · ${progress.value}%`
})

/** Determine if a given step key is "done" (appears before current in flat list) */
function isDone(key) {
  const keyIdx = flatKeys.value.indexOf(key)
  return keyIdx >= 0 && keyIdx < currentFlatIndex.value
}

/** Step number label for top-level steps: 1, 2, 3 … */
function topLevelNum(parentIndex) {
  return parentIndex + 1
}

/** Step number label for child steps: 3a, 3b, 3c … */
function childNum(parentIndex, childIndex) {
  const letter = String.fromCharCode(97 + childIndex) // a, b, c …
  return `${parentIndex + 1}${letter}`
}
</script>

<template>
  <aside class="wizard-sidebar">
    <!-- Header: title / subtitle -->
    <div class="wizard-sidebar__header">
      <p class="wizard-sidebar__title">{{ title }}</p>
      <p v-if="subtitle" class="wizard-sidebar__subtitle">{{ subtitle }}</p>
    </div>

    <!-- Progress bar -->
    <div class="wizard-sidebar__progress">
      <div class="wizard-sidebar__progress-bar">
        <div class="wizard-sidebar__progress-fill" :style="{ width: `${progress}%` }" />
      </div>
      <p class="wizard-sidebar__progress-label">{{ progressLabel }}</p>
    </div>

    <!-- Step list -->
    <nav class="wizard-sidebar__nav">
      <template v-for="(step, parentIndex) in steps" :key="step.key">

        <!-- Parent step WITH children: non-clickable header -->
        <template v-if="step.children?.length">
          <div
            class="wizard-sidebar__step wizard-sidebar__step--parent"
            :class="{
              'wizard-sidebar__step--done': step.children.every(c => isDone(c.key))
            }"
          >
            <span class="wizard-sidebar__step-num">
              <template v-if="step.children.every(c => isDone(c.key))">&#10003;</template>
              <template v-else>{{ topLevelNum(parentIndex) }}</template>
            </span>
            <span class="wizard-sidebar__step-text">
              <span class="wizard-sidebar__step-label">{{ step.label }}</span>
            </span>
          </div>

          <!-- Children: indented, clickable -->
          <button
            v-for="(child, childIndex) in step.children"
            :key="child.key"
            class="wizard-sidebar__step wizard-sidebar__step--child"
            :class="{
              'wizard-sidebar__step--active': child.key === currentStepKey,
              'wizard-sidebar__step--done': isDone(child.key)
            }"
            @click="emit('step-click', child.key)"
          >
            <span class="wizard-sidebar__step-num wizard-sidebar__step-num--child">
              <template v-if="isDone(child.key)">&#10003;</template>
              <template v-else>{{ childNum(parentIndex, childIndex) }}</template>
            </span>
            <span class="wizard-sidebar__step-text">
              <span class="wizard-sidebar__step-label">{{ child.label }}</span>
            </span>
          </button>
        </template>

        <!-- Leaf step: clickable -->
        <button
          v-else
          class="wizard-sidebar__step"
          :class="{
            'wizard-sidebar__step--active': step.key === currentStepKey,
            'wizard-sidebar__step--done': isDone(step.key)
          }"
          @click="emit('step-click', step.key)"
        >
          <span class="wizard-sidebar__step-num">
            <template v-if="isDone(step.key)">&#10003;</template>
            <template v-else>{{ topLevelNum(parentIndex) }}</template>
          </span>
          <span class="wizard-sidebar__step-text">
            <span class="wizard-sidebar__step-label">{{ step.label }}</span>
          </span>
        </button>

      </template>
    </nav>
  </aside>
</template>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────────────── */
.wizard-sidebar {
  width: 15rem;
  min-width: 15rem;
  background: var(--fcc-bg-surface, #fff);
  border-right: 1px solid var(--fcc-border, #dbe3ef);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: sticky;
  top: 0;
  height: 100vh;
}

/* ── Header ──────────────────────────────────────────────────────────────── */
.wizard-sidebar__header {
  padding: 0.875rem 0.875rem 0.5rem;
  border-bottom: 1px solid var(--fcc-border-light, #e5eaf3);
}

.wizard-sidebar__title {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--fcc-text-primary, #0f172a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wizard-sidebar__subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.6875rem;
  color: var(--fcc-text-muted, #64748b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Progress ────────────────────────────────────────────────────────────── */
.wizard-sidebar__progress {
  padding: 0.875rem;
  border-bottom: 1px solid var(--fcc-border-light, #e5eaf3);
}

.wizard-sidebar__progress-bar {
  height: 4px;
  border-radius: 999px;
  background: var(--fcc-bg-surface-muted, #f8fafc);
  overflow: hidden;
}

.wizard-sidebar__progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--fcc-primary-700, #1b4683), var(--fcc-secondary-500, #0ea5e9));
  transition: width 0.3s ease;
}

.wizard-sidebar__progress-label {
  margin: 0.375rem 0 0;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--fcc-text-muted, #64748b);
}

/* ── Nav ─────────────────────────────────────────────────────────────────── */
.wizard-sidebar__nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.375rem;
}

/* ── Step base ───────────────────────────────────────────────────────────── */
.wizard-sidebar__step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.4375rem 0.5rem;
  border: none;
  border-radius: var(--fcc-radius-md, 6px);
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-family: var(--fcc-font-body, inherit);
  margin-bottom: 1px;
  transition: background 0.12s;
}

.wizard-sidebar__step:hover {
  background: var(--fcc-bg-surface-muted, #f8fafc);
}

.wizard-sidebar__step--active {
  background: color-mix(in srgb, var(--fcc-primary-900, #0f4c81) 6%, var(--fcc-bg-surface, #fff));
}

/* ── Parent step header (non-clickable) ──────────────────────────────────── */
.wizard-sidebar__step--parent {
  cursor: default;
  margin-top: 0.375rem;
}

.wizard-sidebar__step--parent:hover {
  background: transparent;
}

.wizard-sidebar__step--parent .wizard-sidebar__step-label {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--fcc-text-secondary, #475569);
}

/* ── Child step ──────────────────────────────────────────────────────────── */
.wizard-sidebar__step--child {
  padding-left: 2rem;
}

/* ── Step number badge ───────────────────────────────────────────────────── */
.wizard-sidebar__step-num {
  width: 1.375rem;
  height: 1.375rem;
  border-radius: var(--fcc-radius-sm, 4px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 0.625rem;
  font-weight: 700;
  background: var(--fcc-bg-surface-muted, #f8fafc);
  color: var(--fcc-text-muted, #64748b);
}

.wizard-sidebar__step-num--child {
  width: 1.25rem;
  height: 1.25rem;
  font-size: 0.5625rem;
}

.wizard-sidebar__step--active .wizard-sidebar__step-num {
  background: var(--fcc-primary-900, #0f4c81);
  color: #fff;
}

.wizard-sidebar__step--done .wizard-sidebar__step-num {
  background: color-mix(in srgb, var(--fcc-primary-900, #0f4c81) 10%, var(--fcc-bg-surface, #fff));
  color: var(--fcc-primary-900, #0f4c81);
}

/* ── Step text ───────────────────────────────────────────────────────────── */
.wizard-sidebar__step-text {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.wizard-sidebar__step-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--fcc-text-muted, #64748b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wizard-sidebar__step--active .wizard-sidebar__step-label {
  font-weight: 700;
  color: var(--fcc-text-primary, #0f172a);
}

.wizard-sidebar__step--done .wizard-sidebar__step-label {
  color: var(--fcc-text-secondary, #475569);
}

/* ── Mobile: hide sidebar ────────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .wizard-sidebar {
    display: none;
  }
}
</style>
