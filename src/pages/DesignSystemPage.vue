<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const activeSection = ref('colors')

/* ── Interactive Controls ── */
const baseRadius = ref(4)
const baseFontSize = ref(14)
const spacingMultiplier = ref(1)
const primaryHue = ref(216)
const panelRadius = ref(10)
const cardRadius = ref(8)

function applyOverrides() {
  const root = document.documentElement
  root.style.setProperty('--fcc-radius-base', `${baseRadius.value}px`)
  root.style.setProperty('--fcc-radius-sm', `${Math.max(1, baseRadius.value - 4)}px`)
  root.style.setProperty('--fcc-radius-md', `${Math.max(2, baseRadius.value - 2)}px`)
  root.style.setProperty('--fcc-radius-lg', `${baseRadius.value + 2}px`)
  root.style.setProperty('--fcc-radius-xl', `${baseRadius.value + 4}px`)
  root.style.setProperty('--fcc-radius-2xl', `${baseRadius.value + 6}px`)
  root.style.setProperty('--fcc-radius-panel', `${panelRadius.value}px`)
  root.style.setProperty('--fcc-radius-card', `${cardRadius.value}px`)
  root.style.setProperty('--el-border-radius-base', `${baseRadius.value}px`)
  root.style.setProperty('--el-border-radius-small', `${Math.max(1, baseRadius.value - 4)}px`)
  root.style.setProperty('--fcc-text-base', `${baseFontSize.value / 16}rem`)
  root.style.setProperty('--fcc-text-sm', `${(baseFontSize.value - 1) / 16}rem`)
  root.style.setProperty('--fcc-text-xs', `${(baseFontSize.value - 2) / 16}rem`)
  root.style.setProperty('--fcc-text-lg', `${(baseFontSize.value + 2) / 16}rem`)
  root.style.setProperty('--fcc-text-xl', `${(baseFontSize.value + 4) / 16}rem`)

  const m = spacingMultiplier.value
  root.style.setProperty('--fcc-space-1', `${0.25 * m}rem`)
  root.style.setProperty('--fcc-space-2', `${0.5 * m}rem`)
  root.style.setProperty('--fcc-space-3', `${0.75 * m}rem`)
  root.style.setProperty('--fcc-space-4', `${1 * m}rem`)
  root.style.setProperty('--fcc-space-6', `${1.5 * m}rem`)
  root.style.setProperty('--fcc-space-8', `${2 * m}rem`)
  root.style.setProperty('--fcc-space-10', `${2.5 * m}rem`)
  root.style.setProperty('--fcc-space-12', `${3 * m}rem`)
}

function resetOverrides() {
  baseRadius.value = 4
  baseFontSize.value = 14
  spacingMultiplier.value = 1
  primaryHue.value = 216
  panelRadius.value = 10
  cardRadius.value = 8

  const root = document.documentElement
  const tokens = [
    '--fcc-radius-base', '--fcc-radius-sm', '--fcc-radius-md', '--fcc-radius-lg',
    '--fcc-radius-xl', '--fcc-radius-2xl', '--fcc-radius-panel', '--fcc-radius-card',
    '--el-border-radius-base', '--el-border-radius-small',
    '--fcc-text-base', '--fcc-text-sm', '--fcc-text-xs', '--fcc-text-lg', '--fcc-text-xl',
    '--fcc-space-1', '--fcc-space-2', '--fcc-space-3', '--fcc-space-4',
    '--fcc-space-6', '--fcc-space-8', '--fcc-space-10', '--fcc-space-12',
  ]
  tokens.forEach(t => root.style.removeProperty(t))
}

watch([baseRadius, baseFontSize, spacingMultiplier, panelRadius, cardRadius], applyOverrides)

const cssExport = computed(() => {
  return `:root {
  --fcc-radius-base: ${baseRadius.value}px;
  --fcc-radius-panel: ${panelRadius.value}px;
  --fcc-radius-card: ${cardRadius.value}px;
  --fcc-text-base: ${baseFontSize.value / 16}rem;
  /* spacing multiplier: ${spacingMultiplier.value}x */
}`
})
const showExport = ref(false)

const sections = [
  { id: 'colors', label: 'Colors' },
  { id: 'typography', label: 'Typography' },
  { id: 'spacing', label: 'Spacing' },
  { id: 'radius', label: 'Radius' },
  { id: 'shadows', label: 'Shadows' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'inputs', label: 'Form Inputs' },
  { id: 'badges', label: 'Status Badges' },
  { id: 'descriptions', label: 'Descriptions' },
  { id: 'tables', label: 'Tables' },
  { id: 'cards', label: 'Cards' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'charts', label: 'Charts' },
  { id: 'pages', label: 'Page Samples' },
  { id: 'settings', label: 'Settings Page' },
]

const primarySwatches = [
  { token: '--fcc-primary-50', label: '50' },
  { token: '--fcc-primary-100', label: '100' },
  { token: '--fcc-primary-200', label: '200' },
  { token: '--fcc-primary-300', label: '300' },
  { token: '--fcc-primary-400', label: '400' },
  { token: '--fcc-primary-500', label: '500' },
  { token: '--fcc-primary-600', label: '600' },
  { token: '--fcc-primary-700', label: '700' },
  { token: '--fcc-primary-800', label: '800' },
  { token: '--fcc-primary-900', label: '900 (brand)' },
  { token: '--fcc-primary-950', label: '950' },
]

const secondarySwatches = [
  { token: '--fcc-secondary-50', label: '50' },
  { token: '--fcc-secondary-100', label: '100' },
  { token: '--fcc-secondary-200', label: '200' },
  { token: '--fcc-secondary-300', label: '300' },
  { token: '--fcc-secondary-400', label: '400' },
  { token: '--fcc-secondary-500', label: '500 (accent)' },
  { token: '--fcc-secondary-600', label: '600' },
  { token: '--fcc-secondary-700', label: '700' },
  { token: '--fcc-secondary-800', label: '800' },
  { token: '--fcc-secondary-900', label: '900' },
  { token: '--fcc-secondary-950', label: '950' },
]

const semanticColors = [
  { token: '--fcc-success', bg: '--fcc-success-light', border: '--fcc-success-border', text: '--fcc-success-text', label: 'Success' },
  { token: '--fcc-warning', bg: '--fcc-warning-light', border: '--fcc-warning-border', text: '--fcc-warning-text', label: 'Warning' },
  { token: '--fcc-danger', bg: '--fcc-danger-light', border: '--fcc-danger-border', text: '--fcc-danger-text', label: 'Danger' },
  { token: '--fcc-info', bg: '--fcc-info-light', border: '--fcc-info-border', text: '--fcc-info-text', label: 'Info' },
]

const surfaceTokens = [
  { token: '--fcc-bg-app', label: 'App Background' },
  { token: '--fcc-bg-surface', label: 'Surface' },
  { token: '--fcc-bg-surface-muted', label: 'Surface Muted' },
  { token: '--fcc-bg-elevated', label: 'Elevated' },
]

const textTokens = [
  { token: '--fcc-text-primary', label: 'Primary' },
  { token: '--fcc-text-secondary', label: 'Secondary' },
  { token: '--fcc-text-muted', label: 'Muted' },
  { token: '--fcc-text-disabled', label: 'Disabled' },
]

const borderTokens = [
  { token: '--fcc-border', label: 'Default' },
  { token: '--fcc-border-light', label: 'Light' },
  { token: '--fcc-border-strong', label: 'Strong' },
]

const spacingScale = [
  { token: '--fcc-space-1', label: '1 (4px)' },
  { token: '--fcc-space-2', label: '2 (8px)' },
  { token: '--fcc-space-3', label: '3 (12px)' },
  { token: '--fcc-space-4', label: '4 (16px)' },
  { token: '--fcc-space-5', label: '5 (20px)' },
  { token: '--fcc-space-6', label: '6 (24px)' },
  { token: '--fcc-space-8', label: '8 (32px)' },
  { token: '--fcc-space-10', label: '10 (40px)' },
  { token: '--fcc-space-12', label: '12 (48px)' },
]

const radiusScale = [
  { token: '--fcc-radius-xs', label: 'xs (2px)' },
  { token: '--fcc-radius-sm', label: 'sm (4px)' },
  { token: '--fcc-radius-md', label: 'md (6px)' },
  { token: '--fcc-radius-base', label: 'base (8px)' },
  { token: '--fcc-radius-lg', label: 'lg (10px)' },
  { token: '--fcc-radius-xl', label: 'xl (12px)' },
  { token: '--fcc-radius-2xl', label: '2xl (14px)' },
  { token: '--fcc-radius-pill', label: 'pill' },
]

const shadowScale = [
  { token: '--fcc-shadow-xs', label: 'xs' },
  { token: '--fcc-shadow-sm', label: 'sm' },
  { token: '--fcc-shadow-md', label: 'md' },
  { token: '--fcc-shadow-lg', label: 'lg' },
  { token: '--fcc-shadow-card', label: 'card' },
  { token: '--fcc-shadow-panel', label: 'panel' },
]

const statusList = ['draft', 'submitted', 'under_review', 'pending_payment', 'approved', 'rejected', 'completed', 'cancelled']

const sampleInput = ref('')
const sampleSelect = ref('')
const sampleDate = ref(null)
const sampleTextarea = ref('')
const sampleSwitch = ref(false)
const sampleCheckbox = ref(false)
const sampleRadio = ref('a')

function getVar(token) {
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim()
}

/* ── Interactive Radius Preview ── */
const previewRadius = ref(8)

/* ── Table Data ── */
const tableSearch = ref('')
const tableFilterVisible = ref(false)
const tableStatusFilter = ref('')
const tableSortProp = ref('')
const tableSortOrder = ref('')

const tableRawData = [
  { ref: 'FCC-TR-2026-0142', applicant: 'Tanzania Breweries Ltd', type: 'Trademark', status: 'approved', date: '2026-04-08', fee: 150000 },
  { ref: 'FCC-MR-2026-0038', applicant: 'Vodacom Tanzania PLC', type: 'Merger (FCC-8)', status: 'under_review', date: '2026-04-05', fee: 500000 },
  { ref: 'FCC-EX-2026-0067', applicant: 'CRDB Bank PLC', type: 'Exemption', status: 'pending_payment', date: '2026-04-03', fee: 200000 },
  { ref: 'FCC-TR-2026-0139', applicant: 'TBL Plastics Ltd', type: 'Trademark', status: 'draft', date: '2026-03-28', fee: 150000 },
  { ref: 'FCC-TR-2026-0135', applicant: 'Serengeti Breweries', type: 'Trademark', status: 'approved', date: '2026-03-25', fee: 150000 },
  { ref: 'FCC-MR-2026-0036', applicant: 'Airtel Tanzania', type: 'Merger (FCC-8)', status: 'rejected', date: '2026-03-20', fee: 500000 },
  { ref: 'FCC-SF-2026-0012', applicant: 'Bakhresa Group', type: 'SFCC', status: 'completed', date: '2026-03-15', fee: 100000 },
  { ref: 'FCC-TR-2026-0128', applicant: 'Tanga Cement PLC', type: 'Trademark', status: 'submitted', date: '2026-03-12', fee: 150000 },
]

const filteredTableData = computed(() => {
  let data = [...tableRawData]
  if (tableSearch.value) {
    const q = tableSearch.value.toLowerCase()
    data = data.filter(r => r.ref.toLowerCase().includes(q) || r.applicant.toLowerCase().includes(q) || r.type.toLowerCase().includes(q))
  }
  if (tableStatusFilter.value) {
    data = data.filter(r => r.status === tableStatusFilter.value)
  }
  if (tableSortProp.value) {
    data.sort((a, b) => {
      const va = a[tableSortProp.value]
      const vb = b[tableSortProp.value]
      const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb))
      return tableSortOrder.value === 'descending' ? -cmp : cmp
    })
  }
  return data
})

