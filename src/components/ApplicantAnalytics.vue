<script setup>
import { computed } from 'vue'

const props = defineProps({
  applications: { type: Array, default: () => [] },
  payments: { type: Array, default: () => [] },
  certificates: { type: Array, default: () => [] }
})

const totalApplications = computed(() => props.applications.length)

const statusDistribution = computed(() => {
  const counts = {}
  for (const app of props.applications) {
    const status = String(app.status || 'unknown').toLowerCase()
    const bucket = status.includes('approved') || status.includes('issued') ? 'Approved'
      : status.includes('rejected') ? 'Rejected'
      : status.includes('draft') ? 'Draft'
      : status.includes('submitted') || status.includes('review') || status.includes('screen') ? 'In Progress'
      : status.includes('payment') ? 'Awaiting Payment'
      : 'Other'
    counts[bucket] = (counts[bucket] || 0) + 1
  }
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count, percentage: totalApplications.value ? Math.round((count / totalApplications.value) * 100) : 0 }))
    .sort((a, b) => b.count - a.count)
})

const serviceDistribution = computed(() => {
  const counts = {}
  for (const app of props.applications) {
    const svc = app.service || 'Unknown'
    counts[svc] = (counts[svc] || 0) + 1
  }
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
})

const totalPaid = computed(() =>
  props.payments.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0)
)

const totalOutstanding = computed(() =>
  props.payments.reduce((sum, p) => sum + Number(p.balance || 0), 0)
)

const activeCertificates = computed(() =>
  props.certificates.filter((c) => c.lifecycle === 'Active').length
)

const expiringSoon = computed(() =>
  props.certificates.filter((c) => c.lifecycle === 'Expiry Soon').length
)

function statusColor(label) {
  const colors = { 'Approved': 'bg-green-500', 'In Progress': 'bg-blue-500', 'Awaiting Payment': 'bg-amber-500', 'Draft': 'bg-slate-400', 'Rejected': 'bg-red-500', 'Other': 'bg-slate-300' }
  return colors[label] || 'bg-slate-300'
}
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2">
    <article class="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
      <h4 class="text-sm font-semibold text-slate-900 dark:text-slate-100">Application Status</h4>
      <div class="mt-4 space-y-3">
        <div v-for="item in statusDistribution" :key="item.label">
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-700 dark:text-slate-200">{{ item.label }}</span>
            <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.count }}</span>
          </div>
          <div class="mt-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div class="h-full rounded-full transition-all" :class="statusColor(item.label)" :style="{ width: `${item.percentage}%` }" />
          </div>
        </div>
      </div>
    </article>

    <article class="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
      <h4 class="text-sm font-semibold text-slate-900 dark:text-slate-100">Applications by Service</h4>
      <div class="mt-4 space-y-2">
        <div v-for="item in serviceDistribution" :key="item.label" class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
          <span class="text-sm text-slate-700 dark:text-slate-200">{{ item.label }}</span>
          <span class="rounded-full bg-fcc-brand/10 px-2 py-0.5 text-xs font-semibold text-fcc-brand">{{ item.count }}</span>
        </div>
      </div>
    </article>

    <article class="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
      <h4 class="text-sm font-semibold text-slate-900 dark:text-slate-100">Financial Summary</h4>
      <dl class="mt-4 grid grid-cols-2 gap-4">
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Total Paid</dt>
          <dd class="mt-1 text-lg font-semibold text-green-600">TZS {{ totalPaid.toLocaleString() }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Outstanding</dt>
          <dd class="mt-1 text-lg font-semibold" :class="totalOutstanding > 0 ? 'text-amber-600' : 'text-slate-400'">TZS {{ totalOutstanding.toLocaleString() }}</dd>
        </div>
      </dl>
    </article>

    <article class="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
      <h4 class="text-sm font-semibold text-slate-900 dark:text-slate-100">Certificate Health</h4>
      <dl class="mt-4 grid grid-cols-2 gap-4">
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Active</dt>
          <dd class="mt-1 text-lg font-semibold text-green-600">{{ activeCertificates }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Expiring Soon</dt>
          <dd class="mt-1 text-lg font-semibold" :class="expiringSoon > 0 ? 'text-amber-600' : 'text-slate-400'">{{ expiringSoon }}</dd>
        </div>
      </dl>
    </article>
  </div>
</template>
