/**
 * Generic CRUD operations for arrays within a deep reactive form.
 *
 * @param {Function} getFn - get(path) from useDeepForm
 * @param {Function} setFn - set(path, value) from useDeepForm
 * @param {string} path - dot-separated path to the array
 * @param {Function} factory - returns a new default item
 */
export function useArrayCrud(getFn, setFn, path, factory) {
  function items() {
    return getFn(path) || []
  }

  function add() {
    const arr = [...items(), factory()]
    setFn(path, arr)
  }

  function remove(index) {
    const arr = items().filter((_, i) => i !== index)
    setFn(path, arr)
  }

  function update(index, key, value) {
    const item = items()[index]
    if (!item) return
    setFn(`${path}.${index}.${key}`, value)
  }

  return { items, add, remove, update }
}
