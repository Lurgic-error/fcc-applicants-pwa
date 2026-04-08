import { describe, expect, it, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMessagingStore } from '@/stores/messaging'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeApplication(overrides = {}) {
  return {
    applicationId: 'APP-001',
    service: 'sfcc-registration',
    ...overrides
  }
}

function makeThread(overrides = {}) {
  return {
    id: 'thread-test-1',
    applicationId: 'APP-001',
    service: 'sfcc-registration',
    subject: 'Test Thread',
    participants: ['You', 'FCC Officer'],
    unreadCount: 0,
    lastMessageAt: new Date().toISOString(),
    lastMessagePreview: 'Last message preview text.',
    messages: [],
    ...overrides
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('messaging store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // ── initial state ──────────────────────────────────────────────────────────

  it('starts with empty threads', () => {
    const store = useMessagingStore()
    expect(store.threads).toEqual([])
  })

  it('unreadCount is 0 initially', () => {
    const store = useMessagingStore()
    expect(store.unreadCount).toBe(0)
  })

  it('activeThread is null when no thread selected', () => {
    const store = useMessagingStore()
    expect(store.activeThread).toBeNull()
  })

  // ── setActiveThread ────────────────────────────────────────────────────────

  it('setActiveThread sets activeThreadId', () => {
    const store = useMessagingStore()
    store.threads.push(makeThread({ id: 'thread-A', unreadCount: 2 }))

    store.setActiveThread('thread-A')

    expect(store.activeThreadId).toBe('thread-A')
    expect(store.activeThread?.id).toBe('thread-A')
  })

  it('setActiveThread marks thread unread count to 0', () => {
    const store = useMessagingStore()
    store.threads.push(makeThread({ id: 'thread-B', unreadCount: 5 }))

    store.setActiveThread('thread-B')

    expect(store.threads[0].unreadCount).toBe(0)
  })

  // ── addMessage ─────────────────────────────────────────────────────────────

  it('addMessage appends message to correct thread', () => {
    const store = useMessagingStore()
    store.threads.push(makeThread({ id: 'thread-C', messages: [] }))

    store.addMessage('thread-C', {
      sender: 'You',
      senderRole: 'applicant',
      text: 'Hello FCC.'
    })

    expect(store.threads[0].messages).toHaveLength(1)
    expect(store.threads[0].messages[0].text).toBe('Hello FCC.')
  })

  it('addMessage updates lastMessageAt', () => {
    const store = useMessagingStore()
    const oldTime = new Date(Date.now() - 60000).toISOString()
    store.threads.push(makeThread({ id: 'thread-D', lastMessageAt: oldTime, messages: [] }))

    store.addMessage('thread-D', {
      sender: 'You',
      senderRole: 'applicant',
      text: 'A new message.',
      sentAt: new Date().toISOString()
    })

    expect(store.threads[0].lastMessageAt).not.toBe(oldTime)
  })

  it('addMessage updates lastMessagePreview to first 80 chars', () => {
    const store = useMessagingStore()
    store.threads.push(makeThread({ id: 'thread-E', messages: [] }))

    const longText = 'A'.repeat(100)
    store.addMessage('thread-E', {
      sender: 'You',
      senderRole: 'applicant',
      text: longText
    })

    const preview = store.threads[0].lastMessagePreview
    expect(preview).toHaveLength(81) // 80 chars + ellipsis character
    expect(preview.endsWith('…')).toBe(true)
  })

  it('addMessage does not increment unreadCount for applicant messages', () => {
    const store = useMessagingStore()
    store.threads.push(makeThread({ id: 'thread-F', unreadCount: 0, messages: [] }))

    store.addMessage('thread-F', {
      sender: 'You',
      senderRole: 'applicant',
      text: 'Applicant message.'
    })

    expect(store.threads[0].unreadCount).toBe(0)
  })

  it('addMessage increments unreadCount for non-applicant messages', () => {
    const store = useMessagingStore()
    store.threads.push(makeThread({ id: 'thread-G', unreadCount: 0, messages: [] }))

    store.addMessage('thread-G', {
      sender: 'FCC Officer',
      senderRole: 'officer',
      text: 'Officer reply.'
    })

    expect(store.threads[0].unreadCount).toBe(1)
  })

  // ── sortedThreads ──────────────────────────────────────────────────────────

  it('sortedThreads returns newest first', () => {
    const store = useMessagingStore()
    const older = makeThread({ id: 'thread-OLD', lastMessageAt: '2026-01-01T00:00:00.000Z' })
    const newer = makeThread({ id: 'thread-NEW', lastMessageAt: '2026-03-01T00:00:00.000Z' })

    store.threads.push(older)
    store.threads.push(newer)

    const sorted = store.sortedThreads
    expect(sorted[0].id).toBe('thread-NEW')
    expect(sorted[1].id).toBe('thread-OLD')
  })

  // ── generateSampleThreads ──────────────────────────────────────────────────

  it('generateSampleThreads creates threads from applications', () => {
    const store = useMessagingStore()

    store.generateSampleThreads([
      makeApplication({ applicationId: 'APP-100' }),
      makeApplication({ applicationId: 'APP-101' })
    ])

    expect(store.threads.length).toBeGreaterThan(0)
    const ids = store.threads.map((t) => t.applicationId)
    expect(ids).toContain('APP-100')
    expect(ids).toContain('APP-101')
  })

  it('generateSampleThreads does not duplicate when called twice', () => {
    const store = useMessagingStore()
    const apps = [makeApplication({ applicationId: 'APP-200' })]

    store.generateSampleThreads(apps)
    const countAfterFirst = store.threads.length

    store.generateSampleThreads(apps)
    expect(store.threads.length).toBe(countAfterFirst)
  })

  it('generateSampleThreads creates a general thread when no applications provided', () => {
    const store = useMessagingStore()

    store.generateSampleThreads([])

    expect(store.threads).toHaveLength(1)
    expect(store.threads[0].id).toBe('thread-general')
    expect(store.threads[0].applicationId).toBeNull()
  })
})
