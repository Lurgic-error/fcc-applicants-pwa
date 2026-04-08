const STORAGE_PREFIX = 'fcc_app_'

function setItem(key, value) {
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value))
  } catch {
    // Fallback for private browsing
  }
}

function getItem(key) {
  try {
    const item = sessionStorage.getItem(`${STORAGE_PREFIX}${key}`)
    return item ? JSON.parse(item) : null
  } catch {
    return null
  }
}

function removeItem(key) {
  try {
    sessionStorage.removeItem(`${STORAGE_PREFIX}${key}`)
  } catch {}
}

function clear() {
  try {
    Object.keys(sessionStorage)
      .filter(k => k.startsWith(STORAGE_PREFIX))
      .forEach(k => sessionStorage.removeItem(k))
  } catch {}
}

export { setItem, getItem, removeItem, clear }
