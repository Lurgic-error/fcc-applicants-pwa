<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: {
    type: String,
    default: 'active'
  }
})

const tone = computed(() => {
  const status = String(props.value || '').toLowerCase()

  if (
    status.includes('confirmed') ||
    status.includes('issued') ||
    status.includes('approved') ||
    status.includes('verified') ||
    status.includes('paid')
  ) {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
  }

  if (status.includes('pending') || status.includes('awaiting') || status.includes('screening') || status.includes('vetting')) {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
  }

  if (status.includes('failed') || status.includes('rejected') || status.includes('closed') || status.includes('dropped')) {
    return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
  }

  return 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300'
})
</script>

<template>
  <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize" :class="tone">
    {{ value }}
  </span>
</template>
