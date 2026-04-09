import { onMounted, onBeforeUnmount, ref } from 'vue'

/**
 * IntersectionObserver-based scroll reveal.
 * Adds `data-visible="true"` to elements with `data-reveal` when they enter viewport.
 *
 * Usage:
 *   const { containerRef } = useScrollReveal()
 *   <div ref="containerRef">
 *     <div data-reveal>I fade in</div>
 *     <div data-reveal="slide-up">I slide up</div>
 *     <div data-reveal="slide-left">I slide from left</div>
 *     <div data-reveal data-delay="200">I delay 200ms</div>
 *   </div>
 */
export function useScrollReveal(options = {}) {
  const containerRef = ref(null)
  let observer = null

  const { threshold = 0.15, rootMargin = '0px 0px -40px 0px' } = options

  onMounted(() => {
    if (!containerRef.value) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = parseInt(entry.target.dataset.delay || '0', 10)
            if (delay > 0) {
              setTimeout(() => { entry.target.dataset.visible = 'true' }, delay)
            } else {
              entry.target.dataset.visible = 'true'
            }
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold, rootMargin }
    )

    const elements = containerRef.value.querySelectorAll('[data-reveal]')
    elements.forEach((el) => observer.observe(el))
  })

  onBeforeUnmount(() => {
    if (observer) observer.disconnect()
  })

  return { containerRef }
}
