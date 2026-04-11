<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notifications'

const router = useRouter()
const notifStore = useNotificationStore()
const panelRef = ref(null)

const emit = defineEmits(['close'])

function iconForType(type) {
  const icons = {
    info: 'fa-solid fa-circle-info text-blue-500',
    warning: 'fa-solid fa-triangle-exclamation text-amber-500',
    success: 'fa-solid fa-circle-check text-green-500',
    error: 'fa-solid fa-circle-xmark text-red-500'
  }
  return icons[type] || icons.info
}

function timeAgo(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

function handleClick(notif) {
  notifStore.markAsRead(notif.id)
  if (notif.link) router.push(notif.link)
}

// Focus trap: keep focus inside the panel while open
function handleFocusTrap(event) {
  if (!panelRef.value) return
  const focusable = panelRef.value.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (event.key === 'Tab') {
    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      }
    } else {
      if (document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
  }

  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleFocusTrap)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleFocusTrap)
})
</script>

<template>
  <div
    ref="panelRef"
    role="dialog"
    aria-label="Notifications"
    aria-modal="true"
    class="w-80 max-h-96 overflow-y-auto"
    tabindex="-1"
  >
    <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
      <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100" id="notifications-heading">Notifications</h3>
      <el-button v-if="notifStore.unreadCount > 0" link type="primary" @click="notifStore.markAllAsRead()">
        Mark all read
      </el-button>
    </div>

    <div v-if="notifStore.sortedNotifications.length === 0" class="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400" role="status">
      No notifications
    </div>

    <ul v-else role="list" class="list-none m-0 p-0">
      <li
        v-for="notif in notifStore.sortedNotifications"
        :key="notif.id"
        role="listitem"
        class="flex cursor-pointer gap-3 border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
        :class="notif.read ? 'opacity-60' : ''"
        tabindex="0"
        :aria-label="`${notif.title}: ${notif.message}. ${timeAgo(notif.createdAt)}. ${notif.read ? 'Read' : 'Unread'}.`"
        @click="handleClick(notif)"
        @keydown.enter="handleClick(notif)"
        @keydown.space.prevent="handleClick(notif)"
      >
        <i :class="iconForType(notif.type)" class="mt-0.5 shrink-0" aria-hidden="true" />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ notif.title }}</p>
          <p class="mt-0.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{{ notif.message }}</p>
          <p class="mt-1 text-xs text-slate-400" aria-label="Received {{ timeAgo(notif.createdAt) }}">{{ timeAgo(notif.createdAt) }}</p>
        </div>
        <div v-if="!notif.read" class="mt-1 h-2 w-2 shrink-0 rounded-full bg-fcc-brand" aria-label="Unread" />
      </li>
    </ul>
  </div>
</template>