function handleTableSort({ prop, order }) {
  tableSortProp.value = prop || ''
  tableSortOrder.value = order || ''
}

function clearTableFilters() {
  tableSearch.value = ''
  tableStatusFilter.value = ''
}

function formatTZS(v) {
  return 'TZS ' + Number(v).toLocaleString()
}

/* ── Chart Data ── */
const barChartData = [
  { label: 'Trademarks', value: 142, color: 'var(--fcc-primary-700)' },
  { label: 'Mergers', value: 38, color: 'var(--fcc-secondary-500)' },
  { label: 'Exemptions', value: 67, color: 'var(--fcc-success)' },
  { label: 'SFCCs', value: 23, color: 'var(--fcc-warning)' },
  { label: 'Complaints', value: 51, color: 'var(--fcc-danger)' },
]
const barMax = computed(() => Math.max(...barChartData.map(d => d.value)))

const donutSegments = [
  { label: 'Approved', value: 48, color: 'var(--fcc-success)' },
  { label: 'Pending', value: 27, color: 'var(--fcc-warning)' },
  { label: 'Rejected', value: 12, color: 'var(--fcc-danger)' },
  { label: 'Draft', value: 13, color: 'var(--fcc-text-disabled)' },
]
const donutTotal = computed(() => donutSegments.reduce((s, d) => s + d.value, 0))

