<script setup>
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'

const props = defineProps({
  title: {
    type: String,
    default: 'Applications Intelligence'
  },
  summary: {
    type: String,
    default: ''
  },
  stats: {
    type: Array,
    default: () => []
  },
  trend: {
    type: Array,
    default: () => []
  },
  volumeSeries: {
    type: Array,
    default: () => []
  },
  statusBreakdown: {
    type: Array,
    default: () => []
  },
  progressMilestones: {
    type: Array,
    default: () => []
  },
  healthScore: {
    type: Number,
    default: 0
  }
})
const themeStore = useThemeStore()

const maxTrendValue = computed(() => Math.max(1, ...props.trend.map((item) => Number(item.value || 0))))

const trendPoints = computed(() => {
  if (!props.trend.length) {
    return ''
  }

  return props.trend
    .map((item, index) => {
      const x = props.trend.length === 1 ? 50 : (index * 100) / (props.trend.length - 1)
      const y = 42 - (Number(item.value || 0) / maxTrendValue.value) * 36
      return `${x},${y}`
    })
    .join(' ')
})

const maxStatusCount = computed(() => Math.max(1, ...props.statusBreakdown.map((item) => Number(item.count || 0))))
const maxVolume = computed(() => Math.max(1, ...props.volumeSeries.map((item) => Number(item.value || 0))))

const clampedHealthScore = computed(() => Math.min(100, Math.max(0, Number(props.healthScore || 0))))
const healthTrackColor = computed(() => (themeStore.isDarkTheme ? '#1e293b' : '#e2e8f0'))
const healthStyle = computed(() => ({
  background: `conic-gradient(#0ea5e9 ${clampedHealthScore.value * 3.6}deg, ${healthTrackColor.value} 0deg)`
}))
</script>

<template>
  <section class="min-w-0 space-y-4 overflow-x-hidden">
    <div
      class="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-100/70 via-white to-indigo-100/60 p-4 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:via-slate-900 dark:to-blue-950 md:p-5"
    >
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">Insights</p>
      <h3 class="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100 md:text-2xl">{{ title }}</h3>
      <p class="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">{{ summary }}</p>
    </div>

    <div class="grid min-w-0 gap-3" style="grid-template-columns: repeat(auto-fill, minmax(min(100%, 14rem), 1fr))">
      <article
        v-for="item in stats"
        :key="item.label"
        class="min-w-0 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/80"
      >
        <p class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{{ item.label }}</p>
        <p class="mt-1 text-3xl font-semibold text-slate-900 dark:text-slate-100">{{ item.value }}</p>
        <p class="mt-1 text-xs text-emerald-600">{{ item.delta }}</p>
      </article>
    </div>

    <div class="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-12">
      <article class="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 xl:col-span-6">
        <div class="mb-2 flex items-center justify-between">
          <h4 class="font-semibold dark:text-slate-100">Application Trend</h4>
          <p class="text-xs text-slate-500 dark:text-slate-400">Last 6 months</p>
        </div>

        <svg viewBox="0 0 100 44" class="h-28 w-full">
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0ea5e9" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#0ea5e9" stop-opacity="0.02" />
            </linearGradient>
          </defs>
          <polyline
            :points="trendPoints"
            fill="none"
            stroke="#0284c7"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <polygon :points="`${trendPoints} 100,44 0,44`" fill="url(#trend-fill)" />
        </svg>

        <div class="mt-2 grid grid-cols-6 gap-1 text-center text-[11px] text-slate-500 dark:text-slate-400">
          <div v-for="item in trend" :key="item.label">{{ item.label }}</div>
        </div>
      </article>

      <article class="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 xl:col-span-3">
        <div class="mb-2 flex items-center justify-between">
          <h4 class="font-semibold dark:text-slate-100">Weekly Volume</h4>
          <p class="text-xs text-slate-500 dark:text-slate-400">Last 6 weeks</p>
        </div>

        <div class="mt-3 flex h-28 items-end gap-2">
          <div v-for="item in volumeSeries" :key="item.label" class="flex flex-1 flex-col items-center gap-2">
            <div class="w-full rounded-t bg-gradient-to-t from-sky-500 to-indigo-400" :style="{ height: `${(Number(item.value || 0) / maxVolume) * 100}%` }" />
            <span class="text-[11px] text-slate-500 dark:text-slate-400">{{ item.label }}</span>
          </div>
        </div>
      </article>

      <article class="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 xl:col-span-3">
        <h4 class="font-semibold dark:text-slate-100">Processing Health</h4>
        <div class="mt-4 flex items-center gap-4">
          <div class="grid h-20 w-20 place-items-center rounded-full" :style="healthStyle">
            <div class="grid h-14 w-14 place-items-center rounded-full bg-white text-sm font-semibold text-slate-900 dark:bg-slate-900 dark:text-slate-100">
              {{ clampedHealthScore }}%
            </div>
          </div>
          <div class="space-y-1 text-xs text-slate-600 dark:text-slate-300">
            <p>Pipeline efficiency</p>
            <p>SLA and stage flow indicator</p>
          </div>
        </div>
      </article>
    </div>

    <div class="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
      <article class="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h4 class="font-semibold dark:text-slate-100">Status Distribution</h4>
        <div class="mt-3 space-y-3">
          <div v-for="item in statusBreakdown" :key="item.label">
            <div class="mb-1 flex items-center justify-between text-xs">
              <span class="text-slate-600 dark:text-slate-300">{{ item.label }}</span>
              <span class="font-semibold text-slate-800 dark:text-slate-100">{{ item.count }}</span>
            </div>
            <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                class="h-2 rounded-full"
                :style="{
                  width: `${(Number(item.count || 0) / maxStatusCount) * 100}%`,
                  backgroundColor: item.color || '#0ea5e9'
                }"
              />
            </div>
          </div>
        </div>
      </article>

      <article class="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h4 class="font-semibold dark:text-slate-100">Workflow Progress</h4>
        <div class="mt-3 space-y-3">
          <div v-for="item in progressMilestones" :key="item.label">
            <div class="mb-1 flex items-center justify-between text-xs">
              <span class="text-slate-600 dark:text-slate-300">{{ item.label }}</span>
              <span class="font-semibold text-slate-800 dark:text-slate-100">{{ item.percent }}%</span>
            </div>
            <el-progress :show-text="false" :percentage="item.percent" />
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
