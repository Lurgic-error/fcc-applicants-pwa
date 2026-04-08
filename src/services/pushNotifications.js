const PUSH_ENABLED_KEY = 'fcc_push_notifications_enabled'
const VAPID_KEY_STORAGE = 'fcc_vapid_public_key'

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function getPushPermission() {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestPushPermission() {
  if (!isPushSupported()) return 'unsupported'
  return await Notification.requestPermission()
}

export async function subscribeToPush() {
  if (!isPushSupported()) return null
  const permission = await requestPushPermission()
  if (permission !== 'granted') return null
  try {
    const registration = await navigator.serviceWorker.ready
    const vapidKey = localStorage.getItem(VAPID_KEY_STORAGE) || ''
    if (!vapidKey) {
      console.warn('[Push] No VAPID key configured')
      localStorage.setItem(PUSH_ENABLED_KEY, 'true')
      return { placeholder: true }
    }
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey)
    })
    localStorage.setItem(PUSH_ENABLED_KEY, 'true')
    return subscription
  } catch (error) {
    console.error('[Push] Subscription failed:', error)
    return null
  }
}

export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) await subscription.unsubscribe()
    localStorage.setItem(PUSH_ENABLED_KEY, 'false')
  } catch (error) {
    console.error('[Push] Unsubscribe failed:', error)
  }
}

export function isPushEnabled() {
  return localStorage.getItem(PUSH_ENABLED_KEY) === 'true'
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
