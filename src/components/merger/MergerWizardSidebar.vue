<script setup>
// DEPRECATED: Replaced by generic WizardSidebar.vue (2026-04-10)
/**
 * Sidebar step navigation for FCC-8 merger wizard.
 * Shows progress bar, step list with active/complete states, click-to-navigate.
 */
import { computed } from 'vue'

const props = defineProps({
  steps: { type: Array, required: true },
  currentStep: { type: Number, default: 0 }
})

const emit = defineEmits(['navigate'])

const progress = computed(() => Math.round(((props.currentStep + 1) / props.steps.length) * 100))
</script>

<template>
  <aside class="wizard-sidebar">
    <div class="wizard-sidebar__progress">
      <div class="wizard-sidebar__progress-bar">
        <div class="wizard-sidebar__progress-fill" :style="{ width: `${progress}%` }" />
      </div>
      <p class="wizard-sidebar__progress-label">Step {{ currentStep + 1 }}/{{ steps.length }} &middot; {{ progress }}%</p>
    </div>

    <nav class="wizard-sidebar__nav">
      <button
        v-for="(step, index) in steps"
        :key="step.id"
        class="wizard-sidebar__step"
        :class="{
          'wizard-sidebar__step--active': index === currentStep,
          'wizard-sidebar__step--done': index < currentStep
        }"
        @click="emit('navigate', index)"
      >
        <span class="wizard-sidebar__step-num">
          <template v-if="index < currentStep">&#10003;</template>
          <template v-else>{{ index + 1 }}</template>
        </span>
        <span class="wizard-sidebar__step-text">
          <span class="wizard-sidebar__step-label">{{ step.label }}</span>
          <span v-if="step.fcc !== '—'" class="wizard-sidebar__step-fcc">{{ step.fcc }}</span>
        </span>
      </button>
    </nav>
  </aside>
</template>

<style scoped>
.wizard-sidebar {
  width: 15rem;
  min-width: 15rem;
  background: var(--fcc-bg-surface, #fff);
  border-right: 1px solid var(--fcc-border, #dbe3ef);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

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

.wizard-sidebar__nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.375rem;
}

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

.wizard-sidebar__step--active .wizard-sidebar__step-num {
  background: var(--fcc-primary-900, #0f4c81);
  color: #fff;
}

.wizard-sidebar__step--done .wizard-sidebar__step-num {
  background: color-mix(in srgb, var(--fcc-primary-900, #0f4c81) 10%, var(--fcc-bg-surface, #fff));
  color: var(--fcc-primary-900, #0f4c81);
}

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

.wizard-sidebar__step-fcc {
  font-size: 0.5625rem;
  font-weight: 600;
  color: var(--fcc-text-disabled, #94a3b8);
}

.wizard-sidebar__step--active .wizard-sidebar__step-fcc {
  color: var(--fcc-secondary-500, #0ea5e9);
}

@media (max-width: 1024px) {
  .wizard-sidebar {
    display: none;
  }
}
</style>
