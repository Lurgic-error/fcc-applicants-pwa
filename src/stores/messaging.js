import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useMessagingStore = defineStore('messaging', () => {
  const threads = ref([])
  const activeThreadId = ref(null)

  const unreadCount = computed(() =>
    threads.value.reduce((sum, t) => sum + (t.unreadCount || 0), 0)
  )

  const activeThread = computed(() =>
    threads.value.find((t) => t.id === activeThreadId.value) || null
  )

  const sortedThreads = computed(() =>
    [...threads.value].sort(
      (a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
    )
  )

  function setActiveThread(id) {
    activeThreadId.value = id
    const thread = threads.value.find((t) => t.id === id)
    if (thread) {
      thread.unreadCount = 0
    }
  }

  function addMessage(threadId, message) {
    const thread = threads.value.find((t) => t.id === threadId)
    if (!thread) return

    const msg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: message.sender || 'You',
      senderRole: message.senderRole || 'applicant',
      text: message.text,
      sentAt: message.sentAt || new Date().toISOString()
    }

    thread.messages.push(msg)
    thread.lastMessageAt = msg.sentAt
    thread.lastMessagePreview = msg.text.length > 80 ? msg.text.slice(0, 80) + '…' : msg.text

    if (msg.senderRole !== 'applicant') {
      thread.unreadCount = (thread.unreadCount || 0) + 1
    }
  }

  function generateSampleThreads(applications = []) {
    if (threads.value.length > 0) return

    const sampleSubjects = [
      'Query on submitted documents',
      'Additional information required',
      'Payment confirmation needed',
      'Application review update',
      'Certificate issuance notice'
    ]

    const officerMessages = [
      'Thank you for submitting your application. We have received all required documents and are currently reviewing them.',
      'We require additional documentation to proceed with your application. Please provide certified copies of the requested items.',
      'Your application has been reviewed by our team. We have a few queries we need you to address before we can proceed.',
      'Please note that your application is currently under review by the assigned officer. We will update you shortly.',
      'Congratulations! Your application has been approved. Please proceed with the payment to receive your certificate.'
    ]

    const applicantMessages = [
      'Thank you for the update. I will provide the requested documents as soon as possible.',
      'I have uploaded the additional documents. Please review and let me know if anything else is needed.',
      'Could you please clarify what specific documents are required?',
      'I am following up on the status of my application. It has been two weeks since submission.',
      'I have made the payment. Please find the proof of payment attached.'
    ]

    const now = new Date()

    for (const app of applications.slice(0, 5)) {
      const idx = threads.value.length % sampleSubjects.length
      const baseTime = new Date(now.getTime() - (threads.value.length + 1) * 3600000)

      const officerMsg = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender: 'FCC Officer',
        senderRole: 'officer',
        text: officerMessages[idx % officerMessages.length],
        sentAt: new Date(baseTime.getTime() - 1800000).toISOString()
      }

      const applicantMsg = {
        id: `msg-${Date.now() + 1}-${Math.random().toString(36).slice(2, 6)}`,
        sender: 'You',
        senderRole: 'applicant',
        text: applicantMessages[idx % applicantMessages.length],
        sentAt: baseTime.toISOString()
      }

      const lastMsg = applicantMsg

      threads.value.push({
        id: `thread-${app.applicationId || app.id || threads.value.length}`,
        applicationId: app.applicationId || app.id || null,
        service: app.service || app.serviceKey || 'General',
        subject: sampleSubjects[idx % sampleSubjects.length],
        participants: ['You', 'FCC Officer'],
        unreadCount: idx % 3 === 0 ? 1 : 0,
        lastMessageAt: lastMsg.sentAt,
        lastMessagePreview: lastMsg.text.length > 80 ? lastMsg.text.slice(0, 80) + '…' : lastMsg.text,
        messages: [officerMsg, applicantMsg]
      })
    }

    // Add a general thread if no applications provided
    if (threads.value.length === 0) {
      const baseTime = new Date(now.getTime() - 7200000)
      threads.value.push({
        id: 'thread-general',
        applicationId: null,
        service: 'General',
        subject: 'Welcome to FCC Messaging',
        participants: ['You', 'FCC Support'],
        unreadCount: 1,
        lastMessageAt: baseTime.toISOString(),
        lastMessagePreview: 'Welcome to the FCC applicant portal. How can we help you today?',
        messages: [
          {
            id: `msg-${Date.now()}-welcome`,
            sender: 'FCC Support',
            senderRole: 'officer',
            text: 'Welcome to the FCC applicant portal. How can we help you today?',
            sentAt: baseTime.toISOString()
          }
        ]
      })
    }
  }

  return {
    threads,
    activeThreadId,
    unreadCount,
    activeThread,
    sortedThreads,
    setActiveThread,
    addMessage,
    generateSampleThreads
  }
})
