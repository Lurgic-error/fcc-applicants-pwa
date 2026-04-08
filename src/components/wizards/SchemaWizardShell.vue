<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import SchemaStep from './SchemaStep.vue'
import ApplicantIdentityStep from './steps/ApplicantIdentityStep.vue'
import FeeReviewStep from './steps/FeeReviewStep.vue'
import DeclarationStep from './steps/DeclarationStep.vue'
import MobileStepNavigator from '@/components/MobileStepNavigator.vue'

const props = defineProps({
  serviceKey: { type: String, required: true },
  catalogProfile: { type: Object, default: null },
  formData: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false },
  initialStep: { type: Number, default: 0 }
})

const emit = defineEmits(['update:formData', 'step-change'])

const stepIndex = ref(props.initialStep)
const stepHeadingRef = ref(null)

const catalogSteps = computed(() => props.catalogProfile?.steps || [])

const wizardSteps = computed(() => {
  const steps = catalogSteps.value.map((s) => ({
    ...s,
    title: s.name || `Step ${s.stepNumber}`
  }))
  return steps
})

const totalSteps = computed(() => wizardSteps.value.length)
const currentStep = computed(() => wizardSteps.value[stepIndex.value] || null)
const isFirstStep = computed(() => stepIndex.value === 0)
const isLastStep = computed(() => stepIndex.value === totalSteps.value - 1)

function nextStep() {
  if (!isLastStep.value) {
    stepIndex.value++
  }
}

function previousStep() {
  if (!isFirstStep.value) {
    stepIndex.value--
  }
}

function goToStep(index) {
  stepIndex.value = Math.max(0, Math.min(index, totalSteps.value - 1))
}

function updateFormData(updates) {
  emit('update:formData', { ...props.formData, ...updates })
}

watch(stepIndex, () => {
  emit('step-change', stepIndex.value)
  nextTick(() => stepHeadingRef.value?.focus())
})
</script>

<template>
  <div v-if="catalogProfile && wizardSteps.length" class="schema-wizard-shell">
    <!-- Mobile step navigator -->
    <MobileStepNavigator
      :steps="wizardSteps"
      :current-step="stepIndex"
      @update:current-step="goToStep"
    />

    <!-- Desktop stepper -->
    <el-steps class="hidden lg:flex mb-6" :active="stepIndex" finish-status="success" simple>
      <el-step
        v-for="(step, index) in wizardSteps"
        :key="index"
        :title="step.title"
        @click="goToStep(index)"
        class="cursor-pointer"
      />
    </el-steps>

    <!-- Step heading (for a11y focus management) -->
    <h2
      ref="stepHeadingRef"
      tabindex="-1"
      class="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100 outline-none"
    >
      Step {{ stepIndex + 1 }}: {{ currentStep?.title }}
    </h2>

    <!-- Step content -->
    <div class="min-h-[200px]">
      <SchemaStep
        v-if="currentStep"
        :step="currentStep"
        :form-data="formData"
        :disabled="disabled"
        @update:form-data="updateFormData"
      />
    </div>

    <!-- Navigation -->
    <div class="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-700">
      <el-button :disabled="isFirstStep" @click="previousStep">
        <i class="fa-solid fa-arrow-left mr-2" />Previous
      </el-button>

      <span class="text-sm text-slate-500 dark:text-slate-400">
        {{ stepIndex + 1 }} of {{ totalSteps }}
      </span>

      <el-button v-if="!isLastStep" type="primary" @click="nextStep">
        Next<i class="fa-solid fa-arrow-right ml-2" />
      </el-button>

      <slot v-else name="submit-button">
        <el-button type="primary">
          Submit Application
        </el-button>
      </slot>
    </div>
  </div>

  <div v-else class="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
    <el-skeleton :rows="8" animated />
  </div>
</template>
