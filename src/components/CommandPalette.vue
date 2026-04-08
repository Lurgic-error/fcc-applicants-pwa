<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useApplicantDataStore } from '@/stores/applications'

const props = defineProps({
  visible: { type: Boolean, default: false }
})
const emit = defineEmits(['close'])

const router = useRouter()
const dataStore = useApplicantDataStore()
const query = ref('')
const inputRef = ref(null)
const selectedIndex = ref(0)
const listboxId = 'command-palette-listbox'

const commands = [
  { id: 'dashboard', label: 'Go to Dashboard', icon: 'fa-solid fa-gauge', route: { name: 'dashboard' } },
  { id: 'services', label: 'Browse Services', icon: 'fa-solid fa-grid-2', route: { name: 'services' } },
  { id: 'applications', label: 'My Applications', icon: 'fa-solid fa-file-lines', route: { name: 'applications' } },
  { id: 'certificates', label: 'View Certificates', icon: 'fa-solid fa-certificate', route: { name: 'certificates' } },
  { id: 'payments', label: 'View Payments', icon: 'fa-solid fa-credit-card', route: { name: 'payments' } },
  { id: 'settings', label: 'Account Settings', icon: 'fa-solid fa-gear', route: { name: 'settings' } },
  { id: 'profile', label: 'My Profile', icon: 'fa-solid fa-user', route: { name: 'profile' } },
  { id: 'support', label: 'Get Support', icon: 'fa-solid fa-life-ring', route: { name: 'support' } },
  { id: 'new-trademark', label: 'New Trademark Application', icon: 'fa-solid fa-plus', route: { name: 'application-create', params: { serviceKey: 'trademark-recordation' } } },
  { id: 'new-merger', label: 'New Merger Notification (FCC-8)', icon: 'fa-solid fa-plus', route: { name: 'merger-fcc8-create' } },
  { id: 'new-sfcc', label: 'New SFCC Registration', icon: 'fa-solid fa-plus', route: { name: 'application-create', params: { serviceKey: 'sfcc-registration' } } }
]

const filteredCommands = computed(() => {
  if (!query.value.trim()) return commands
  const q = query.value.toLowerCase()
  return commands.filter((cmd) => cmd.label.toLowerCase().includes(q))
})

const entityResults = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (q.length < 3) return []
  const results = []

  for (const app of (dataStore.applications || [])) {
    if (
      String(app.applicationId || '').toLowerCase().includes(q) ||
      String(app.service || '').toLowerCase().includes(q)
    ) {
      results.push({
        id: `app-${app.applicationId}`,
        label: `${app.applicationId} — ${app.service || 'Application'}`,
        icon: 'fa-solid fa-file-lines',
        type: 'Application',
        route: { name: 'application-details', params: { serviceKey: app.serviceKey, id: app.applicationId } }
      })
    }
  }

  for (const pay of (dataStore.payments || [])) {
    if (
      String(pay.applicationId || '').toLowerCase().includes(q) ||
      String(pay.controlNumber || '').toLowerCase().includes(q)
    ) {
      results.push({
        id: `pay-${pay.id}`,
        label: `Payment: ${pay.controlNumber || pay.applicationId}`,
        icon: 'fa-solid fa-credit-card',
        type: 'Payment',
        route: { name: 'payment-details', params: { id: pay.id } }
      })
    }
  }

  for (const cert of (dataStore.certificates || [])) {
    if (
      String(cert.certificateId || '').toLowerCase().includes(q) ||
      String(cert.service || '').toLowerCase().includes(q)
    ) {
      results.push({
        id: `cert-${cert.certificateId}`,
        label: `Certificate: ${cert.certificateId}`,
        icon: 'fa-solid fa-certificate',
        type: 'Certificate',
        route: { name: 'certificate-details', params: { id: cert.certificateId } }
      })
    }
  }

  return results.slice(0, 10)
})

const allResults = computed(() => {
  const cmds = filteredCommands.value.map((cmd) => ({ ...cmd, type: 'Command' }))
  if (entityResults.value.length) {
    return [...entityResults.value, ...cmds]
  }
  return cmds
})

const activeOptionId = computed(() => {
  const item = allResults.value[selectedIndex.value]
  return item ? `cmd-option-${item.id}` : undefined
})

watch(() => props.visible, (val) => {
  if (val) {
    query.value = ''
    selectedIndex.value = 0
    nextTick(() => inputRef.value?.focus())
  }
})

watch(query, () => { selectedIndex.value = 0 })

function handleKeydown(event) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, allResults.value.length - 1)
    scrollToSelected()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
    scrollToSelected()
  } else if (event.key === 'Enter') {
    event.preventDefault()
    const cmd = allResults.value[selectedIndex.value]
    if (cmd) execute(cmd)
  } else if (event.key === 'Escape') {
    emit('close')
  }
}

function scrollToSelected() {
  nextTick(() => {
    const el = document.getElementById(activeOptionId.value)
    el?.scrollIntoView({ block: 'nearest' })
  })
}

function execute(cmd) {
  emit('close')
  router.push(cmd.route)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-[900] flex items-start justify-center bg-black/50 pt-[15vh]"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        @click.self="emit('close')"
      >
        <div
          class="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
          @keydown="handleKeydown"
        >
          <div class="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              role="combobox"
              aria-label="Command palette"
              aria-autocomplete="list"
              :aria-expanded="allResults.length > 0"
              :aria-controls="listboxId"
              :aria-activedescendant="activeOptionId"
              autocomplete="off"
              placeholder="Search applications, certificates, or commands..."
              class="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          <div
            :id="listboxId"
            role="listbox"
            aria-label="Search results"
            class="max-h-72 overflow-y-auto py-2"
          >
            <button
              v-for="(cmd, index) in allResults"
              :key="cmd.id"
              :id="`cmd-option-${cmd.id}`"
              role="option"
              :aria-selected="index === selectedIndex"
              class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition"
              :class="index === selectedIndex ? 'bg-fcc-brand/10 text-fcc-brand' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'"
              @click="execute(cmd)"
              @mouseenter="selectedIndex = index"
            >
              <i :class="cmd.icon" class="w-5 text-center text-xs opacity-60" aria-hidden="true" />
              <span>{{ cmd.label }}</span>
              <span
                v-if="cmd.type !== 'Command'"
                class="ml-auto rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                aria-label="Type: {{ cmd.type }}"
              >
                {{ cmd.type }}
              </span>
            </button>

            <p v-if="allResults.length === 0" role="status" class="px-4 py-6 text-center text-sm text-slate-400">
              No matching commands
            </p>
          </div>

          <div class="border-t border-slate-200 px-4 py-2 text-xs text-slate-400 dark:border-slate-700" aria-hidden="true">
            <kbd class="rounded border border-slate-300 px-1.5 py-0.5 font-mono text-[10px] dark:border-slate-600">↑↓</kbd> navigate
            <kbd class="ml-2 rounded border border-slate-300 px-1.5 py-0.5 font-mono text-[10px] dark:border-slate-600">↵</kbd> select
            <kbd class="ml-2 rounded border border-slate-300 px-1.5 py-0.5 font-mono text-[10px] dark:border-slate-600">esc</kbd> close
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
