<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isOffline = ref(!navigator.onLine)
const pendingActions = ref(0)
const showInstallPrompt = ref(false)
let deferredPrompt = null

function handleOnline() {
  isOffline.value = false
  // Trigger sync of queued actions
  if (pendingActions.value > 0) {
    syncPendingActions()
  }
}

function handleOffline() {
  isOffline.value = true
}

function handleBeforeInstallPrompt(e) {
  e.preventDefault()
  deferredPrompt = e
  showInstallPrompt.value = true
}

async function installApp() {
  if (!deferredPrompt) return
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  if (outcome === 'accepted') showInstallPrompt.value = false
  deferredPrompt = null
}

function syncPendingActions() {
  // Placeholder for queued action sync
  pendingActions.value = 0
}

onMounted(() => {
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
})
</script>

<template>
  <div>
    <!-- Offline banner -->
    <Transition name="slide">
      <div v-if="isOffline" class="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center py-2 px-4 text-sm font-medium shadow-md">
        <i class="fa-solid fa-wifi-slash mr-2" />
        You're offline. Some features may be unavailable.
        <span v-if="pendingActions > 0" class="ml-2">{{ pendingActions }} action(s) queued for sync.</span>
      </div>
    </Transition>

    <!-- Install prompt -->
    <Transition name="slide-up">
      <div v-if="showInstallPrompt && !isOffline" class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4">
        <p class="text-sm font-medium text-gray-900 dark:text-white">Install FCC Portal</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Access your applications offline and get notifications.</p>
        <div class="flex gap-2 mt-3">
          <button @click="installApp" class="flex-1 bg-blue-600 text-white text-sm py-1.5 rounded-md hover:bg-blue-700">Install</button>
          <button @click="showInstallPrompt = false" class="flex-1 text-gray-600 dark:text-gray-400 text-sm py-1.5 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">Later</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: transform 0.3s ease; }
.slide-enter-from, .slide-leave-to { transform: translateY(-100%); }
.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.3s ease, opacity 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); opacity: 0; }
</style>
