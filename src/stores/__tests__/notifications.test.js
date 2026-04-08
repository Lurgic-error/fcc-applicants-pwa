import { describe, expect, it, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotificationStore } from '@/stores/notifications'

describe('notifications store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with empty notifications', () => {
    const store = useNotificationStore()
    expect(store.notifications).toHaveLength(0)
    expect(store.unreadCount).toBe(0)
  })

  it('adds a notification with auto-generated id', () => {
    const store = useNotificationStore()
    store.addNotification({ type: 'info', title: 'Test', message: 'Hello' })
    expect(store.notifications).toHaveLength(1)
    expect(store.notifications[0].id).toBeTruthy()
    expect(store.notifications[0].read).toBe(false)
    expect(store.unreadCount).toBe(1)
  })

  it('marks notification as read', () => {
    const store = useNotificationStore()
    store.addNotification({ type: 'info', title: 'Test', message: 'Hello' })
    const id = store.notifications[0].id
    store.markAsRead(id)
    expect(store.unreadCount).toBe(0)
    expect(store.notifications[0].read).toBe(true)
  })

  it('marks all as read', () => {
    const store = useNotificationStore()
    store.addNotification({ type: 'info', title: 'A', message: '1' })
    store.addNotification({ type: 'warning', title: 'B', message: '2' })
    expect(store.unreadCount).toBe(2)
    store.markAllAsRead()
    expect(store.unreadCount).toBe(0)
  })

  it('removes a notification', () => {
    const store = useNotificationStore()
    store.addNotification({ type: 'info', title: 'Test', message: 'Hello' })
    const id = store.notifications[0].id
    store.removeNotification(id)
    expect(store.notifications).toHaveLength(0)
  })

  it('sorts notifications by date descending', () => {
    const store = useNotificationStore()
    store.addNotification({ type: 'info', title: 'Old', message: 'old' })
    // Manually backdate the first
    store.notifications[0].createdAt = '2025-01-01T00:00:00Z'
    store.addNotification({ type: 'info', title: 'New', message: 'new' })
    expect(store.sortedNotifications[0].title).toBe('New')
  })

  it('generates sample notifications from application data', () => {
    const store = useNotificationStore()
    store.generateSampleNotifications(
      [{ applicationId: 'APP-1', status: 'query_raised', serviceKey: 'trademark-recordation' }],
      [{ applicationId: 'APP-1', balance: 50000 }],
      []
    )
    expect(store.notifications.length).toBeGreaterThan(0)
  })

  it('does not regenerate sample notifications if already populated', () => {
    const store = useNotificationStore()
    store.addNotification({ type: 'info', title: 'Existing', message: 'x' })
    const count = store.notifications.length
    store.generateSampleNotifications([{ applicationId: 'APP-1', status: 'query' }], [], [])
    expect(store.notifications.length).toBe(count)
  })
})
