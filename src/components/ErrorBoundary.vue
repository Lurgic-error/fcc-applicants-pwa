<script setup>
import { onErrorCaptured, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const hasError = ref(false)
const errorMessage = ref('')
const errorStack = ref('')

onErrorCaptured((error) => {
  hasError.value = true
  errorMessage.value = error?.message || 'An unexpected error occurred.'
  errorStack.value = error?.stack || ''
  console.error('[ErrorBoundary]', error)
  return false
})

function retry() {
  hasError.value = false
  errorMessage.value = ''
  errorStack.value = ''
}

function goToDashboard() {
  hasError.value = false
  router.push({ name: 'dashboard' })
}
</script>

<template>
  <div v-if="hasError" class="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
    <div class="mx-auto max-w-md">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <i class="fa-solid fa-triangle-exclamation text-2xl text-red-500" />
      </div>
      <h2 class="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">Something went wrong</h2>
      <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
        An unexpected error occurred while rendering this page. You can try again or return to the dashboard.
      </p>
      <div class="mt-6 flex flex-wrap justify-center gap-3">
        <el-button type="primary" @click="retry">Try Again</el-button>
        <el-button plain @click="goToDashboard">Go to Dashboard</el-button>
      </div>
      <details class="mt-6 text-left">
        <summary class="cursor-pointer text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
          Error details
        </summary>
        <pre class="mt-2 max-h-40 overflow-auto rounded-lg bg-slate-100 p-3 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">{{ errorMessage }}

{{ errorStack }}</pre>
      </details>
    </div>
  </div>
  <slot v-else />
</template>
