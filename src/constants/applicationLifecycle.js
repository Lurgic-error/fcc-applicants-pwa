import lifecycle from '../../../shared/applicationLifecycle.json'

export const APPLICATION_STATUSES = Object.freeze([...(lifecycle.applicationStatuses || [])])

const aliasLookup = new Map()

function normalizeKey(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
}

for (const [legacy, canonical] of Object.entries(lifecycle.legacyStatusAliases || {})) {
  aliasLookup.set(normalizeKey(legacy), canonical)
  aliasLookup.set(normalizeKey(canonical), canonical)
}

for (const status of APPLICATION_STATUSES) {
  aliasLookup.set(normalizeKey(status), status)
}

export function normalizeApplicationStatus(value, fallback = APPLICATION_STATUSES[0] || 'Draft') {
  if (!value) return fallback
  return aliasLookup.get(normalizeKey(value)) || fallback
}

export function formatApplicationStatus(value, fallback = APPLICATION_STATUSES[0] || 'Draft') {
  return normalizeApplicationStatus(value, fallback)
}
