<script setup>
const props = defineProps({
  steps: { type: Array, default: () => [] },
  currentStep: { type: Number, default: 0 }
})

const emit = defineEmits(['update:currentStep'])
</script>

<template>
  <nav
    role="navigation"
    aria-label="Form steps"
    class="lg:hidden"
  >
    <div class="flex items-center gap-2 rounded-2xl bg-slate-100 p-3 dark:bg-slate-800" aria-hidden="true">
      <div class="flex flex-1 gap-1">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="h-1.5 flex-1 rounded-full transition-colors"
          :class="index <= currentStep ? 'bg-fcc-brand' : 'bg-slate-300 dark:bg-slate-600'"
        />
      </div>
      <span class="shrink-0 text-xs font-medium text-slate-600 dark:text-slate-300">
        {{ currentStep + 1 }}/{{ steps.length }}
      </span>
    </div>

    <!-- Hidden text for screen readers describing overall progress -->
    <p class="sr-only" aria-live="polite" aria-atomic="true">
      Step {{ currentStep + 1 }} of {{ steps.length }}: {{ steps[currentStep]?.title || `Step ${currentStep + 1}` }}
    </p>

    <ol class="mt-2 flex items-center justify-between" role="list" aria-label="Step list">
      <li role="listitem">
        <button
          :disabled="currentStep === 0"
          :aria-label="`Go to previous step: ${steps[currentStep - 1]?.title || ''}`"
          class="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
          @click="emit('update:currentStep', currentStep - 1)"
        >
          <i class="fa-solid fa-chevron-left text-xs" aria-hidden="true" />
        </button>
      </li>

      <li role="listitem" aria-current="step">
        <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {{ steps[currentStep]?.title || `Step ${currentStep + 1}` }}
        </p>
      </li>

      <li role="listitem">
        <button
          :disabled="currentStep === steps.length - 1"
          :aria-label="`Go to next step: ${steps[currentStep + 1]?.title || ''}`"
          :aria-disabled="currentStep === steps.length - 1 ? 'true' : undefined"
          class="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
          @click="emit('update:currentStep', currentStep + 1)"
        >
          <i class="fa-solid fa-chevron-right text-xs" aria-hidden="true" />
        </button>
      </li>
    </ol>

    <!-- Step dots for each step: communicate locked/future state -->
    <ol v-if="steps.length > 1" class="sr-only" aria-label="All steps">
      <li
        v-for="(step, index) in steps"
        :key="index"
        :aria-current="index === currentStep ? 'step' : undefined"
        :aria-disabled="index > currentStep ? 'true' : undefined"
      >
        {{ step.title || `Step ${index + 1}` }}
        <span v-if="index < currentStep"> (completed)</span>
        <span v-else-if="index === currentStep"> (current)</span>
        <span v-else> (not yet available)</span>
      </li>
    </ol>
  </nav>
</template>
