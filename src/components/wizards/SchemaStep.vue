<script setup>
import { computed } from 'vue'
import SmartFormGrid from '@/components/forms/SmartFormGrid.vue'
import SchemaField from './SchemaField.vue'
import RepeatableGroup from './RepeatableGroup.vue'

const props = defineProps({
  step: { type: Object, required: true },
  formData: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:formData'])
const gridMaxCols = computed(() => props.step?.maxCols || 4)

function updateField(key, value) {
  emit('update:formData', { ...props.formData, [key]: value })
}

function updateGroup(key, value) {
  emit('update:formData', { ...props.formData, [key]: value })
}
</script>

<template>
  <div>
    <div v-if="step.description" class="mb-4 text-sm text-slate-600 dark:text-slate-300">
      {{ step.description }}
    </div>

    <SmartFormGrid :max-cols="gridMaxCols">
      <SchemaField
        v-for="field in (step.structuredFields || [])"
        :key="field.key"
        :field="field"
        :model-value="formData[field.key]"
        :disabled="disabled"
        @update:model-value="updateField(field.key, $event)"
      />
    </SmartFormGrid>

    <div v-if="(step.repeatableGroups || []).length" class="mt-6 space-y-6">
      <RepeatableGroup
        v-for="group in step.repeatableGroups"
        :key="group.key"
        :group="group"
        :model-value="formData[group.key] || []"
        :disabled="disabled"
        @update:model-value="updateGroup(group.key, $event)"
      />
    </div>
  </div>
</template>
