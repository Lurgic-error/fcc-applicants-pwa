<script setup>
import { computed } from 'vue'

const props = defineProps({
  events: { type: Array, default: () => [] }
})

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function eventIcon(type) {
  const icons = {
    submitted: 'fa-solid fa-paper-plane',
    assigned: 'fa-solid fa-user-check',
    payment: 'fa-solid fa-credit-card',
    review: 'fa-solid fa-magnifying-glass',
    approved: 'fa-solid fa-circle-check',
    rejected: 'fa-solid fa-circle-xmark',
    query: 'fa-solid fa-comment-dots',
    certificate: 'fa-solid fa-certificate',
    stage_change: 'fa-solid fa-arrow-right',
    default: 'fa-solid fa-circle-dot'
  }
  return icons[type] || icons.default
}

function eventColor(type) {
  const colors = {
    submitted: 'bg-blue-500',
    assigned: 'bg-indigo-500',
    payment: 'bg-cyan-500',
    review: 'bg-amber-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    query: 'bg-orange-500',
    certificate: 'bg-emerald-500',
    stage_change: 'bg-slate-500',
    default: 'bg-slate-400'
  }
  return colors[type] || colors.default
}

const sortedEvents = computed(() =>
  [...props.events].sort((a, b) => {
    const dateA = new Date(a.date || a.timestamp || 0)
    const dateB = new Date(b.date || b.timestamp || 0)
    return dateB.getTime() - dateA.getTime()
  })
)
</script>

<template>
  <div v-if="sortedEvents.length" class="relative">
    <div class="absolute left-4 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />

    <div
      v-for="(event, index) in sortedEvents"
      :key="index"
      class="relative flex gap-4 pb-6 last:pb-0"
    >
      <div
        class="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
        :class="eventColor(event.type)"
      >
        <i :class="eventIcon(event.type)" class="text-xs" />
      </div>

      <div class="min-w-0 flex-1 pt-0.5">
        <p class="text-sm font-medium text-slate-900 dark:text-slate-100">
          {{ event.title }}
        </p>
        <p v-if="event.description" class="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
          {{ event.description }}
        </p>
        <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{{ formatDate(event.date || event.timestamp) }}</span>
          <span v-if="formatTime(event.date || event.timestamp)">{{ formatTime(event.date || event.timestamp) }}</span>
          <span v-if="event.actor" class="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
            {{ event.actor }}
          </span>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
    No activity recorded yet.
  </div>
</template>
