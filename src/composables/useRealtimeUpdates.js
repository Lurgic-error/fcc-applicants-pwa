import { onUnmounted, ref } from 'vue'

export function useRealtimeUpdates() {
  const connected = ref(false)
  const lastEvent = ref(null)
  let eventSource = null
  let reconnectTimeout = null
  const listeners = new Map()

  const baseUrl = import.meta.env.VITE_APPLICANT_API_BASE_URL || 'http://localhost:5050/api/v1'
  const sseUrl = `${baseUrl}/events/stream`

  function connect(token) {
    if (eventSource) disconnect()
    try {
      eventSource = new EventSource(`${sseUrl}?token=${encodeURIComponent(token)}`)
      eventSource.onopen = () => { connected.value = true }
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          lastEvent.value = data
          const handlers = listeners.get(data.type) || []
          for (const handler of handlers) handler(data)
        } catch { /* ignore */ }
      }
      eventSource.onerror = () => {
        connected.value = false
        eventSource?.close()
        eventSource = null
        reconnectTimeout = setTimeout(() => connect(token), 5000)
      }
    } catch { connected.value = false }
  }

  function disconnect() {
    clearTimeout(reconnectTimeout)
    eventSource?.close()
    eventSource = null
    connected.value = false
  }

  function on(eventType, handler) {
    if (!listeners.has(eventType)) listeners.set(eventType, [])
    listeners.get(eventType).push(handler)
  }

  function off(eventType, handler) {
    const handlers = listeners.get(eventType)
    if (handlers) {
      const idx = handlers.indexOf(handler)
      if (idx > -1) handlers.splice(idx, 1)
    }
  }

  onUnmounted(() => disconnect())

  return { connected, lastEvent, connect, disconnect, on, off }
}
