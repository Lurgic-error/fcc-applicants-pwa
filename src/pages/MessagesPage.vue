<script setup>
import { onMounted } from 'vue'
import { FccPageHeader } from '@shared/design-system/components'
import MessageThread from '@/components/MessageThread.vue'
import { useMessagingStore } from '@/stores/messaging'
import { useApplicantDataStore } from '@/stores/applications'

const messagingStore = useMessagingStore()
const dataStore = useApplicantDataStore()

function formatRelativeTime(isoString) {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function handleSend({ threadId, text }) {
  messagingStore.addMessage(threadId, {
    sender: 'You',
    senderRole: 'applicant',
    text
  })
}

onMounted(async () => {
  if (!dataStore.applications.length) {
    try {
      await dataStore.loadApplications()
    } catch {
      // Fall back to empty — generateSampleThreads handles the no-apps case
    }
  }
  messagingStore.generateSampleThreads(dataStore.applications)

  // Auto-select the first thread
  if (!messagingStore.activeThreadId && messagingStore.sortedThreads.length) {
    messagingStore.setActiveThread(messagingStore.sortedThreads[0].id)
  }
})
</script>

<template>
  <section>
    <FccPageHeader
      title="Messages"
      subtitle="Communicate directly with FCC officers about your applications."
      borderless
    />

    <!-- Main messaging container -->
    <div class="mt-6 flex h-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">

      <!-- Thread list panel -->
      <aside class="flex w-80 shrink-0 flex-col border-r border-slate-200 dark:border-slate-700">
        <!-- Panel header -->
        <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <h2 class="text-sm font-semibold text-fcc-ink dark:text-slate-100">Conversations</h2>
          <span
            v-if="messagingStore.unreadCount > 0"
            class="inline-flex items-center justify-center rounded-full bg-fcc-brand px-2 py-0.5 text-xs font-bold text-white"
          >
            {{ messagingStore.unreadCount }}
          </span>
        </div>

        <!-- Thread list scrollable -->
        <div class="flex-1 overflow-y-auto">
          <!-- Empty state -->
          <div
            v-if="messagingStore.sortedThreads.length === 0"
            class="flex h-full flex-col items-center justify-center px-4 text-center"
          >
            <i class="fa-solid fa-inbox text-2xl text-slate-300 dark:text-slate-600" />
            <p class="mt-3 text-sm text-slate-400 dark:text-slate-500">No conversations yet.</p>
          </div>

          <!-- Thread items -->
          <button
            v-for="thread in messagingStore.sortedThreads"
            :key="thread.id"
            type="button"
            class="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0 dark:border-slate-800"
            :class="
              messagingStore.activeThreadId === thread.id
                ? 'bg-fcc-brand/5 dark:bg-fcc-brand/10'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800'
            "
            @click="messagingStore.setActiveThread(thread.id)"
          >
            <!-- Avatar / icon -->
            <div class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
              <i class="fa-solid fa-comments text-sm text-slate-500 dark:text-slate-300" aria-hidden="true" />
            </div>

            <!-- Thread info -->
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-1">
                <p
                  class="truncate text-sm font-medium"
                  :class="
                    messagingStore.activeThreadId === thread.id
                      ? 'text-fcc-brand'
                      : 'text-fcc-ink dark:text-slate-100'
                  "
                >
                  {{ thread.subject }}
                </p>
                <span class="shrink-0 text-[10px] text-slate-400 dark:text-slate-500">
                  {{ formatRelativeTime(thread.lastMessageAt) }}
                </span>
              </div>

              <p class="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                {{ thread.service }}
                <span v-if="thread.applicationId" class="font-mono text-fcc-brand"> · {{ thread.applicationId }}</span>
              </p>

              <div class="mt-1 flex items-center justify-between gap-2">
                <p class="truncate text-[11px] text-slate-400 dark:text-slate-500">
                  {{ thread.lastMessagePreview }}
                </p>
                <span
                  v-if="thread.unreadCount > 0"
                  class="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-fcc-brand text-[10px] font-bold text-white"
                >
                  {{ thread.unreadCount }}
                </span>
              </div>
            </div>
          </button>
        </div>
      </aside>

      <!-- Chat panel -->
      <div class="flex min-w-0 flex-1 flex-col">
        <MessageThread
          :thread="messagingStore.activeThread"
          @send="handleSend"
        />
      </div>
    </div>
  </section>
</template>