function donutPath(segments, idx, radius = 40, cx = 50, cy = 50) {
  const total = segments.reduce((s, d) => s + d.value, 0)
  let startAngle = -90
  for (let i = 0; i < idx; i++) {
    startAngle += (segments[i].value / total) * 360
  }
  const angle = (segments[idx].value / total) * 360
  const endAngle = startAngle + angle
  const largeArc = angle > 180 ? 1 : 0
  const toRad = a => (a * Math.PI) / 180
  const x1 = cx + radius * Math.cos(toRad(startAngle))
  const y1 = cy + radius * Math.sin(toRad(startAngle))
  const x2 = cx + radius * Math.cos(toRad(endAngle))
  const y2 = cy + radius * Math.sin(toRad(endAngle))
  return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

const sparklinePoints = [12, 19, 8, 24, 18, 31, 27, 35, 22, 40, 38, 45]
const sparklinePath = computed(() => {
  const max = Math.max(...sparklinePoints)
  const w = 200
  const h = 50
  const step = w / (sparklinePoints.length - 1)
  return sparklinePoints.map((v, i) => {
    const x = i * step
    const y = h - (v / max) * h
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
})

const circularMetrics = [
  { label: 'Completion', value: 78, color: 'var(--fcc-success)' },
  { label: 'On-Time Rate', value: 92, color: 'var(--fcc-primary-600)' },
  { label: 'Satisfaction', value: 64, color: 'var(--fcc-warning)' },
  { label: 'Error Rate', value: 15, color: 'var(--fcc-danger)' },
]

function circleOffset(pct, r = 36) {
  const c = 2 * Math.PI * r
  return c - (pct / 100) * c
}

const monthlyTrend = [
  { month: 'Jan', apps: 32, approved: 28 },
  { month: 'Feb', apps: 41, approved: 35 },
  { month: 'Mar', apps: 28, approved: 22 },
  { month: 'Apr', apps: 55, approved: 47 },
  { month: 'May', apps: 48, approved: 39 },
  { month: 'Jun', apps: 62, approved: 55 },
]
const trendMax = computed(() => Math.max(...monthlyTrend.map(d => Math.max(d.apps, d.approved))))

function scrollTo(id) {
  activeSection.value = id
  document.getElementById(`ds-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="ds">
    <!-- Sidebar nav (fixed) -->
    <nav class="ds__nav">
      <div class="ds__nav-header">
        <h2 class="ds__nav-title">FCC Design System</h2>
        <p class="ds__nav-sub">Applicants Portal</p>
      </div>

      <div class="ds__nav-scroll">
        <ul class="ds__nav-list">
          <li v-for="s in sections" :key="s.id">
            <button
              class="ds__nav-link"
              :class="{ 'ds__nav-link--active': activeSection === s.id }"
              @click="scrollTo(s.id)"
            >
              {{ s.label }}
            </button>
          </li>
        </ul>

        <!-- Interactive controls -->
        <div class="ds__controls">
          <h4 class="ds__controls-title">Live Controls</h4>

          <label class="ds__control">
            <span class="ds__control-label">Base Radius <code>{{ baseRadius }}px</code></span>
            <input type="range" v-model.number="baseRadius" min="0" max="24" step="1" class="ds__slider" />
          </label>

          <label class="ds__control">
            <span class="ds__control-label">Panel Radius <code>{{ panelRadius }}px</code></span>
            <input type="range" v-model.number="panelRadius" min="0" max="28" step="1" class="ds__slider" />
          </label>

          <label class="ds__control">
            <span class="ds__control-label">Card Radius <code>{{ cardRadius }}px</code></span>
            <input type="range" v-model.number="cardRadius" min="0" max="24" step="1" class="ds__slider" />
          </label>

          <label class="ds__control">
            <span class="ds__control-label">Font Size <code>{{ baseFontSize }}px</code></span>
            <input type="range" v-model.number="baseFontSize" min="11" max="18" step="0.5" class="ds__slider" />
          </label>

          <label class="ds__control">
            <span class="ds__control-label">Spacing <code>{{ spacingMultiplier }}x</code></span>
            <input type="range" v-model.number="spacingMultiplier" min="0.5" max="2" step="0.1" class="ds__slider" />
          </label>

          <div class="ds__control-actions">
            <button class="ds__control-btn" @click="resetOverrides">Reset All</button>
            <button class="ds__control-btn ds__control-btn--accent" @click="showExport = !showExport">
              {{ showExport ? 'Hide' : 'Export' }} CSS
            </button>
          </div>

          <pre v-if="showExport" class="ds__export">{{ cssExport }}</pre>
        </div>
      </div>

      <div class="ds__nav-footer">
        <ThemeSwitcher />
      </div>
    </nav>

    <!-- Main content -->
    <main class="ds__main">
      <div class="ds__header">
        <h1 class="ds__title">FCC Applicants Portal Design System</h1>
        <p class="ds__subtitle">
          Living reference for colors, typography, spacing, components, and patterns.
          Toggle dark mode with the switcher in the sidebar.
        </p>
      </div>

      <!-- ─── COLORS ─── -->
      <section id="ds-colors" class="ds__section">
        <h2 class="ds__section-title">Colors</h2>

        <h3 class="ds__group-title">Primary (Institutional Navy)</h3>
        <div class="ds__swatch-row">
          <div v-for="s in primarySwatches" :key="s.token" class="ds__swatch">
            <div class="ds__swatch-box" :style="{ background: `var(${s.token})` }" />
            <span class="ds__swatch-label">{{ s.label }}</span>
            <code class="ds__swatch-token">{{ s.token }}</code>
          </div>
        </div>

        <h3 class="ds__group-title">Secondary (Vivid Cyan)</h3>
        <div class="ds__swatch-row">
          <div v-for="s in secondarySwatches" :key="s.token" class="ds__swatch">
            <div class="ds__swatch-box" :style="{ background: `var(${s.token})` }" />
            <span class="ds__swatch-label">{{ s.label }}</span>
            <code class="ds__swatch-token">{{ s.token }}</code>
          </div>
        </div>

        <h3 class="ds__group-title">Semantic Status</h3>
        <div class="ds__semantic-row">
          <div v-for="c in semanticColors" :key="c.label" class="ds__semantic-card" :style="{
            background: `var(${c.bg})`,
            borderColor: `var(${c.border})`,
            color: `var(${c.text})`
          }">
            <div class="ds__semantic-dot" :style="{ background: `var(${c.token})` }" />
            <div>
              <strong>{{ c.label }}</strong>
              <code class="ds__code-sm">{{ c.token }}</code>
            </div>
          </div>
        </div>

        <h3 class="ds__group-title">Surfaces</h3>
        <div class="ds__surface-row">
          <div v-for="s in surfaceTokens" :key="s.token" class="ds__surface-box" :style="{ background: `var(${s.token})` }">
            <span>{{ s.label }}</span>
            <code class="ds__code-sm">{{ s.token }}</code>
          </div>
        </div>

        <h3 class="ds__group-title">Text</h3>
        <div class="ds__text-samples">
          <p v-for="t in textTokens" :key="t.token" :style="{ color: `var(${t.token})` }">
            {{ t.label }} text &mdash; <code class="ds__code-sm">{{ t.token }}</code>
          </p>
        </div>

        <h3 class="ds__group-title">Borders</h3>
        <div class="ds__border-row">
          <div v-for="b in borderTokens" :key="b.token" class="ds__border-sample" :style="{ borderColor: `var(${b.token})` }">
            {{ b.label }}
            <code class="ds__code-sm">{{ b.token }}</code>
          </div>
        </div>
      </section>

      <!-- ─── TYPOGRAPHY ─── -->
      <section id="ds-typography" class="ds__section">
        <h2 class="ds__section-title">Typography</h2>

        <h3 class="ds__group-title">Font Families</h3>
        <div class="ds__type-families">
          <div class="ds__type-family">
            <p class="ds__type-sample" style="font-family: var(--fcc-font-heading); font-weight: 700; font-size: 1.5rem">
              Outfit (Headings)
            </p>
            <code class="ds__code-sm">--fcc-font-heading</code>
          </div>
          <div class="ds__type-family">
            <p class="ds__type-sample" style="font-family: var(--fcc-font-body); font-size: 1rem">
              Manrope (Body text) &mdash; The quick brown fox jumps over the lazy dog
            </p>
            <code class="ds__code-sm">--fcc-font-body</code>
          </div>
          <div class="ds__type-family">
            <p class="ds__type-sample" style="font-family: var(--fcc-font-mono); font-size: 0.875rem">
              JetBrains Mono &mdash; const token = "fcc-123"
            </p>
            <code class="ds__code-sm">--fcc-font-mono</code>
          </div>
        </div>

        <h3 class="ds__group-title">Type Scale</h3>
        <div class="ds__type-scale">
          <div class="ds__type-row">
            <span class="ds__type-label">3xl (28px)</span>
            <span class="ds__type-preview" style="font-family: var(--fcc-font-heading); font-size: var(--fcc-text-3xl); font-weight: 700">Page Title</span>
          </div>
          <div class="ds__type-row">
            <span class="ds__type-label">2xl (22px)</span>
            <span class="ds__type-preview" style="font-family: var(--fcc-font-heading); font-size: var(--fcc-text-2xl); font-weight: 600">Section Heading</span>
          </div>
          <div class="ds__type-row">
            <span class="ds__type-label">xl (18px)</span>
            <span class="ds__type-preview" style="font-family: var(--fcc-font-heading); font-size: var(--fcc-text-xl); font-weight: 600">Card Title</span>
          </div>
          <div class="ds__type-row">
            <span class="ds__type-label">lg (16px)</span>
            <span class="ds__type-preview" style="font-size: var(--fcc-text-lg); font-weight: 600">Subtitle / Label</span>
          </div>
          <div class="ds__type-row">
            <span class="ds__type-label">base (14px)</span>
            <span class="ds__type-preview" style="font-size: var(--fcc-text-base)">Body text for content and descriptions</span>
          </div>
          <div class="ds__type-row">
            <span class="ds__type-label">sm (13px)</span>
            <span class="ds__type-preview" style="font-size: var(--fcc-text-sm); color: var(--fcc-text-secondary)">Secondary text, table cells, metadata</span>
          </div>
          <div class="ds__type-row">
            <span class="ds__type-label">xs (12px)</span>
            <span class="ds__type-preview" style="font-size: var(--fcc-text-xs); color: var(--fcc-text-muted)">Captions, timestamps, micro labels</span>
          </div>
        </div>

        <h3 class="ds__group-title">Font Weights</h3>
        <div class="ds__type-scale">
          <div v-for="w in [400, 500, 600, 700, 800]" :key="w" class="ds__type-row">
            <span class="ds__type-label">{{ w }}</span>
            <span class="ds__type-preview" :style="{ fontWeight: w, fontSize: '1rem' }">
              {{ w === 400 ? 'Regular' : w === 500 ? 'Medium' : w === 600 ? 'SemiBold' : w === 700 ? 'Bold' : 'ExtraBold' }}
              &mdash; The quick brown fox
            </span>
          </div>
        </div>
      </section>

      <!-- ─── SPACING ─── -->
      <section id="ds-spacing" class="ds__section">
        <h2 class="ds__section-title">Spacing Scale</h2>
        <div class="ds__spacing-grid">
          <div v-for="s in spacingScale" :key="s.token" class="ds__spacing-item">
            <div class="ds__spacing-bar" :style="{ width: `var(${s.token})`, height: `var(${s.token})` }" />
            <div class="ds__spacing-info">
              <span class="ds__spacing-label">{{ s.label }}</span>
              <code class="ds__code-sm">{{ s.token }}</code>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── RADIUS ─── -->
      <section id="ds-radius" class="ds__section">
        <h2 class="ds__section-title">Border Radius</h2>

        <!-- Token scale -->
        <div class="ds__radius-grid">
          <div v-for="r in radiusScale" :key="r.token" class="ds__radius-item">
            <div class="ds__radius-box" :style="{ borderRadius: `var(${r.token})` }" />
            <span class="ds__radius-label">{{ r.label }}</span>
            <code class="ds__code-sm">{{ r.token }}</code>
          </div>
        </div>

        <!-- Interactive playground -->
        <h3 class="ds__group-title">Interactive Radius Playground</h3>
        <div class="ds__radius-playground">
          <div class="ds__radius-control-bar">
            <label class="ds__radius-slider-label">
              <span>Radius</span>
              <input type="range" v-model.number="previewRadius" min="0" max="40" step="1" class="ds__slider" />
              <code class="ds__radius-value">{{ previewRadius }}px</code>
            </label>
            <div class="ds__radius-presets">
              <button v-for="p in [0, 4, 8, 12, 16, 20, 28, 9999]" :key="p"
                class="ds__radius-preset" :class="{ 'ds__radius-preset--active': previewRadius === p }"
                @click="previewRadius = p">
                {{ p === 9999 ? 'Pill' : p + 'px' }}
              </button>
            </div>
          </div>
          <div class="ds__radius-preview-grid">
            <div class="ds__radius-preview-card" :style="{ borderRadius: previewRadius + 'px' }">
              <div class="ds__radius-preview-header" :style="{ borderRadius: previewRadius + 'px ' + previewRadius + 'px 0 0' }">Card Header</div>
              <div class="ds__radius-preview-body">Content area with <code>{{ previewRadius }}px</code> radius</div>
            </div>
            <el-button type="primary" :style="{ borderRadius: previewRadius + 'px' }">Button Preview</el-button>
            <el-input placeholder="Input preview" :style="{ '--el-border-radius-base': previewRadius + 'px' }" />
            <el-tag :style="{ borderRadius: previewRadius + 'px' }">Tag Preview</el-tag>
            <div class="ds__radius-preview-avatar" :style="{ borderRadius: previewRadius + 'px' }">AV</div>
            <div class="ds__radius-preview-chip" :style="{ borderRadius: previewRadius + 'px' }">Status Chip</div>
          </div>
        </div>
      </section>

      <!-- ─── SHADOWS ─── -->
      <section id="ds-shadows" class="ds__section">
        <h2 class="ds__section-title">Shadows</h2>
        <div class="ds__shadow-grid">
          <div v-for="s in shadowScale" :key="s.token" class="ds__shadow-box" :style="{ boxShadow: `var(${s.token})` }">
            <strong>{{ s.label }}</strong>
            <code class="ds__code-sm">{{ s.token }}</code>
          </div>
        </div>
      </section>

      <!-- ─── BUTTONS ─── -->
      <section id="ds-buttons" class="ds__section">
        <h2 class="ds__section-title">Buttons</h2>

        <h3 class="ds__group-title">Primary Actions</h3>
        <div class="ds__button-row">
          <el-button type="primary">Submit Application</el-button>
          <el-button type="primary" :loading="true">Processing...</el-button>
          <el-button type="primary" disabled>Disabled</el-button>
        </div>

        <h3 class="ds__group-title">Secondary / Plain</h3>
        <div class="ds__button-row">
          <el-button>Default</el-button>
          <el-button plain>Plain</el-button>
          <el-button type="info" plain>Info</el-button>
        </div>

        <h3 class="ds__group-title">Status Actions</h3>
        <div class="ds__button-row">
          <el-button type="success">Approve</el-button>
          <el-button type="warning">Request Changes</el-button>
          <el-button type="danger">Reject</el-button>
        </div>

        <h3 class="ds__group-title">Sizes</h3>
        <div class="ds__button-row">
          <el-button type="primary" size="large">Large</el-button>
          <el-button type="primary">Default</el-button>
          <el-button type="primary" size="small">Small</el-button>
        </div>

        <h3 class="ds__group-title">Link & Text</h3>
        <div class="ds__button-row">
          <el-button type="primary" link>Link Button</el-button>
          <el-button type="primary" text>Text Button</el-button>
          <el-button type="danger" link>Delete</el-button>
        </div>
      </section>

      <!-- ─── FORM INPUTS ─── -->
      <section id="ds-inputs" class="ds__section">
        <h2 class="ds__section-title">Form Inputs</h2>

        <div class="ds__form-grid">
          <el-form label-position="top">
            <el-form-item label="Text Input">
              <el-input v-model="sampleInput" placeholder="Enter your full name" />
            </el-form-item>

            <el-form-item label="Text Input (with icon)">
              <el-input v-model="sampleInput" placeholder="Search applications...">
                <template #prefix>
                  <i class="fa-solid fa-magnifying-glass" style="color: var(--fcc-text-muted)" />
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="Select">
              <el-select v-model="sampleSelect" placeholder="Select application type" style="width: 100%">
                <el-option label="Trademark Recordation" value="trademark" />
                <el-option label="Merger Notification (FCC-8)" value="merger" />
                <el-option label="Exemption Application" value="exemption" />
              </el-select>
            </el-form-item>

            <el-form-item label="Date Picker">
              <el-date-picker v-model="sampleDate" type="date" placeholder="Pick a date" style="width: 100%" />
            </el-form-item>

            <el-form-item label="Textarea">
              <el-input v-model="sampleTextarea" type="textarea" :rows="3" placeholder="Describe the purpose of your application..." />
            </el-form-item>

            <el-form-item label="Switch">
              <el-switch v-model="sampleSwitch" active-text="Yes" inactive-text="No" />
            </el-form-item>

            <el-form-item label="Checkbox">
              <el-checkbox v-model="sampleCheckbox">
                I confirm the information is accurate
              </el-checkbox>
            </el-form-item>

            <el-form-item label="Radio Group">
              <el-radio-group v-model="sampleRadio">
                <el-radio value="a">Individual</el-radio>
                <el-radio value="b">Company</el-radio>
                <el-radio value="c">Government Entity</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="Disabled Input">
              <el-input model-value="Read-only value" disabled />
            </el-form-item>
          </el-form>
        </div>
      </section>

      <!-- ─── STATUS BADGES ─── -->
      <section id="ds-badges" class="ds__section">
        <h2 class="ds__section-title">Status Badges</h2>

        <h3 class="ds__group-title">Application Statuses</h3>
        <div class="ds__badge-row">
          <StatusBadge v-for="s in statusList" :key="s" :value="s" />
        </div>

        <h3 class="ds__group-title">Element Plus Tags</h3>
        <div class="ds__badge-row">
          <el-tag>Default</el-tag>
          <el-tag type="success">Approved</el-tag>
          <el-tag type="warning">Pending</el-tag>
          <el-tag type="danger">Rejected</el-tag>
          <el-tag type="info">Info</el-tag>
        </div>

        <h3 class="ds__group-title">Tag Sizes</h3>
        <div class="ds__badge-row">
          <el-tag size="large" type="success">Large</el-tag>
          <el-tag type="success">Default</el-tag>
          <el-tag size="small" type="success">Small</el-tag>
        </div>
      </section>

      <!-- ─── DESCRIPTIONS ─── -->
      <section id="ds-descriptions" class="ds__section">
        <h2 class="ds__section-title">Description Cards</h2>

        <h3 class="ds__group-title">Standard (2-column)</h3>
        <div class="ds__desc-card">
          <div class="ds__desc-card-header">
            <h4 class="ds__desc-card-title">Application Details</h4>
            <el-tag type="success" size="small">Approved</el-tag>
          </div>
          <dl class="ds__dl ds__dl--2col">
            <div class="ds__dl-item"><dt>Reference</dt><dd>FCC-TR-2026-0142</dd></div>
            <div class="ds__dl-item"><dt>Applicant</dt><dd>Tanzania Breweries Ltd</dd></div>
            <div class="ds__dl-item"><dt>Type</dt><dd>Trademark Recordation</dd></div>
            <div class="ds__dl-item"><dt>Filing Date</dt><dd>March 15, 2026</dd></div>
            <div class="ds__dl-item"><dt>Fee Paid</dt><dd>TZS 150,000</dd></div>
            <div class="ds__dl-item"><dt>Decision Date</dt><dd>April 8, 2026</dd></div>
            <div class="ds__dl-item ds__dl-item--full"><dt>Description</dt><dd>Trademark recordation for the Kilimanjaro Premium brand covering beer and malt beverages in the domestic and East African market.</dd></div>
          </dl>
        </div>

        <h3 class="ds__group-title">3-Column with Accent Border</h3>
        <div class="ds__desc-card ds__desc-card--accent">
          <div class="ds__desc-card-header">
            <h4 class="ds__desc-card-title">Employee Summary</h4>
          </div>
          <dl class="ds__dl ds__dl--3col">
            <div class="ds__dl-item"><dt>Full Name</dt><dd>George Louis Ngwenya</dd></div>
            <div class="ds__dl-item"><dt>Email</dt><dd>george.ngwenya@fcc.go.tz</dd></div>
            <div class="ds__dl-item"><dt>Department</dt><dd>Legal Services</dd></div>
            <div class="ds__dl-item"><dt>Position</dt><dd>Senior Legal Officer</dd></div>
            <div class="ds__dl-item"><dt>Employment Status</dt><dd>Full Time</dd></div>
            <div class="ds__dl-item"><dt>Joined</dt><dd>January 12, 2022</dd></div>
          </dl>
        </div>

        <h3 class="ds__group-title">Compact (Inline Pairs)</h3>
        <div class="ds__desc-card ds__desc-card--compact">
          <dl class="ds__dl ds__dl--inline">
            <div class="ds__dl-pair"><dt>Status</dt><dd><StatusBadge value="approved" /></dd></div>
            <div class="ds__dl-pair"><dt>Priority</dt><dd><el-tag type="danger" size="small">High</el-tag></dd></div>
            <div class="ds__dl-pair"><dt>Assigned</dt><dd>John Doe</dd></div>
            <div class="ds__dl-pair"><dt>Due</dt><dd>April 15, 2026</dd></div>
          </dl>
        </div>

        <h3 class="ds__group-title">Striped Rows</h3>
        <div class="ds__desc-card">
          <div class="ds__desc-card-header">
            <h4 class="ds__desc-card-title">Payment Information</h4>
          </div>
          <dl class="ds__dl ds__dl--striped">
            <div class="ds__dl-row"><dt>Control Number</dt><dd>991088812345</dd></div>
            <div class="ds__dl-row"><dt>Amount</dt><dd>TZS 150,000</dd></div>
            <div class="ds__dl-row"><dt>Payment Method</dt><dd>GePG</dd></div>
            <div class="ds__dl-row"><dt>Status</dt><dd><StatusBadge value="paid" /></dd></div>
            <div class="ds__dl-row"><dt>Paid On</dt><dd>April 7, 2026 at 14:32 EAT</dd></div>
            <div class="ds__dl-row"><dt>Receipt Number</dt><dd>RCP-2026-04-0892</dd></div>
          </dl>
        </div>

        <h3 class="ds__group-title">Card Grid (Bento)</h3>
        <div class="ds__desc-bento">
          <div class="ds__desc-card ds__desc-card--stat">
            <p class="ds__desc-stat-label">Total Applications</p>
            <p class="ds__desc-stat-value">321</p>
            <p class="ds__desc-stat-sub" style="color: var(--fcc-success)">+12% from last month</p>
          </div>
          <div class="ds__desc-card ds__desc-card--stat">
            <p class="ds__desc-stat-label">Approved</p>
            <p class="ds__desc-stat-value" style="color: var(--fcc-success)">248</p>
            <p class="ds__desc-stat-sub">77% approval rate</p>
          </div>
          <div class="ds__desc-card ds__desc-card--stat">
            <p class="ds__desc-stat-label">Revenue Collected</p>
            <p class="ds__desc-stat-value">42M</p>
            <p class="ds__desc-stat-sub">TZS</p>
          </div>
          <div class="ds__desc-card ds__desc-card--stat">
            <p class="ds__desc-stat-label">Avg Processing</p>
            <p class="ds__desc-stat-value">4.2</p>
            <p class="ds__desc-stat-sub">days</p>
          </div>
        </div>

        <h3 class="ds__group-title">Element Plus Descriptions</h3>
        <el-descriptions border :column="3">
          <el-descriptions-item label="Reference">FCC-TR-2026-0142</el-descriptions-item>
          <el-descriptions-item label="Type">Trademark</el-descriptions-item>
          <el-descriptions-item label="Status"><el-tag type="success" size="small">Approved</el-tag></el-descriptions-item>
          <el-descriptions-item label="Applicant">Tanzania Breweries Ltd</el-descriptions-item>
          <el-descriptions-item label="Fee">TZS 150,000</el-descriptions-item>
          <el-descriptions-item label="Date">April 8, 2026</el-descriptions-item>
        </el-descriptions>
      </section>

      <!-- ─── TABLES ─── -->
      <section id="ds-tables" class="ds__section">
        <h2 class="ds__section-title">Tables</h2>

        <h3 class="ds__group-title">Data Table with Search, Sort & Filter</h3>
        <div class="ds__table-shell">
          <!-- Toolbar -->
          <div class="ds__table-toolbar">
            <el-input
              v-model="tableSearch"
              placeholder="Search by reference, applicant, or type..."
              clearable
              style="width: 300px"
            >
              <template #prefix>
                <i class="fa-solid fa-magnifying-glass" style="color: var(--fcc-text-muted)" />
              </template>
            </el-input>

            <div class="ds__table-toolbar-actions">
              <el-button plain @click="tableFilterVisible = !tableFilterVisible">
                {{ tableFilterVisible ? 'Hide Filters' : 'Filters' }}
                <span v-if="tableStatusFilter" class="ds__filter-badge">1</span>
              </el-button>
              <el-button v-if="tableSearch || tableStatusFilter" type="info" link @click="clearTableFilters">
                Clear all
              </el-button>
            </div>
          </div>

          <!-- Collapsible filters -->
          <el-collapse-transition>
            <div v-show="tableFilterVisible" class="ds__table-filters">
              <div class="ds__table-filter-group">
                <span class="ds__table-filter-label">Status</span>
                <el-select v-model="tableStatusFilter" placeholder="All statuses" clearable style="width: 180px">
                  <el-option label="Draft" value="draft" />
                  <el-option label="Submitted" value="submitted" />
                  <el-option label="Under Review" value="under_review" />
                  <el-option label="Pending Payment" value="pending_payment" />
                  <el-option label="Approved" value="approved" />
                  <el-option label="Rejected" value="rejected" />
                  <el-option label="Completed" value="completed" />
                </el-select>
              </div>
            </div>
          </el-collapse-transition>

          <!-- Table -->
          <el-table
            :data="filteredTableData"
            stripe
            @sort-change="handleTableSort"
            style="width: 100%"
          >
            <el-table-column prop="ref" label="Reference" sortable="custom" width="180" />
            <el-table-column prop="applicant" label="Applicant" sortable="custom" />
            <el-table-column prop="type" label="Type" sortable="custom" width="150" />
            <el-table-column label="Status" width="150">
              <template #default="{ row }">
                <StatusBadge :value="row.status" />
              </template>
            </el-table-column>
            <el-table-column prop="date" label="Date" sortable="custom" width="130" />
            <el-table-column label="Fee" sortable="custom" prop="fee" width="140" align="right">
              <template #default="{ row }">
                <span style="font-family: var(--fcc-font-mono); font-size: var(--fcc-text-xs)">{{ formatTZS(row.fee) }}</span>
              </template>
            </el-table-column>
          </el-table>

          <div class="ds__table-footer">
            <span style="font-size: var(--fcc-text-xs); color: var(--fcc-text-muted)">
              Showing {{ filteredTableData.length }} of {{ tableRawData.length }} records
            </span>
          </div>
        </div>
      </section>

      <!-- ─── CARDS ─── -->
      <section id="ds-cards" class="ds__section">
        <h2 class="ds__section-title">Cards</h2>

        <div class="ds__card-grid">
          <el-card shadow="hover">
            <template #header>
              <div class="flex items-center justify-between">
                <span class="font-semibold">Application Card</span>
                <el-tag type="success" size="small">Approved</el-tag>
              </div>
            </template>
            <p style="color: var(--fcc-text-secondary); font-size: var(--fcc-text-sm)">
              Trademark recordation for "FCC Brand" submitted on April 2, 2026.
              Application reviewed and approved by the Registrar.
            </p>
            <div style="margin-top: 1rem; display: flex; gap: 0.5rem">
              <el-button type="primary" size="small">View Details</el-button>
              <el-button size="small" plain>Download</el-button>
            </div>
          </el-card>

          <el-card shadow="hover">
            <template #header>
              <div class="flex items-center justify-between">
                <span class="font-semibold">Payment Summary</span>
                <el-tag type="warning" size="small">Pending</el-tag>
              </div>
            </template>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem">
              <div>
                <p style="color: var(--fcc-text-muted); font-size: var(--fcc-text-xs)">Amount Due</p>
                <p style="font-weight: 700; font-size: var(--fcc-text-xl)">TZS 150,000</p>
              </div>
              <div>
                <p style="color: var(--fcc-text-muted); font-size: var(--fcc-text-xs)">Due Date</p>
                <p style="font-weight: 600">April 15, 2026</p>
              </div>
            </div>
            <el-button type="primary" style="margin-top: 1rem; width: 100%">Pay Now</el-button>
          </el-card>

          <el-card shadow="hover" style="border-left: 3px solid var(--fcc-info)">
            <p style="font-weight: 600; margin-bottom: 0.5rem">Notification</p>
            <p style="color: var(--fcc-text-secondary); font-size: var(--fcc-text-sm)">
              Your merger notification FCC-8 has been assigned to a case officer.
              You will be notified of any updates.
            </p>
          </el-card>
        </div>
      </section>

      <!-- ─── FEEDBACK ─── -->
      <section id="ds-feedback" class="ds__section">
        <h2 class="ds__section-title">Feedback & Alerts</h2>

        <div class="ds__feedback-stack">
          <el-alert title="Application submitted successfully" description="Your trademark recordation has been received. Reference: FCC-TR-2026-0142." type="success" show-icon />
          <el-alert title="Payment reminder" description="Your application fee of TZS 150,000 is due by April 15, 2026." type="warning" show-icon />
          <el-alert title="Document required" description="Please upload a certified copy of the company registration certificate." type="error" show-icon />
          <el-alert title="System maintenance" description="Scheduled maintenance on April 20, 2026 from 02:00 to 06:00 EAT." type="info" show-icon />
        </div>

        <h3 class="ds__group-title">Progress</h3>
        <div class="ds__feedback-stack" style="max-width: 400px">
          <div>
            <p style="font-size: var(--fcc-text-sm); margin-bottom: 0.5rem">Application completeness</p>
            <el-progress :percentage="75" :stroke-width="10" />
          </div>
          <div>
            <p style="font-size: var(--fcc-text-sm); margin-bottom: 0.5rem">Upload progress</p>
            <el-progress :percentage="100" status="success" :stroke-width="10" />
          </div>
          <div>
            <p style="font-size: var(--fcc-text-sm); margin-bottom: 0.5rem">Failed upload</p>
            <el-progress :percentage="40" status="exception" :stroke-width="10" />
          </div>
        </div>
      </section>

      <!-- ─── CHARTS ─── -->
      <section id="ds-charts" class="ds__section">
        <h2 class="ds__section-title">Charts & Data Visualization</h2>

        <h3 class="ds__group-title">Circular Progress</h3>
        <div class="ds__circular-row">
          <div v-for="m in circularMetrics" :key="m.label" class="ds__circular-item">
            <svg viewBox="0 0 80 80" class="ds__circular-svg">
              <circle cx="40" cy="40" r="36" fill="none" stroke="var(--fcc-border-light)" stroke-width="6" />
              <circle
                cx="40" cy="40" r="36" fill="none"
                :stroke="m.color"
                stroke-width="6"
                stroke-linecap="round"
                :stroke-dasharray="2 * Math.PI * 36"
                :stroke-dashoffset="circleOffset(m.value)"
                transform="rotate(-90 40 40)"
                style="transition: stroke-dashoffset 0.6s ease"
              />
              <text x="40" y="40" text-anchor="middle" dominant-baseline="central"
                    style="font-size: 14px; font-weight: 700; fill: var(--fcc-text-primary)">
                {{ m.value }}%
              </text>
            </svg>
            <span class="ds__circular-label">{{ m.label }}</span>
          </div>
        </div>

        <h3 class="ds__group-title">Bar Chart</h3>
        <div class="ds__bar-chart">
          <div v-for="d in barChartData" :key="d.label" class="ds__bar-item">
            <span class="ds__bar-label">{{ d.label }}</span>
            <div class="ds__bar-track">
              <div
                class="ds__bar-fill"
                :style="{ width: (d.value / barMax) * 100 + '%', background: d.color }"
              />
            </div>
            <span class="ds__bar-value">{{ d.value }}</span>
          </div>
        </div>

        <h3 class="ds__group-title">Donut Chart</h3>
        <div class="ds__donut-row">
          <svg viewBox="0 0 100 100" class="ds__donut-svg">
            <path
              v-for="(seg, i) in donutSegments" :key="seg.label"
              :d="donutPath(donutSegments, i)"
              :fill="seg.color"
              stroke="var(--fcc-bg-surface)" stroke-width="1.5"
            />
            <circle cx="50" cy="50" r="22" fill="var(--fcc-bg-surface)" />
            <text x="50" y="47" text-anchor="middle" dominant-baseline="central"
                  style="font-size: 10px; font-weight: 800; fill: var(--fcc-text-primary)">
              {{ donutTotal }}
            </text>
            <text x="50" y="57" text-anchor="middle" dominant-baseline="central"
                  style="font-size: 5px; fill: var(--fcc-text-muted)">
              Total
            </text>
          </svg>
          <div class="ds__donut-legend">
            <div v-for="seg in donutSegments" :key="seg.label" class="ds__donut-legend-item">
              <span class="ds__donut-dot" :style="{ background: seg.color }" />
              <span>{{ seg.label }}</span>
              <strong>{{ seg.value }}%</strong>
            </div>
          </div>
        </div>

        <h3 class="ds__group-title">Grouped Bar Chart (Monthly Trend)</h3>
        <div class="ds__grouped-chart">
          <div v-for="d in monthlyTrend" :key="d.month" class="ds__grouped-col">
            <div class="ds__grouped-bars">
              <div
                class="ds__grouped-bar"
                :style="{ height: (d.apps / trendMax) * 100 + '%', background: 'var(--fcc-primary-300)' }"
                :title="`Applications: ${d.apps}`"
              />
              <div
                class="ds__grouped-bar"
                :style="{ height: (d.approved / trendMax) * 100 + '%', background: 'var(--fcc-success)' }"
                :title="`Approved: ${d.approved}`"
              />
            </div>
            <span class="ds__grouped-label">{{ d.month }}</span>
          </div>
          <div class="ds__grouped-legend">
            <span><span class="ds__grouped-dot" style="background: var(--fcc-primary-300)" /> Applications</span>
            <span><span class="ds__grouped-dot" style="background: var(--fcc-success)" /> Approved</span>
          </div>
        </div>

        <h3 class="ds__group-title">Sparkline</h3>
        <div class="ds__sparkline-card">
          <div>
            <p style="font-size: var(--fcc-text-xs); color: var(--fcc-text-muted)">Applications This Quarter</p>
            <p style="font-size: var(--fcc-text-2xl); font-weight: 800; font-family: var(--fcc-font-heading)">321</p>
          </div>
          <svg viewBox="0 0 200 50" class="ds__sparkline-svg">
            <path :d="sparklinePath" fill="none" stroke="var(--fcc-success)" stroke-width="2" />
          </svg>
        </div>

        <h3 class="ds__group-title">Element Plus Circular Progress</h3>
        <div class="ds__ep-circular-row">
          <el-progress type="circle" :percentage="78" :width="100" :stroke-width="8" color="var(--fcc-success)">
            <template #default="{ percentage }">
              <span style="font-size: var(--fcc-text-lg); font-weight: 700">{{ percentage }}%</span>
              <span style="font-size: var(--fcc-text-xs); color: var(--fcc-text-muted)">Complete</span>
            </template>
          </el-progress>
          <el-progress type="circle" :percentage="45" :width="100" :stroke-width="8" color="var(--fcc-warning)">
            <template #default="{ percentage }">
              <span style="font-size: var(--fcc-text-lg); font-weight: 700">{{ percentage }}%</span>
              <span style="font-size: var(--fcc-text-xs); color: var(--fcc-text-muted)">Pending</span>
            </template>
          </el-progress>
          <el-progress type="circle" :percentage="92" :width="100" :stroke-width="8" color="var(--fcc-primary-600)">
            <template #default="{ percentage }">
              <span style="font-size: var(--fcc-text-lg); font-weight: 700">{{ percentage }}%</span>
              <span style="font-size: var(--fcc-text-xs); color: var(--fcc-text-muted)">On Time</span>
            </template>
          </el-progress>
          <el-progress type="circle" :percentage="12" :width="100" :stroke-width="8" status="exception">
            <template #default="{ percentage }">
              <span style="font-size: var(--fcc-text-lg); font-weight: 700">{{ percentage }}%</span>
              <span style="font-size: var(--fcc-text-xs); color: var(--fcc-text-muted)">Errors</span>
            </template>
          </el-progress>
        </div>

        <h3 class="ds__group-title">Dashboard Progress (Linear)</h3>
        <div class="ds__linear-stack">
          <div class="ds__linear-item">
            <div class="ds__linear-head">
              <span>Trademark Applications</span>
              <strong>142 / 180</strong>
            </div>
            <el-progress :percentage="79" :stroke-width="8" color="var(--fcc-primary-600)" :show-text="false" />
          </div>
          <div class="ds__linear-item">
            <div class="ds__linear-head">
              <span>Merger Notifications</span>
              <strong>38 / 50</strong>
            </div>
            <el-progress :percentage="76" :stroke-width="8" color="var(--fcc-secondary-500)" :show-text="false" />
          </div>
          <div class="ds__linear-item">
            <div class="ds__linear-head">
              <span>Payment Collection</span>
              <strong>TZS 42M / 60M</strong>
            </div>
            <el-progress :percentage="70" :stroke-width="8" color="var(--fcc-success)" :show-text="false" />
          </div>
          <div class="ds__linear-item">
            <div class="ds__linear-head">
              <span>Overdue Tasks</span>
              <strong>7 / 120</strong>
            </div>
            <el-progress :percentage="6" :stroke-width="8" status="exception" :show-text="false" />
          </div>
        </div>
      </section>

      <!-- ─── PAGE SAMPLES ─── -->
      <section id="ds-pages" class="ds__section">
        <h2 class="ds__section-title">Page Layout Samples</h2>

        <h3 class="ds__group-title">Dashboard (Bento Grid)</h3>
        <div class="ds__page-frame">
          <div class="ds__bento">
            <!-- Stat cards row -->
            <div class="ds__bento-stat">
              <p class="ds__stat-label">Total Applications</p>
              <p class="ds__stat-value">321</p>
              <p class="ds__stat-change ds__stat-change--up">+12% from last month</p>
            </div>
            <div class="ds__bento-stat">
              <p class="ds__stat-label">Approved</p>
              <p class="ds__stat-value" style="color: var(--fcc-success)">248</p>
              <p class="ds__stat-change ds__stat-change--up">+8%</p>
            </div>
            <div class="ds__bento-stat">
              <p class="ds__stat-label">Pending Review</p>
              <p class="ds__stat-value" style="color: var(--fcc-warning)">47</p>
              <p class="ds__stat-change ds__stat-change--down">-3%</p>
            </div>
            <div class="ds__bento-stat">
              <p class="ds__stat-label">Rejected</p>
              <p class="ds__stat-value" style="color: var(--fcc-danger)">26</p>
              <p class="ds__stat-change ds__stat-change--down">-15%</p>
            </div>

            <!-- Chart area -->
            <div class="ds__bento-wide">
              <h4 class="ds__bento-heading">Application Trend</h4>
              <div class="ds__grouped-chart" style="height: 140px">
                <div v-for="d in monthlyTrend" :key="d.month" class="ds__grouped-col">
                  <div class="ds__grouped-bars">
                    <div class="ds__grouped-bar" :style="{ height: (d.apps / trendMax) * 100 + '%', background: 'var(--fcc-primary-300)' }" />
                    <div class="ds__grouped-bar" :style="{ height: (d.approved / trendMax) * 100 + '%', background: 'var(--fcc-success)' }" />
                  </div>
                  <span class="ds__grouped-label">{{ d.month }}</span>
                </div>
              </div>
            </div>

            <!-- Sidebar donut -->
            <div class="ds__bento-side">
              <h4 class="ds__bento-heading">Status Breakdown</h4>
              <svg viewBox="0 0 100 100" style="width: 100px; margin: 0 auto; display: block">
                <path v-for="(seg, i) in donutSegments" :key="seg.label" :d="donutPath(donutSegments, i)" :fill="seg.color" stroke="var(--fcc-bg-surface)" stroke-width="1.5" />
                <circle cx="50" cy="50" r="22" fill="var(--fcc-bg-surface)" />
              </svg>
              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem; justify-content: center">
                <span v-for="seg in donutSegments" :key="seg.label" style="font-size: 11px; display: flex; align-items: center; gap: 4px">
                  <span :style="{ width: '8px', height: '8px', borderRadius: '50%', background: seg.color, flexShrink: 0 }" />
                  {{ seg.label }}
                </span>
              </div>
            </div>

            <!-- Recent activity -->
            <div class="ds__bento-list">
              <h4 class="ds__bento-heading">Recent Activity</h4>
              <div class="ds__activity-item" v-for="n in 4" :key="n">
                <div class="ds__activity-dot" :style="{ background: n === 1 ? 'var(--fcc-success)' : n === 2 ? 'var(--fcc-warning)' : n === 3 ? 'var(--fcc-info)' : 'var(--fcc-text-disabled)' }" />
                <div style="flex: 1; min-width: 0">
                  <p style="font-size: 12.5px; font-weight: 600; margin: 0">{{ ['Application approved', 'Payment received', 'Document uploaded', 'Draft saved'][n-1] }}</p>
                  <p style="font-size: 11px; color: var(--fcc-text-muted); margin: 0">{{ ['2 min ago', '15 min ago', '1 hour ago', 'Yesterday'][n-1] }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h3 class="ds__group-title">Detail Page</h3>
        <div class="ds__page-frame">
          <div class="ds__detail">
            <div class="ds__detail-header">
              <div>
                <p style="font-size: 11px; color: var(--fcc-text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin: 0">Trademark Recordation</p>
                <h3 style="margin: 0.25rem 0 0; font-family: var(--fcc-font-heading); font-size: 1.15rem; font-weight: 700">FCC-TR-2026-0142</h3>
              </div>
              <el-tag type="success" size="small">Approved</el-tag>
            </div>
            <div class="ds__detail-body">
              <div class="ds__desc-grid">
                <div class="ds__desc-item">
                  <dt>Applicant</dt>
                  <dd>Tanzania Breweries Ltd</dd>
                </div>
                <div class="ds__desc-item">
                  <dt>Mark Name</dt>
                  <dd>Kilimanjaro Premium</dd>
                </div>
                <div class="ds__desc-item">
                  <dt>Class</dt>
                  <dd>Class 32 - Beverages</dd>
                </div>
                <div class="ds__desc-item">
                  <dt>Filing Date</dt>
                  <dd>March 15, 2026</dd>
                </div>
                <div class="ds__desc-item">
                  <dt>Decision Date</dt>
                  <dd>April 8, 2026</dd>
                </div>
                <div class="ds__desc-item">
                  <dt>Fee Paid</dt>
                  <dd>TZS 150,000</dd>
                </div>
                <div class="ds__desc-item ds__desc-item--full">
                  <dt>Description</dt>
                  <dd>Trademark recordation for the Kilimanjaro Premium brand, covering beer and malt beverages in the domestic and East African market.</dd>
                </div>
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem; padding: 1rem 1.25rem; border-top: 1px solid var(--fcc-border-light)">
              <el-button type="primary" size="small">Download Certificate</el-button>
              <el-button size="small" plain>Print</el-button>
              <el-button size="small" plain>View Timeline</el-button>
            </div>
          </div>
        </div>

        <h3 class="ds__group-title">Overview / List Page</h3>
        <div class="ds__page-frame">
          <div class="ds__overview">
            <div class="ds__overview-header">
              <h3 style="margin: 0; font-family: var(--fcc-font-heading); font-weight: 700">My Applications</h3>
              <el-button type="primary" size="small">New Application</el-button>
            </div>
            <el-table
              :data="[
                { ref: 'FCC-TR-0142', type: 'Trademark', status: 'Approved', date: 'Apr 8, 2026' },
                { ref: 'FCC-MR-0038', type: 'Merger (FCC-8)', status: 'Under Review', date: 'Apr 5, 2026' },
                { ref: 'FCC-EX-0067', type: 'Exemption', status: 'Pending Payment', date: 'Apr 3, 2026' },
                { ref: 'FCC-TR-0139', type: 'Trademark', status: 'Draft', date: 'Mar 28, 2026' },
              ]"
              size="small"
              stripe
            >
              <el-table-column prop="ref" label="Reference" width="140" />
              <el-table-column prop="type" label="Type" />
              <el-table-column label="Status" width="140">
                <template #default="{ row }">
                  <StatusBadge :value="row.status.toLowerCase().replace(/ /g, '_')" />
                </template>
              </el-table-column>
              <el-table-column prop="date" label="Date" width="130" />
            </el-table>
          </div>
        </div>
      </section>

      <!-- ─── SETTINGS PAGE SAMPLE ─── -->
      <section id="ds-settings" class="ds__section">
        <h2 class="ds__section-title">Settings Page Sample</h2>

        <div class="ds__page-frame">
          <div class="ds__settings-shell">
            <!-- Sidebar -->
            <aside class="ds__set-sidebar">
              <div class="ds__set-sidebar-profile">
                <div class="ds__set-avatar">GN</div>
                <div>
                  <p class="ds__set-avatar-name">George Ngwenya</p>
                  <p class="ds__set-avatar-email">george@tbl.co.tz</p>
                </div>
              </div>
              <nav class="ds__set-nav">
                <button v-for="(tab, i) in [
                  { label: 'Profile', icon: 'fa-user', desc: 'Personal & company info' },
                  { label: 'Security', icon: 'fa-shield-halved', desc: 'Password & sessions' },
                  { label: 'Notifications', icon: 'fa-bell', desc: 'Email, push & SMS' },
                  { label: 'Appearance', icon: 'fa-palette', desc: 'Theme & display' },
                  { label: 'Data & Privacy', icon: 'fa-lock', desc: 'Export & delete' },
                ]" :key="tab.label"
                  class="ds__set-nav-btn" :class="{ 'ds__set-nav-btn--active': i === 0 }">
                  <div class="ds__set-nav-icon-wrap">
                    <i :class="['fa-solid', tab.icon]" />
                  </div>
                  <div class="ds__set-nav-text">
                    <span class="ds__set-nav-label">{{ tab.label }}</span>
                    <span class="ds__set-nav-desc">{{ tab.desc }}</span>
                  </div>
                </button>
              </nav>
            </aside>

            <!-- Content -->
            <div class="ds__set-main">
              <div class="ds__set-page-head">
                <h2>Profile</h2>
                <p>Manage your personal information, company details, and contact preferences.</p>
              </div>

              <!-- Avatar row -->
              <div class="ds__set-row">
                <div class="ds__set-row-left">
                  <h4>Profile Photo</h4>
                  <p>This will be displayed on your account.</p>
                </div>
                <div class="ds__set-row-right">
                  <div class="ds__set-photo-area">
                    <div class="ds__set-avatar ds__set-avatar--xl">GN</div>
                    <div class="ds__set-photo-drop">
                      <i class="fa-solid fa-cloud-arrow-up" style="font-size: 20px; color: var(--fcc-primary-500); margin-bottom: 0.25rem" />
                      <p class="ds__set-photo-cta">Click to upload or drag and drop</p>
                      <p class="ds__set-photo-hint">PNG, JPG or SVG (max 2MB)</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Company fields — 3 items = 3 columns -->
              <div class="ds__set-row">
                <div class="ds__set-row-left">
                  <h4>Company Details</h4>
                  <p>Legal name and registration as filed with BRELA.</p>
                </div>
                <div class="ds__set-row-right">
                  <div class="ds__set-fields ds__set-fields--3">
                    <div class="ds__set-f">
                      <label>Company Name</label>
                      <div class="ds__set-inp">Tanzania Breweries Ltd</div>
                    </div>
                    <div class="ds__set-f">
                      <label>Registration Number</label>
                      <div class="ds__set-inp">TZ-2024-00142</div>
                    </div>
                    <div class="ds__set-f">
                      <label>Country of Incorporation</label>
                      <div class="ds__set-inp">Tanzania</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Contact — 3 items = 3 columns -->
              <div class="ds__set-row">
                <div class="ds__set-row-left">
                  <h4>Contact Information</h4>
                  <p>How FCC can reach you about your applications.</p>
                </div>
                <div class="ds__set-row-right">
                  <div class="ds__set-fields ds__set-fields--3">
                    <div class="ds__set-f">
                      <label>Email</label>
                      <div class="ds__set-inp">info@tbl.co.tz</div>
                    </div>
                    <div class="ds__set-f">
                      <label>Phone Number</label>
                      <div class="ds__set-inp">+255 22 218 0650</div>
                    </div>
                    <div class="ds__set-f">
                      <label>Contact Person</label>
                      <div class="ds__set-inp">George Ngwenya</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Address — reusable pattern: 3-col (country, region, city) + 2-col (postal, physical) -->
              <div class="ds__set-row">
                <div class="ds__set-row-left">
                  <h4>Address</h4>
                  <p>Registered business address for official correspondence.</p>
                </div>
                <div class="ds__set-row-right">
                  <div class="ds__set-fields ds__set-fields--3">
                    <div class="ds__set-f">
                      <label>Country</label>
                      <div class="ds__set-inp">Tanzania</div>
                    </div>
                    <div class="ds__set-f">
                      <label>Region</label>
                      <div class="ds__set-inp">Dar es Salaam</div>
                    </div>
                    <div class="ds__set-f">
                      <label>City / Town</label>
                      <div class="ds__set-inp">Ilala</div>
                    </div>
                  </div>
                  <div class="ds__set-fields" style="margin-top: 0.75rem">
                    <div class="ds__set-f">
                      <label>Postal Address</label>
                      <div class="ds__set-inp">P.O. Box 9013, Dar es Salaam</div>
                    </div>
                    <div class="ds__set-f">
                      <label>Physical / Street Address</label>
                      <div class="ds__set-inp">Uhuru Street, Ilala, Dar es Salaam</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Notifications section -->
              <div class="ds__set-row">
                <div class="ds__set-row-left">
                  <h4>Notifications</h4>
                  <p>Choose how you want to be notified.</p>
                </div>
                <div class="ds__set-row-right">
                  <div class="ds__set-toggle-stack">
                    <div class="ds__set-toggle-item">
                      <div>
                        <span class="ds__set-toggle-name">Email Notifications</span>
                        <span class="ds__set-toggle-hint">Status changes, payment confirmations</span>
                      </div>
                      <el-switch :model-value="true" />
                    </div>
                    <div class="ds__set-toggle-item">
                      <div>
                        <span class="ds__set-toggle-name">Push Notifications</span>
                        <span class="ds__set-toggle-hint">Real-time browser alerts</span>
                      </div>
                      <el-switch :model-value="false" />
                    </div>
                    <div class="ds__set-toggle-item" style="border-bottom: none">
                      <div>
                        <span class="ds__set-toggle-name">SMS Alerts</span>
                        <span class="ds__set-toggle-hint">Payment and deadline reminders</span>
                      </div>
                      <el-switch :model-value="true" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Password -->
              <div class="ds__set-row" style="border-bottom: none">
                <div class="ds__set-row-left">
                  <h4>Password</h4>
                  <p>Update your password to keep your account secure.</p>
                </div>
                <div class="ds__set-row-right">
                  <div class="ds__set-fields">
                    <div class="ds__set-f ds__set-f--full">
                      <label>Current Password</label>
                      <div class="ds__set-inp">********</div>
                    </div>
                    <div class="ds__set-f">
                      <label>New Password</label>
                      <div class="ds__set-inp ds__set-inp--placeholder">At least 8 characters</div>
                    </div>
                    <div class="ds__set-f">
                      <label>Confirm Password</label>
                      <div class="ds__set-inp ds__set-inp--placeholder">Re-enter new password</div>
                    </div>
                  </div>
                  <el-button type="primary" style="margin-top: 0.75rem">Update Password</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.ds {
  display: flex;
  min-height: 100vh;
  background: var(--fcc-bg-app);
  color: var(--fcc-text-primary);
  font-family: var(--fcc-font-body);
}

/* ── Sidebar (fixed) ── */
.ds__nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 260px;
  height: 100vh;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--fcc-bg-surface);
  border-right: 1px solid var(--fcc-border);
  z-index: 50;
}

.ds__nav-header {
  padding: 1.25rem 1.25rem 0.75rem;
  border-bottom: 1px solid var(--fcc-border-light);
  flex-shrink: 0;
}

.ds__nav-title {
  font-family: var(--fcc-font-heading);
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
  color: var(--fcc-primary-900);
}

.ds__nav-sub {
  font-size: 11px;
  color: var(--fcc-text-muted);
  margin: 0.15rem 0 0;
}

.ds__nav-scroll {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.ds__nav-list {
  list-style: none;
  padding: 0.5rem 0.6rem;
  margin: 0;
}

.ds__nav-link {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.4rem 0.65rem;
  font-size: 12.5px;
  color: var(--fcc-text-secondary);
  background: none;
  border: none;
  border-radius: var(--fcc-radius-md);
  cursor: pointer;
  transition: all var(--fcc-duration-fast) var(--fcc-ease-default);
}

.ds__nav-link:hover {
  background: var(--fcc-bg-surface-muted);
  color: var(--fcc-text-primary);
}

.ds__nav-link--active {
  background: var(--fcc-primary-50);
  color: var(--fcc-primary-900);
  font-weight: 600;
}

/* ── Controls ── */
.ds__controls {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--fcc-border-light);
}

.ds__controls-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--fcc-text-muted);
  margin: 0 0 0.65rem;
}

.ds__control {
  display: block;
  margin-bottom: 0.6rem;
}

.ds__control-label {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 11.5px;
  color: var(--fcc-text-secondary);
  margin-bottom: 0.2rem;
}

.ds__control-label code {
  font-family: var(--fcc-font-mono);
  font-size: 10.5px;
  font-weight: 700;
  color: var(--fcc-secondary-600);
}

.ds__slider {
  width: 100%;
  height: 4px;
  appearance: none;
  -webkit-appearance: none;
  background: var(--fcc-border);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.ds__slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--fcc-primary-700);
  border: 2px solid var(--fcc-bg-surface);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  cursor: pointer;
}

.ds__slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--fcc-primary-700);
  border: 2px solid var(--fcc-bg-surface);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  cursor: pointer;
}

.ds__control-actions {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.75rem;
}

.ds__control-btn {
  flex: 1;
  padding: 0.35rem 0;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid var(--fcc-border);
  border-radius: var(--fcc-radius-md);
  background: var(--fcc-bg-surface-muted);
  color: var(--fcc-text-secondary);
  cursor: pointer;
  transition: all 120ms ease;
}

.ds__control-btn:hover {
  background: var(--fcc-border-light);
  color: var(--fcc-text-primary);
}

.ds__control-btn--accent {
  background: var(--fcc-primary-50);
  border-color: var(--fcc-primary-200);
  color: var(--fcc-primary-800);
}

.ds__control-btn--accent:hover {
  background: var(--fcc-primary-100);
}

.ds__export {
  margin: 0.65rem 0 0;
  padding: 0.6rem 0.7rem;
  font-family: var(--fcc-font-mono);
  font-size: 10px;
  line-height: 1.5;
  background: var(--fcc-bg-surface-muted);
  border: 1px solid var(--fcc-border-light);
  border-radius: var(--fcc-radius-sm);
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--fcc-text-secondary);
  max-height: 120px;
  overflow-y: auto;
}

.ds__nav-footer {
  padding: 0.75rem 1.25rem;
  border-top: 1px solid var(--fcc-border-light);
  flex-shrink: 0;
}

/* ── Main ── */
.ds__main {
  flex: 1;
  margin-left: 260px;
  padding: 2.5rem 3rem;
  min-height: 100vh;
}

.ds__header {
  margin-bottom: 2.5rem;
}

.ds__title {
  font-family: var(--fcc-font-heading);
  font-size: var(--fcc-text-3xl);
  font-weight: 800;
  margin: 0;
}

.ds__subtitle {
  font-size: var(--fcc-text-base);
  color: var(--fcc-text-muted);
  margin: 0.5rem 0 0;
  max-width: 600px;
}

/* ── Sections ── */
.ds__section {
  margin-bottom: 3rem;
  scroll-margin-top: 2rem;
}

.ds__section-title {
  font-family: var(--fcc-font-heading);
  font-size: var(--fcc-text-2xl);
  font-weight: 700;
  margin: 0 0 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--fcc-border);
}

.ds__group-title {
  font-size: var(--fcc-text-base);
  font-weight: 600;
  margin: 1.75rem 0 0.75rem;
  color: var(--fcc-text-secondary);
}

/* ── Color swatches ── */
.ds__swatch-row {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.ds__swatch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 72px;
}

.ds__swatch-box {
  width: 100%;
  height: 48px;
  border-radius: var(--fcc-radius-md);
  border: 1px solid var(--fcc-border-light);
}

.ds__swatch-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--fcc-text-secondary);
}

.ds__swatch-token {
  font-size: 8px;
  font-family: var(--fcc-font-mono);
  color: var(--fcc-text-muted);
  word-break: break-all;
  text-align: center;
}

.ds__semantic-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.ds__semantic-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: var(--fcc-radius-base);
  border: 1px solid;
  font-size: var(--fcc-text-sm);
}

.ds__semantic-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ds__surface-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
}

.ds__surface-box {
  padding: 1.25rem 1rem;
  border-radius: var(--fcc-radius-base);
  border: 1px solid var(--fcc-border);
  font-size: var(--fcc-text-sm);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.ds__text-samples {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ds__text-samples p {
  margin: 0;
  font-size: var(--fcc-text-base);
}

.ds__border-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.ds__border-sample {
  padding: 1rem 1.25rem;
  border: 2px solid;
  border-radius: var(--fcc-radius-base);
  font-size: var(--fcc-text-sm);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.ds__code-sm {
  font-family: var(--fcc-font-mono);
  font-size: 10px;
  color: var(--fcc-text-muted);
}

/* ── Typography ── */
.ds__type-families {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ds__type-family {
  padding: 1rem 1.25rem;
  background: var(--fcc-bg-surface);
  border: 1px solid var(--fcc-border-light);
  border-radius: var(--fcc-radius-base);
}

.ds__type-sample {
  margin: 0 0 0.25rem;
}

.ds__type-scale {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ds__type-row {
  display: flex;
  align-items: baseline;
  gap: 1.5rem;
  padding: 0.6rem 0.75rem;
  border-radius: var(--fcc-radius-sm);
}

.ds__type-row:nth-child(odd) {
  background: var(--fcc-bg-surface-muted);
}

.ds__type-label {
  width: 100px;
  flex-shrink: 0;
  font-size: var(--fcc-text-xs);
  font-family: var(--fcc-font-mono);
  color: var(--fcc-text-muted);
}

.ds__type-preview {
  color: var(--fcc-text-primary);
}

/* ── Spacing ── */
.ds__spacing-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ds__spacing-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.ds__spacing-bar {
  background: var(--fcc-secondary-500);
  border-radius: 3px;
  min-width: 4px;
  flex-shrink: 0;
}

.ds__spacing-info {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.ds__spacing-label {
  font-size: var(--fcc-text-sm);
  font-weight: 600;
  min-width: 80px;
}

/* ── Radius ── */
.ds__radius-grid {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.ds__radius-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.ds__radius-box {
  width: 64px;
  height: 64px;
  background: var(--fcc-primary-100);
  border: 2px solid var(--fcc-primary-400);
}

.ds__radius-label {
  font-size: var(--fcc-text-xs);
  font-weight: 600;
}

/* ── Shadows ── */
.ds__shadow-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1.25rem;
}

.ds__shadow-box {
  padding: 1.5rem 1rem;
  background: var(--fcc-bg-surface);
  border-radius: var(--fcc-radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  font-size: var(--fcc-text-sm);
}

/* ── Buttons ── */
.ds__button-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* ── Form ── */
.ds__form-grid {
  max-width: 480px;
  background: var(--fcc-bg-surface);
  border: 1px solid var(--fcc-border-light);
  border-radius: var(--fcc-radius-xl);
  padding: 1.5rem;
}

/* ── Badges ── */
.ds__badge-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* ── Cards ── */
.ds__card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

/* ── Feedback ── */
.ds__feedback-stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .ds__nav {
    position: static;
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--fcc-border);
  }
  .ds__nav-header {
    display: none;
  }
  .ds__nav-scroll {
    overflow-x: auto;
    overflow-y: visible;
  }
  .ds__nav-list {
    display: flex;
    gap: 0;
    padding: 0.5rem;
    white-space: nowrap;
  }
  .ds__controls {
    display: none;
  }
  .ds__nav-footer {
    display: none;
  }
  .ds__main {
    margin-left: 0;
    padding: 1.5rem 1rem;
  }
}

/* ── Circular Progress ── */
.ds__circular-row {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.ds__circular-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.ds__circular-svg {
  width: 90px;
  height: 90px;
}

.ds__circular-label {
  font-size: var(--fcc-text-xs);
  font-weight: 600;
  color: var(--fcc-text-secondary);
}

/* ── Bar Chart ── */
.ds__bar-chart {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  max-width: 500px;
}

.ds__bar-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.ds__bar-label {
  width: 90px;
  flex-shrink: 0;
  font-size: var(--fcc-text-sm);
  font-weight: 600;
  text-align: right;
}

.ds__bar-track {
  flex: 1;
  height: 22px;
  background: var(--fcc-bg-surface-muted);
  border-radius: var(--fcc-radius-pill);
  overflow: hidden;
}

.ds__bar-fill {
  height: 100%;
  border-radius: var(--fcc-radius-pill);
  transition: width 0.5s ease;
}

.ds__bar-value {
  width: 36px;
  font-size: var(--fcc-text-sm);
  font-weight: 700;
  font-family: var(--fcc-font-mono);
}

/* ── Donut ── */
.ds__donut-row {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.ds__donut-svg {
  width: 140px;
  height: 140px;
  flex-shrink: 0;
}

.ds__donut-legend {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ds__donut-legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--fcc-text-sm);
}

.ds__donut-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ds__donut-legend-item strong {
  margin-left: auto;
  font-family: var(--fcc-font-mono);
}

/* ── Grouped Bar Chart ── */
.ds__grouped-chart {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  height: 180px;
  padding: 0 0.5rem;
  position: relative;
}

.ds__grouped-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  height: 100%;
}

.ds__grouped-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 3px;
  width: 100%;
}

.ds__grouped-bar {
  flex: 1;
  border-radius: 3px 3px 0 0;
  min-height: 2px;
  transition: height 0.4s ease;
}

.ds__grouped-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--fcc-text-muted);
}

.ds__grouped-legend {
  position: absolute;
  top: -4px;
  right: 0;
  display: flex;
  gap: 1rem;
  font-size: 11px;
  color: var(--fcc-text-muted);
}

.ds__grouped-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 3px;
}

/* ── Sparkline ── */
.ds__sparkline-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.25rem;
  background: var(--fcc-bg-surface);
  border: 1px solid var(--fcc-border-light);
  border-radius: var(--fcc-radius-lg);
  max-width: 400px;
}

.ds__sparkline-card p {
  margin: 0;
}

.ds__sparkline-svg {
  width: 140px;
  height: 50px;
  flex-shrink: 0;
}

/* ── EP Circular ── */
.ds__ep-circular-row {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.ds__ep-circular-row :deep(.el-progress__text) {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

/* ── Linear Progress Stack ── */
.ds__linear-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 480px;
}

.ds__linear-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.ds__linear-head {
  display: flex;
  justify-content: space-between;
  font-size: var(--fcc-text-sm);
}

.ds__linear-head strong {
  font-family: var(--fcc-font-mono);
  font-size: var(--fcc-text-xs);
}

/* ── Page Samples ── */
.ds__page-frame {
  border: 1px solid var(--fcc-border);
  border-radius: var(--fcc-radius-xl);
  overflow: hidden;
  background: var(--fcc-bg-app);
}

/* Bento Dashboard */
.ds__bento {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.85rem;
  padding: 1.25rem;
}

.ds__bento-stat {
  background: var(--fcc-bg-surface);
  border: 1px solid var(--fcc-border-light);
  border-radius: var(--fcc-radius-lg);
  padding: 1rem;
}

.ds__stat-label {
  font-size: 11px;
  color: var(--fcc-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0;
}

.ds__stat-value {
  font-family: var(--fcc-font-heading);
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0.2rem 0;
}

.ds__stat-change {
  font-size: 11px;
  font-weight: 600;
  margin: 0;
}

.ds__stat-change--up { color: var(--fcc-success); }
.ds__stat-change--down { color: var(--fcc-danger); }

.ds__bento-wide {
  grid-column: span 3;
  background: var(--fcc-bg-surface);
  border: 1px solid var(--fcc-border-light);
  border-radius: var(--fcc-radius-lg);
  padding: 1rem;
}

.ds__bento-side {
  grid-column: span 1;
  background: var(--fcc-bg-surface);
  border: 1px solid var(--fcc-border-light);
  border-radius: var(--fcc-radius-lg);
  padding: 1rem;
}

.ds__bento-list {
  grid-column: span 4;
  background: var(--fcc-bg-surface);
  border: 1px solid var(--fcc-border-light);
  border-radius: var(--fcc-radius-lg);
  padding: 1rem;
}

.ds__bento-heading {
  font-size: var(--fcc-text-sm);
  font-weight: 700;
  margin: 0 0 0.75rem;
}

.ds__activity-item {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.45rem 0;
}

.ds__activity-item + .ds__activity-item {
  border-top: 1px solid var(--fcc-border-light);
}

.ds__activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

/* Detail Page */
.ds__detail {
  background: var(--fcc-bg-surface);
  margin: 1.25rem;
  border-radius: var(--fcc-radius-lg);
  border: 1px solid var(--fcc-border-light);
  overflow: hidden;
}

.ds__detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--fcc-border-light);
}

.ds__detail-body {
  padding: 1.25rem;
}

.ds__desc-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.ds__desc-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.ds__desc-item dt {
  font-size: 11px;
  color: var(--fcc-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ds__desc-item dd {
  margin: 0;
  font-size: var(--fcc-text-sm);
  font-weight: 600;
}

.ds__desc-item--full {
  grid-column: 1 / -1;
}

.ds__desc-item--full dd {
  font-weight: 400;
  color: var(--fcc-text-secondary);
}

/* Overview Page */
.ds__overview {
  background: var(--fcc-bg-surface);
  margin: 1.25rem;
  border-radius: var(--fcc-radius-lg);
  border: 1px solid var(--fcc-border-light);
  overflow: hidden;
}

.ds__overview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--fcc-border-light);
}

/* ── Interactive Radius Playground ── */
.ds__radius-playground {
  margin-top: 1rem;
  padding: 1.5rem;
  background: var(--fcc-bg-surface);
  border: 1px solid var(--fcc-border-light);
  border-radius: var(--fcc-radius-xl);
}

.ds__radius-control-bar {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--fcc-border-light);
}

.ds__radius-slider-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: var(--fcc-text-sm);
  font-weight: 600;
  flex: 1;
  min-width: 200px;
}

.ds__radius-slider-label .ds__slider {
  flex: 1;
  min-width: 120px;
}

.ds__radius-value {
  font-family: var(--fcc-font-mono);
  font-size: var(--fcc-text-lg);
  font-weight: 800;
  color: var(--fcc-primary-700);
  min-width: 50px;
  text-align: center;
}

.ds__radius-presets {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.ds__radius-preset {
  padding: 0.3rem 0.6rem;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid var(--fcc-border);
  border-radius: var(--fcc-radius-sm);
  background: var(--fcc-bg-surface-muted);
  color: var(--fcc-text-secondary);
  cursor: pointer;
  transition: all 100ms ease;
}

.ds__radius-preset:hover {
  border-color: var(--fcc-primary-300);
  color: var(--fcc-primary-700);
}

.ds__radius-preset--active {
  background: var(--fcc-primary-50);
  border-color: var(--fcc-primary-400);
  color: var(--fcc-primary-800);
  font-weight: 700;
}

.ds__radius-preview-grid {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.ds__radius-preview-card {
  width: 180px;
  border: 1px solid var(--fcc-border);
  overflow: hidden;
  background: var(--fcc-bg-surface);
}

.ds__radius-preview-header {
  padding: 0.6rem 0.85rem;
  background: var(--fcc-primary-700);
  color: white;
  font-size: 12px;
  font-weight: 700;
}

.ds__radius-preview-body {
  padding: 0.75rem 0.85rem;
  font-size: 12px;
  color: var(--fcc-text-secondary);
}

.ds__radius-preview-body code {
  font-family: var(--fcc-font-mono);
  font-weight: 700;
  color: var(--fcc-primary-600);
}

.ds__radius-preview-avatar {
  width: 48px;
  height: 48px;
  background: var(--fcc-primary-100);
  color: var(--fcc-primary-700);
  font-size: 14px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--fcc-primary-300);
}

.ds__radius-preview-chip {
  padding: 0.35rem 0.85rem;
  background: var(--fcc-secondary-50);
  border: 1px solid var(--fcc-secondary-200);
  color: var(--fcc-secondary-700);
  font-size: 12px;
  font-weight: 600;
}

/* ── Description Cards ── */
.ds__desc-card {
  background: var(--fcc-bg-surface);
  border: 1px solid var(--fcc-border-light);
  border-radius: var(--fcc-radius-lg);
  overflow: hidden;
}

.ds__desc-card--accent {
  border-left: 3px solid var(--fcc-primary-600);
}

.ds__desc-card--compact {
  padding: 0.85rem 1.1rem;
}

.ds__desc-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.1rem;
  border-bottom: 1px solid var(--fcc-border-light);
  background: var(--fcc-bg-surface-muted);
}

.ds__desc-card-title {
  margin: 0;
  font-size: var(--fcc-text-sm);
  font-weight: 700;
}

/* DL — 2-column grid */
.ds__dl {
  display: grid;
  margin: 0;
  padding: 0;
}

.ds__dl--2col {
  grid-template-columns: 1fr 1fr;
}

.ds__dl--3col {
  grid-template-columns: repeat(3, 1fr);
}

.ds__dl-item {
  padding: 0.7rem 1.1rem;
  border-bottom: 1px solid var(--fcc-border-light);
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.ds__dl-item:nth-last-child(-n+2):nth-child(odd) {
  border-bottom: none;
}

.ds__dl-item--full {
  grid-column: 1 / -1;
}

.ds__dl-item dt {
  font-size: 11px;
  color: var(--fcc-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
}

.ds__dl-item dd {
  margin: 0;
  font-size: var(--fcc-text-sm);
  font-weight: 600;
  color: var(--fcc-text-primary);
}

.ds__dl-item--full dd {
  font-weight: 400;
  color: var(--fcc-text-secondary);
}

/* DL — Inline pairs */
.ds__dl--inline {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.ds__dl-pair {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ds__dl-pair dt {
  font-size: 12px;
  color: var(--fcc-text-muted);
  font-weight: 500;
}

.ds__dl-pair dd {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
}

/* DL — Striped rows */
.ds__dl--striped {
  display: flex;
  flex-direction: column;
}

.ds__dl-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 1.1rem;
}

.ds__dl-row:nth-child(odd) {
  background: var(--fcc-bg-surface-muted);
}

.ds__dl-row dt {
  font-size: var(--fcc-text-sm);
  color: var(--fcc-text-muted);
}

.ds__dl-row dd {
  margin: 0;
  font-size: var(--fcc-text-sm);
  font-weight: 600;
}

/* Desc bento stat cards */
.ds__desc-bento {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.85rem;
}

.ds__desc-card--stat {
  padding: 1rem 1.1rem;
  text-align: center;
}

.ds__desc-stat-label {
  font-size: 11px;
  color: var(--fcc-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0;
}

.ds__desc-stat-value {
  font-family: var(--fcc-font-heading);
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0.15rem 0;
}

.ds__desc-stat-sub {
  font-size: 12px;
  color: var(--fcc-text-muted);
  margin: 0;
}

/* ── Table Section ── */
.ds__table-shell {
  background: var(--fcc-bg-surface);
  border: 1px solid var(--fcc-border-light);
  border-radius: var(--fcc-radius-lg);
  overflow: hidden;
}

.ds__table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  gap: 0.75rem;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--fcc-border-light);
}

.ds__table-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ds__filter-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--fcc-primary-600);
  color: white;
  font-size: 10px;
  font-weight: 700;
  margin-left: 4px;
}

.ds__table-filters {
  display: flex;
  gap: 1.25rem;
  padding: 0.75rem 1rem;
  background: var(--fcc-bg-surface-muted);
  border-bottom: 1px solid var(--fcc-border-light);
  flex-wrap: wrap;
}

.ds__table-filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ds__table-filter-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--fcc-text-muted);
}

.ds__table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1rem;
  border-top: 1px solid var(--fcc-border-light);
}

/* ── Settings Page Sample ── */
.ds__settings-shell {
  display: flex;
  min-height: 560px;
  background: var(--fcc-bg-surface);
  overflow: hidden;
}

/* Sidebar */
.ds__set-sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--fcc-bg-surface-muted);
  border-right: 1px solid var(--fcc-border-light);
  display: flex;
  flex-direction: column;
}

.ds__set-sidebar-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid var(--fcc-border-light);
}

.ds__set-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--fcc-primary-100);
  color: var(--fcc-primary-700);
  font-size: 14px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ds__set-avatar--lg {
  width: 64px;
  height: 64px;
  font-size: 20px;
  border: 2px solid var(--fcc-border);
}

.ds__set-avatar--xl {
  width: 96px;
  height: 96px;
  font-size: 28px;
  border: 3px solid var(--fcc-border);
  flex-shrink: 0;
}

.ds__set-photo-area {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem 1.5rem;
  border: 1.5px dashed var(--fcc-border);
  border-radius: var(--fcc-radius-lg);
  background: var(--fcc-bg-surface-muted);
  cursor: pointer;
  transition: border-color 150ms ease, background 150ms ease;
}

.ds__set-photo-area:hover {
  border-color: var(--fcc-primary-400);
  background: color-mix(in srgb, var(--fcc-primary-500) 3%, var(--fcc-bg-surface-muted));
}

.ds__set-photo-drop {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.ds__set-photo-cta {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--fcc-text-primary);
}

.ds__set-photo-hint {
  margin: 0.15rem 0 0;
  font-size: 11.5px;
  color: var(--fcc-text-muted);
}

.ds__set-avatar-name {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--fcc-text-primary);
}

.ds__set-avatar-email {
  margin: 0;
  font-size: 11px;
  color: var(--fcc-text-muted);
}

.ds__set-nav {
  flex: 1;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ds__set-nav-btn {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.55rem 0.65rem;
  border: none;
  border-radius: var(--fcc-radius-lg);
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: all 120ms ease;
}

.ds__set-nav-btn:hover {
  background: var(--fcc-bg-surface);
}

.ds__set-nav-btn--active {
  background: var(--fcc-bg-surface);
  box-shadow: var(--fcc-shadow-sm);
}

.ds__set-nav-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: var(--fcc-radius-base);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--fcc-text-muted);
  background: var(--fcc-bg-surface-muted);
  flex-shrink: 0;
}

.ds__set-nav-btn--active .ds__set-nav-icon-wrap {
  background: var(--fcc-primary-900);
  color: #fff;
}

.ds__set-nav-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.ds__set-nav-label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--fcc-text-primary);
}

.ds__set-nav-btn:not(.ds__set-nav-btn--active) .ds__set-nav-label {
  color: var(--fcc-text-secondary);
}

.ds__set-nav-desc {
  font-size: 10.5px;
  color: var(--fcc-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Main content */
.ds__set-main {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.ds__set-page-head {
  padding: 1.5rem 2rem 1rem;
  border-bottom: 1px solid var(--fcc-border-light);
}

.ds__set-page-head h2 {
  margin: 0;
  font-family: var(--fcc-font-heading);
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--fcc-text-primary);
}

.ds__set-page-head p {
  margin: 0.2rem 0 0;
  font-size: 12.5px;
  color: var(--fcc-text-muted);
}

/* Two-column row layout */
.ds__set-row {
  display: flex;
  gap: 2rem;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--fcc-border-light);
}

.ds__set-row-left {
  width: 220px;
  flex-shrink: 0;
}

.ds__set-row-left h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--fcc-text-primary);
}

.ds__set-row-left p {
  margin: 0.2rem 0 0;
  font-size: 12px;
  color: var(--fcc-text-muted);
  line-height: 1.4;
}

.ds__set-row-right {
  flex: 1;
  min-width: 0;
}

/* Fields grid — default 2 columns, use --3 for 3 items */
.ds__set-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.ds__set-fields--3 {
  grid-template-columns: 1fr 1fr 1fr;
}

.ds__set-f {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.ds__set-f--full {
  grid-column: 1 / -1;
}

.ds__set-f label {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--fcc-text-muted);
}

.ds__set-inp {
  padding: 0.5rem 0.65rem;
  border: 1px solid var(--fcc-border);
  border-radius: var(--fcc-radius-base);
  font-size: 13px;
  color: var(--fcc-text-primary);
  background: var(--fcc-bg-surface);
}

.ds__set-inp--placeholder {
  color: var(--fcc-text-disabled);
}

/* Segmented control */
.ds__set-seg {
  padding: 0.4rem 1rem;
  font-size: 12.5px;
  font-weight: 600;
  border: 1px solid var(--fcc-border);
  background: var(--fcc-bg-surface);
  color: var(--fcc-text-secondary);
  cursor: pointer;
  font-family: inherit;
  transition: all 120ms;
}

.ds__set-seg:first-child {
  border-radius: var(--fcc-radius-base) 0 0 var(--fcc-radius-base);
}

.ds__set-seg:last-child {
  border-radius: 0 var(--fcc-radius-base) var(--fcc-radius-base) 0;
  border-left: none;
}

.ds__set-seg--active {
  background: var(--fcc-primary-900);
  border-color: var(--fcc-primary-900);
  color: #fff;
}

/* Toggle stack */
.ds__set-toggle-stack {
  border: 1px solid var(--fcc-border);
  border-radius: var(--fcc-radius-lg);
  overflow: hidden;
}

.ds__set-toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--fcc-border-light);
}

.ds__set-toggle-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--fcc-text-primary);
}

.ds__set-toggle-hint {
  display: block;
  font-size: 11px;
  color: var(--fcc-text-muted);
  margin-top: 1px;
}
</style>
