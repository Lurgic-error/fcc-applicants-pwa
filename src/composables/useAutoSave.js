import { ref, onMounted, onUnmounted } from 'vue'

const STORAGE_PREFIX = 'fcc_draft_'
const SYNC_DEBOUNCE_MS = 5000 // Sync to server every 5s after changes

export function useAutoSave(key, formData, { interval = 30000, onRestore } = {}) {
  const lastSavedAt = ref(null)
  const syncStatus = ref('idle') // idle | saving | synced | error
  const hasDraft = ref(false)
  let saveTimer = null
  let syncTimer = null

  const storageKey = `${STORAGE_PREFIX}${key}`

  // --- Local storage (fast) ---
  function saveLocal() {
    try {
      const payload = JSON.stringify({
        data: typeof formData.value === 'object' ? { ...formData.value } : formData.value,
        savedAt: new Date().toISOString(),
        key,
      })
      localStorage.setItem(storageKey, payload)
      lastSavedAt.value = new Date()
      hasDraft.value = true
    } catch (err) {
      console.warn('[AutoSave] Local save failed:', err?.message)
    }
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return null
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  // --- Server sync (durable) ---
  async function syncToServer() {
    try {
      syncStatus.value = 'saving'
      const { default: http } = await import('@/services/http')
      await http.put(`/api/v1/applications/drafts/${encodeURIComponent(key)}`, {
        formData: typeof formData.value === 'object' ? { ...formData.value } : formData.value,
        savedAt: new Date().toISOString(),
      })
      syncStatus.value = 'synced'
    } catch (err) {
      syncStatus.value = 'error'
      console.warn('[AutoSave] Server sync failed (will retry):', err?.message)
    }
  }

  async function loadFromServer() {
    try {
      const { default: http } = await import('@/services/http')
      const { data } = await http.get(`/api/v1/applications/drafts/${encodeURIComponent(key)}`)
      return data?.draft || null
    } catch {
      return null
    }
  }

  // --- Restore logic ---
  async function restore() {
    // Try server first (cross-device support)
    const serverDraft = await loadFromServer()
    const localDraft = loadLocal()

    let best = null
    if (serverDraft && localDraft) {
      // Use whichever is newer
      const serverTime = new Date(serverDraft.savedAt || 0).getTime()
      const localTime = new Date(localDraft.savedAt || 0).getTime()
      best = serverTime > localTime ? serverDraft : localDraft
    } else {
      best = serverDraft || localDraft
    }

    if (best?.data) {
      hasDraft.value = true
      if (onRestore) {
        onRestore(best.data)
      } else if (formData.value && typeof formData.value === 'object') {
        Object.assign(formData.value, best.data)
      }
      lastSavedAt.value = best.savedAt ? new Date(best.savedAt) : null
      return true
    }
    return false
  }

  // --- Save with debounced sync ---
  function save() {
    saveLocal()
    // Debounce server sync
    if (syncTimer) clearTimeout(syncTimer)
    syncTimer = setTimeout(syncToServer, SYNC_DEBOUNCE_MS)
  }

  // --- Clear draft ---
  async function clearDraft() {
    try {
      localStorage.removeItem(storageKey)
      hasDraft.value = false
      lastSavedAt.value = null
      syncStatus.value = 'idle'
      // Also clear server draft
      const { default: http } = await import('@/services/http')
      await http.delete(`/api/v1/applications/drafts/${encodeURIComponent(key)}`).catch(() => {})
    } catch {}
  }

  // --- Auto-save interval ---
  onMounted(() => {
    saveTimer = setInterval(save, interval)
  })

  onUnmounted(() => {
    if (saveTimer) clearInterval(saveTimer)
    if (syncTimer) clearTimeout(syncTimer)
  })

  return {
    lastSavedAt,
    syncStatus,
    hasDraft,
    save,
    restore,
    clearDraft,
  }
}
