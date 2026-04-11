import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, watch } from 'vue'

const BASE_GRID_COLUMNS = 12

function isVisibleElement(el) {
  const style = window.getComputedStyle(el)
  return style.display !== 'none' && style.visibility !== 'hidden'
}

function isFullWidthElement(el) {
  if (el.classList.contains('col-span-full')) return true
  if (el.hasAttribute('full-width')) return true
  if (el.dataset.span === 'full') return true
  if (el.dataset.fullWidth === 'true') return true
  return Boolean(
    el.querySelector(
      'textarea, .el-textarea, .el-upload, .el-upload-dragger, [data-smart-full-width="true"]'
    )
  )
}

function resolveResponsiveMaxCols(width, maxCols) {
  if (width < 640) return 1
  if (width < 960) return Math.min(maxCols, 2)
  if (width < 1280) return Math.min(maxCols, 3)
  return Math.min(maxCols, 4)
}

function buildBalancedRowSizes(count, maxCols) {
  if (count <= 0) return []
  const rowCount = Math.max(1, Math.ceil(count / maxCols))
  const baseSize = Math.floor(count / rowCount)
  const remainder = count % rowCount

  return Array.from({ length: rowCount }, (_, index) =>
    baseSize + (index < remainder ? 1 : 0)
  ).filter(Boolean)
}

function clearPlacement(el) {
  el.style.gridColumn = ''
  el.style.gridRow = ''
}

export function useSmartFormGrid(gridRef, props) {
  const observer = ref(null)
  const resizeObserver = ref(null)
  const applyingLayout = ref(false)

  function recompute() {
    if (!gridRef.value || typeof window === 'undefined' || applyingLayout.value) return

    applyingLayout.value = true

    try {
      const children = Array.from(gridRef.value.children)
      children.forEach(clearPlacement)

      const visibleItems = children
        .filter(isVisibleElement)
        .map((el) => ({ el, fullWidth: isFullWidthElement(el) }))

      const effectiveMaxCols = resolveResponsiveMaxCols(
        gridRef.value.clientWidth || window.innerWidth || 0,
        props.maxCols
      )

      const rows = []
      let normalSegment = []

      function flushSegment() {
        if (!normalSegment.length) return
        const rowSizes = buildBalancedRowSizes(normalSegment.length, effectiveMaxCols)
        let offset = 0
        for (const size of rowSizes) {
          rows.push({
            type: 'normal',
            items: normalSegment.slice(offset, offset + size),
          })
          offset += size
        }
        normalSegment = []
      }

      for (const item of visibleItems) {
        if (item.fullWidth) {
          flushSegment()
          rows.push({ type: 'full', items: [item] })
          continue
        }
        normalSegment.push(item)
      }
      flushSegment()

      let rowIndex = 1
      for (const row of rows) {
        if (row.type === 'full') {
          const target = row.items[0]?.el
          if (target) {
            target.style.gridColumn = '1 / -1'
            target.style.gridRow = String(rowIndex)
          }
          rowIndex += 1
          continue
        }

        const itemCount = row.items.length
        const span = Math.floor(BASE_GRID_COLUMNS / itemCount)

        row.items.forEach(({ el }, itemIndex) => {
          const start = itemIndex * span + 1
          el.style.gridColumn = itemCount === 1 ? '1 / -1' : `${start} / span ${span}`
          el.style.gridRow = String(rowIndex)
        })

        rowIndex += 1
      }
    } finally {
      requestAnimationFrame(() => {
        applyingLayout.value = false
      })
    }
  }

  function scheduleRecompute() {
    nextTick(recompute)
  }

  onMounted(() => {
    scheduleRecompute()

    if (typeof MutationObserver !== 'undefined' && gridRef.value) {
      observer.value = new MutationObserver(() => {
        if (applyingLayout.value) return
        scheduleRecompute()
      })
      observer.value.observe(gridRef.value, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'hidden', 'data-span', 'data-full-width', 'full-width'],
      })
    }

    if (typeof ResizeObserver !== 'undefined' && gridRef.value) {
      resizeObserver.value = new ResizeObserver(scheduleRecompute)
      resizeObserver.value.observe(gridRef.value)
    } else if (typeof window !== 'undefined') {
      window.addEventListener('resize', scheduleRecompute)
    }
  })

  onUpdated(scheduleRecompute)

  watch(() => props.maxCols, scheduleRecompute)
  watch(() => props.gap, scheduleRecompute)

  onBeforeUnmount(() => {
    observer.value?.disconnect()
    resizeObserver.value?.disconnect()
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', scheduleRecompute)
    }
  })

  const gapPx = computed(() => ({ sm: 10, md: 16, lg: 20 }[props.gap]))

  const gridStyle = computed(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${BASE_GRID_COLUMNS}, minmax(0, 1fr))`,
    gap: `${gapPx.value}px`,
  }))

  return {
    gridStyle,
    recompute,
  }
}
