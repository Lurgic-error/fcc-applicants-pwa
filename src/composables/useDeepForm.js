import { reactive, toRaw } from 'vue'

/**
 * Deep path utilities for complex nested form state.
 * Used by the FCC-8 merger wizard and any future multi-section forms.
 *
 * @param {Object} initialState - deeply nested initial form state
 * @returns {{ form, get, set, toPlain }}
 */
export function useDeepForm(initialState) {
  const form = reactive(structuredClone(initialState))

  function get(path) {
    return path.split('.').reduce((cur, key) => {
      if (cur == null) return undefined
      return cur[isNaN(key) ? key : +key]
    }, form)
  }

  function set(path, value) {
    const parts = path.split('.')
    let cur = form
    for (let i = 0; i < parts.length - 1; i++) {
      const key = isNaN(parts[i]) ? parts[i] : +parts[i]
      if (cur[key] == null) cur[key] = isNaN(parts[i + 1]) ? {} : []
      cur = cur[key]
    }
    const lastKey = parts.at(-1)
    cur[isNaN(lastKey) ? lastKey : +lastKey] = value
  }

  function toPlain() {
    return JSON.parse(JSON.stringify(toRaw(form)))
  }

  function reset() {
    Object.assign(form, structuredClone(initialState))
  }

  return { form, get, set, toPlain, reset }
}
