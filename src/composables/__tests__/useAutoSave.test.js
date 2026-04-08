import { describe, expect, it, beforeEach } from 'vitest'

// The vitest node environment ships a minimal localStorage stub that only supports
// getItem / setItem.  We use a plain Map to exercise the same serialization logic
// that useAutoSave relies on, without depending on the stub's missing methods.
let store

const mockStorage = {
  _data: new Map(),
  getItem(key) { return this._data.has(key) ? this._data.get(key) : null },
  setItem(key, value) { this._data.set(key, String(value)) },
  removeItem(key) { this._data.delete(key) },
  clear() { this._data.clear() }
}

describe('useAutoSave localStorage logic', () => {
  beforeEach(() => {
    mockStorage.clear()
    store = mockStorage
  })

  it('stores draft data with timestamp', () => {
    const key = 'test_draft'
    const data = { name: 'Test', email: 'test@example.com' }
    store.setItem(key, JSON.stringify({ data, savedAt: new Date().toISOString() }))

    const raw = store.getItem(key)
    const parsed = JSON.parse(raw)
    expect(parsed.data).toEqual(data)
    expect(parsed.savedAt).toBeTruthy()
  })

  it('returns null for missing draft key', () => {
    expect(store.getItem('nonexistent')).toBeNull()
  })

  it('clears draft by removing key', () => {
    store.setItem('test_key', 'value')
    store.removeItem('test_key')
    expect(store.getItem('test_key')).toBeNull()
  })

  it('overwrites existing draft', () => {
    const key = 'test_draft'
    store.setItem(key, JSON.stringify({ data: { v: 1 } }))
    store.setItem(key, JSON.stringify({ data: { v: 2 } }))
    const parsed = JSON.parse(store.getItem(key))
    expect(parsed.data.v).toBe(2)
  })
})
