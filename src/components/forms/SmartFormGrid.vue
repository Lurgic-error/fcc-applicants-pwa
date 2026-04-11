<script setup>
/**
 * SmartFormGrid — Intelligent adaptive form layout.
 *
 * Eliminates empty grid cells by computing row-balanced placement from
 * actual visible children. Textareas, uploads, and full-width items
 * always span their own row. Remaining fields are distributed across a
 * 12-column base grid so each row can rebalance independently.
 *
 * Props:
 *   maxCols — max columns on desktop (1-4, default 2)
 *   gap     — gap size: 'sm' | 'md' | 'lg' (default 'md')
 */
import { ref } from 'vue'
import { useSmartFormGrid } from '@/composables/useSmartFormGrid'

const props = defineProps({
  maxCols: { type: Number, default: 2, validator: v => v >= 1 && v <= 4 },
  gap: { type: String, default: 'md', validator: v => ['sm', 'md', 'lg'].includes(v) },
})

const gridRef = ref(null)
const { gridStyle } = useSmartFormGrid(gridRef, props)
</script>

<template>
  <div ref="gridRef" class="sfg" :style="gridStyle">
    <slot />
  </div>
</template>

<style scoped>
.sfg {
  width: 100%;
  min-width: 0;
  align-items: start;
}

.sfg > :deep(*) {
  min-width: 0;
}

.sfg > :deep(.col-span-full),
.sfg > :deep([full-width]),
.sfg > :deep([data-span="full"]),
.sfg > :deep([data-full-width="true"]) {
  grid-column: 1 / -1;
}
</style>
