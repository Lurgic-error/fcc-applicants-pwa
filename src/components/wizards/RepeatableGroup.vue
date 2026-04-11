<script setup>
import { computed } from 'vue'
import SmartFormGrid from '@/components/forms/SmartFormGrid.vue'
import SchemaField from './SchemaField.vue'

const props = defineProps({
  group: { type: Object, required: true },
  modelValue: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const items = computed(() => props.modelValue || [])
const canAdd = computed(() => !props.group.maxItems || items.value.length < props.group.maxItems)
const canRemove = computed(() => items.value.length > (props.group.minItems || 0))

function createItem() {
  const item = {}
  for (const field of (props.group.fields || [])) {
    item[field.key] = field.defaultValue ?? (field.type === 'number' || field.type === 'currency' ? 0 : '')
  }
  return item
}

function addItem() {
  if (!canAdd.value) return
  emit('update:modelValue', [...items.value, createItem()])
}

function removeItem(index) {
  if (!canRemove.value) return
  const next = [...items.value]
  next.splice(index, 1)
  emit('update:modelValue', next)
}

function updateItemField(index, key, value) {
  const next = [...items.value]
  next[index] = { ...next[index], [key]: value }
  emit('update:modelValue', next)
}

function formatFee(amount) {
  return `TZS ${Number(amount || 0).toLocaleString()}`
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h4 class="text-sm font-semibold text-slate-900 dark:text-slate-100">{{ group.label }}</h4>
        <p v-if="group.description" class="text-xs text-slate-500 dark:text-slate-400">{{ group.description }}</p>
      </div>
      <el-button plain :disabled="disabled || !canAdd" @click="addItem">
        <i class="fa-solid fa-plus mr-1" />Add {{ group.itemLabel || 'Item' }}
      </el-button>
    </div>

    <div
      v-for="(item, index) in items"
      :key="index"
      class="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
    >
      <div class="mb-3 flex items-center justify-between">
        <span class="text-sm font-medium text-slate-700 dark:text-slate-200">
          {{ group.itemLabel || 'Item' }} #{{ index + 1 }}
        </span>
        <div class="flex items-center gap-3">
          <span v-if="group.feePerItem > 0" class="text-xs text-slate-500 dark:text-slate-400">
            Fee: {{ formatFee(group.feePerItem) }}
          </span>
          <el-button
           
            text
            type="danger"
            :disabled="disabled || !canRemove"
            @click="removeItem(index)"
          >
            <i class="fa-solid fa-trash-can" />
          </el-button>
        </div>
      </div>

      <SmartFormGrid :max-cols="group.maxCols || 3">
        <SchemaField
          v-for="field in (group.fields || [])"
          :key="field.key"
          :field="field"
          :model-value="item[field.key]"
          :disabled="disabled"
          @update:model-value="updateItemField(index, field.key, $event)"
        />
      </SmartFormGrid>
    </div>

    <div v-if="!items.length" class="rounded-2xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-600">
      <p class="text-sm text-slate-500 dark:text-slate-400">
        No {{ (group.itemLabel || 'item').toLowerCase() }}s added yet.
      </p>
      <el-button class="mt-3" plain :disabled="disabled" @click="addItem">
        <i class="fa-solid fa-plus mr-1" />Add {{ group.itemLabel || 'Item' }}
      </el-button>
    </div>

    <p v-if="group.feePerItem > 0 && items.length > 0" class="text-sm font-medium text-slate-700 dark:text-slate-200">
      Total fee for {{ items.length }} {{ (group.itemLabel || 'item').toLowerCase() }}{{ items.length !== 1 ? 's' : '' }}:
      <span class="text-fcc-brand">{{ formatFee(group.feePerItem * items.length) }}</span>
    </p>
  </div>
</template>
