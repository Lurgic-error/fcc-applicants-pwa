<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 },
  duration: { type: Number, default: 800 },
  format: { type: Function, default: (v) => Math.round(v).toLocaleString() }
})

const displayValue = ref(0)

function animate(from, to) {
  const startTime = performance.now()
  const diff = to - from

  function step(currentTime) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / props.duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    displayValue.value = from + diff * eased
    if (progress < 1) requestAnimationFrame(step)
  }

  requestAnimationFrame(step)
}

onMounted(() => animate(0, props.value))

watch(() => props.value, (newVal, oldVal) => {
  animate(oldVal || 0, newVal)
})
</script>

<template>
  <span>{{ format(displayValue) }}</span>
</template>
