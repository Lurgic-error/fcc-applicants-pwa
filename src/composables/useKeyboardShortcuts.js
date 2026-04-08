import { onMounted, onUnmounted } from 'vue'

export function useKeyboardShortcuts(shortcuts) {
  function handleKeydown(event) {
    for (const shortcut of shortcuts) {
      const ctrlOrMeta = shortcut.ctrl || shortcut.meta
      const ctrlPressed = event.ctrlKey || event.metaKey

      if (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        (!ctrlOrMeta || ctrlPressed)
      ) {
        const tag = event.target?.tagName?.toLowerCase()
        if (tag === 'input' || tag === 'textarea' || event.target?.isContentEditable) {
          if (shortcut.key.toLowerCase() === 's' && ctrlOrMeta) {
            event.preventDefault()
            shortcut.handler(event)
          }
          return
        }
        event.preventDefault()
        shortcut.handler(event)
      }
    }
  }

  onMounted(() => window.addEventListener('keydown', handleKeydown))
  onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
}
