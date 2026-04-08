<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  thread: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['send'])

const inputText = ref('')
const messagesEndRef = ref(null)

function formatTime(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleTimeString('en-TZ', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDate(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('en-TZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesEndRef.value) {
      messagesEndRef.value.scrollIntoView({ behavior: 'smooth' })
    }
  })
}

watch(
  () => props.thread?.messages?.length,
  () => {
    scrollToBottom()
  }
)

watch(
  () => props.thread?.id,
  () => {
    scrollToBottom()
  }
)

function handleSend() {
  const text = inputText.value.trim()
  if (!text || !props.thread) return

  emit('send', {
    threadId: props.thread.id,
    text
  })
  inputText.value = ''
}

function handleKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
}
</script>

<template>
  <!-- Empty state when no thread selected -->
  <div
    v-if="!thread"
    class="flex h-full flex-col items-center justify-center text-center"
  >
    <div class="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
      <i class="fa-solid fa-comments text-3xl text-slate-300 dark:text-slate-600" aria-hidden="true" />
    </div>
    <p class="mt-4 text-base font-semibold text-slate-500 dark:text-slate-400">No conversation selected</p>
    <p class="mt-1 text-sm text-slate-400 dark:text-slate-500">Select a thread from the list to view messages.</p>
  </div>

  <!-- Thread chat view -->
  <div v-else class="flex h-full flex-col">
    <!-- Thread header -->
    <div class="shrink-0 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {{ thread.service }}
        <span v-if="thread.applicationId" class="ml-1.5 font-mono normal-case text-fcc-brand">
          {{ thread.applicationId }}
        </span>
      </p>
      <h3 class="mt-0.5 font-semibold text-fcc-ink dark:text-slate-100">{{ thread.subject }}</h3>
      <p class="text-xs text-slate-400 dark:text-slate-500">
        Participants: {{ thread.participants.join(', ') }}
      </p>
    </div>

    <!-- Messages scroll area -->
    <div class="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      <template v-if="thread.messages.length">
        <!-- Date separator above first message -->
        <div class="flex items-center gap-3 py-1">
          <div class="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          <span class="shrink-0 text-xs text-slate-400 dark:text-slate-500">
            {{ formatDate(thread.messages[0]?.sentAt) }}
          </span>
          <div class="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>

        <div
          v-for="message in thread.messages"
          :key="message.id"
          class="flex"
          :class="message.senderRole === 'applicant' ? 'justify-end' : 'justify-start'"
        >
          <!-- Officer avatar (left side) -->
          <div
            v-if="message.senderRole !== 'applicant'"
            class="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700"
          >
            <i class="fa-solid fa-user-tie text-xs text-slate-500 dark:text-slate-300" aria-hidden="true" />
          </div>

          <!-- Bubble -->
          <div class="max-w-[75%]">
            <div
              class="rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
              :class="
                message.senderRole === 'applicant'
                  ? 'rounded-br-sm bg-fcc-brand text-white'
                  : 'rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
              "
            >
              {{ message.text }}
            </div>
            <p
              class="mt-1 text-[11px] text-slate-400"
              :class="message.senderRole === 'applicant' ? 'text-right' : 'text-left'"
            >
              {{ message.sender }} · {{ formatTime(message.sentAt) }}
            </p>
          </div>

          <!-- Applicant avatar (right side) -->
          <div
            v-if="message.senderRole === 'applicant'"
            class="ml-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fcc-brand/10"
          >
            <i class="fa-solid fa-user text-xs text-fcc-brand" aria-hidden="true" />
          </div>
        </div>
      </template>

      <!-- Scroll anchor -->
      <div ref="messagesEndRef" />
    </div>

    <!-- Message input -->
    <div class="shrink-0 border-t border-slate-200 px-4 py-3 dark:border-slate-700">
      <div class="flex items-end gap-2">
        <textarea
          v-model="inputText"
          rows="2"
          placeholder="Type a message… (Enter to send)"
          class="flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-fcc-brand focus:outline-none focus:ring-1 focus:ring-fcc-brand dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          @keydown="handleKeydown"
        />
        <button
          type="button"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fcc-brand text-white transition hover:opacity-90 disabled:opacity-40"
          :disabled="!inputText.trim()"
          aria-label="Send message"
          @click="handleSend"
        >
          <i class="fa-solid fa-paper-plane text-sm" aria-hidden="true" />
        </button>
      </div>
      <p class="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
        Press <kbd class="rounded border border-slate-300 px-1 py-0.5 font-mono dark:border-slate-600">Enter</kbd> to send,
        <kbd class="rounded border border-slate-300 px-1 py-0.5 font-mono dark:border-slate-600">Shift+Enter</kbd> for new line
      </p>
    </div>
  </div>
</template>
