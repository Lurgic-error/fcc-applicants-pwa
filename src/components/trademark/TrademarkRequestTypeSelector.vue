<script setup>
import { computed } from 'vue'
import { formatTzs } from '@/constants/trademarkRecordation'

const props = defineProps({
  modelValue: {
    type: String,
    default: 'new_recordation'
  },
  options: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const cards = computed(() =>
  props.options.map((item) => ({
    ...item,
    amountLabel: Number(item.feeTzs || 0) > 0 ? formatTzs(item.feeTzs) : 'No statutory fee'
  }))
)

function selectOption(value) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
    <button
      v-for="item in cards"
      :key="item.key"
      type="button"
      class="rounded-2xl border p-4 text-left transition"
      :class="
        modelValue === item.key
          ? 'border-sky-500 bg-sky-50 shadow-sm'
          : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-slate-50'
      "
      @click="selectOption(item.key)"
    >
      <p class="text-sm font-semibold text-slate-900">{{ item.label }}</p>
      <p class="mt-1 text-xs text-slate-600">{{ item.description }}</p>
      <p class="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {{ item.amountLabel }}
      </p>
    </button>
  </div>
</template>
