import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref([])

  const unreadCount = computed(() =>
    notifications.value.filter((n) => !n.read).length
  )

  const sortedNotifications = computed(() =>
    [...notifications.value].sort((a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    )
  )

  function addNotification({ type, title, message, link }) {
    notifications.value.push({
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: type || 'info',
      title,
      message,
      link: link || null,
      read: false,
      createdAt: new Date().toISOString()
    })
  }

  function markAsRead(id) {
    const notif = notifications.value.find((n) => n.id === id)
    if (notif) notif.read = true
  }

  function markAllAsRead() {
    for (const notif of notifications.value) {
      notif.read = true
    }
  }

  function removeNotification(id) {
    notifications.value = notifications.value.filter((n) => n.id !== id)
  }

  function generateSampleNotifications(applications = [], payments = [], certificates = []) {
    if (notifications.value.length > 0) return

    for (const app of applications.slice(0, 3)) {
      if (String(app.status || '').toLowerCase().includes('query')) {
        addNotification({
          type: 'warning',
          title: 'Query Raised',
          message: `FCC has raised a query on ${app.applicationId}. Please respond.`,
          link: { name: 'application-details', params: { serviceKey: app.serviceKey, id: app.applicationId } }
        })
      }
    }

    for (const payment of payments.slice(0, 2)) {
      const balance = Number(payment.balance || 0)
      if (balance > 0) {
        addNotification({
          type: 'info',
          title: 'Payment Pending',
          message: `TZS ${balance.toLocaleString()} outstanding for ${payment.applicationId}.`,
          link: { name: 'payments' }
        })
      }
    }

    for (const cert of certificates.slice(0, 2)) {
      if (cert.lifecycle === 'Expiry Soon') {
        addNotification({
          type: 'warning',
          title: 'Certificate Expiring',
          message: `Certificate ${cert.certificateId} expires soon.`,
          link: { name: 'certificate-details', params: { id: cert.certificateId } }
        })
      }
    }
  }

  return {
    notifications, unreadCount, sortedNotifications,
    addNotification, markAsRead, markAllAsRead, removeNotification, generateSampleNotifications
  }
})
