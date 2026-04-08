<script setup>
import { ref } from 'vue'

const message = ref('')
let clearTimeout_ = null

function announce(text) {
  message.value = ''
  clearTimeout(clearTimeout_)
  requestAnimationFrame(() => {
    message.value = text
    clearTimeout_ = setTimeout(() => {
      message.value = ''
    }, 5000)
  })
}

defineExpose({ announce })
</script>

<template>
  <div
    role="status"
    aria-live="polite"
    aria-atomic="true"
    class="sr-only"
  >
    {{ message }}
  </div>
</template>
