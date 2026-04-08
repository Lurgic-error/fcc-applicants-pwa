<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  page: { type: String, default: 'dashboard' }
})

const ONBOARDING_KEY_PREFIX = 'fcc_applicant_onboarding_seen_'

const tipsByPage = {
  dashboard: [
    { title: 'Welcome!', description: 'This is your application dashboard. Track all your submissions here.' }
  ],
  applications: [
    { title: 'Your Applications', description: 'Click any application to see its status and take action.' }
  ],
  'new-application': [
    { title: 'Getting Started', description: 'Select a service to begin your application.' }
  ],
  services: [
    { title: 'Available Services', description: 'Browse and apply for any FCC regulatory service — Trademark Recordation, Merger Clearance, SFCC Registration, and more.' }
  ],
  certificates: [
    { title: 'Your Certificates', description: 'Download approved certificates from here once your application has been processed.' }
  ],
  payments: [
    { title: 'Manage Payments', description: 'View payment obligations and confirm payments using your GePG control numbers.' }
  ]
}

const storageKey = computed(() => `${ONBOARDING_KEY_PREFIX}${props.page}`)

const firstTime = computed(() => !localStorage.getItem(storageKey.value))

const visible = ref(false)
const currentTipIndex = ref(0)
const dontShowAgain = ref(false)

const pageTips = computed(() => tipsByPage[props.page] || [])
const currentTip = computed(() => pageTips.value[currentTipIndex.value] || null)

function dismiss() {
  if (dontShowAgain.value) {
    localStorage.setItem(storageKey.value, 'true')
  }
  visible.value = false
}

function nextTip() {
  if (currentTipIndex.value < pageTips.value.length - 1) {
    currentTipIndex.value++
  } else {
    localStorage.setItem(storageKey.value, 'true')
    visible.value = false
  }
}

onMounted(() => {
  if (firstTime.value && pageTips.value.length > 0) {
    visible.value = true
  }
})
</script>

<template>
  <Transition name="tip-fade">
    <div
      v-if="visible && currentTip"
      role="dialog"
      aria-modal="false"
      :aria-label="`Tip: ${currentTip.title}`"
      class="fixed bottom-6 right-6 z-[700] w-72 rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
    >
      <div class="p-4">
        <div class="flex items-start justify-between gap-3">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fcc-brand/10">
            <i class="fa-solid fa-lightbulb text-sm text-fcc-brand" aria-hidden="true" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">{{ currentTip.title }}</p>
            <p class="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{{ currentTip.description }}</p>
          </div>
          <button
            class="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Dismiss tip"
            @click="dismiss"
          >
            <i class="fa-solid fa-xmark text-xs" aria-hidden="true" />
          </button>
        </div>

        <!-- Dot indicators when there are multiple tips -->
        <div v-if="pageTips.length > 1" class="mt-3 flex justify-center gap-1.5" aria-hidden="true">
          <span
            v-for="(_, i) in pageTips"
            :key="i"
            class="h-1.5 rounded-full transition-all"
            :class="i === currentTipIndex ? 'w-4 bg-fcc-brand' : 'w-1.5 bg-slate-300 dark:bg-slate-600'"
          />
        </div>

        <div class="mt-3 flex items-center justify-between">
          <label class="flex cursor-pointer items-center gap-1.5 text-xs text-slate-400">
            <input
              v-model="dontShowAgain"
              type="checkbox"
              class="accent-fcc-brand"
              :aria-label="`Don't show tips for this page again`"
            />
            Don't show again
          </label>

          <button
            class="rounded-lg bg-fcc-brand px-3 py-1 text-xs font-medium text-white transition hover:opacity-90"
            @click="nextTip"
          >
            {{ currentTipIndex === pageTips.length - 1 ? 'Got it' : 'Next' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.tip-fade-enter-active,
.tip-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.tip-fade-enter-from,
.tip-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
