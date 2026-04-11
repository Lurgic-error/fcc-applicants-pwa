<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { FccStatusBadge as StatusBadge } from '@shared/design-system/components'
import { useApplicantDataStore } from '@/stores/applications'
import { useTableExport } from '@/composables/useTableExport'

const router = useRouter()
const dataStore = useApplicantDataStore()

function toDateTime(value) {
  if (!value || value === 'N/A') return 'N/A'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}

function toAmount(value) {
  return Number(value || 0).toLocaleString()
}

function normalizeStatusText(value, fallback = 'pending') {
  const text = String(value || fallback).trim()
  return text || fallback
}

function isCompletedStatus(value = '') {
  const normalized = String(value || '').toLowerCase()
  return (
    normalized.includes('paid') ||
    normalized.includes('confirm') ||
    normalized.includes('verified') ||
    normalized.includes('settled')
  )
}

function resolvePaymentBucket(row = {}) {
  const balance = Number(row.balance || 0)
  if (balance <= 0 && (isCompletedStatus(row.paymentStatus) || isCompletedStatus(row.billStatus))) {
    return 'Completed'
  }
  return 'Pending'
}

function resolveApplicantAction(row = {}) {
  if (resolvePaymentBucket(row) === 'Completed') {
    return row.relatedApplicationJourney?.nextAction || 'No payment action pending.'
  }

  if (row.controlNumber) {
    return 'Use the control number to complete payment, then return to submit or continue the application.'
  }

  return row.relatedApplicationJourney?.nextAction || 'Open the payment to review the billing details.'
}

onMounted(async () => {
  await dataStore.loadPayments()
})

const paymentRows = computed(() =>
  (dataStore.payments || [])
    .map((row) => {
      const amount = Number(row.amount || 0)
      const amountPaid = Number(row.amountPaid || 0)
      const balance = Number.isFinite(Number(row.balance)) ? Number(row.balance) : Math.max(0, amount - amountPaid)
      const paymentStatus = normalizeStatusText(row.paymentStatus || row.status)
      const billStatus = normalizeStatusText(row.billStatus || row.status)

      return {
        ...row,
        amount,
        amountPaid,
        balance,
        paymentStatus,
        billStatus,
        paidAtDisplay: toDateTime(row.paidAt),
        dueDateDisplay: toDateTime(row.dueDate),
        bucket: resolvePaymentBucket({
          ...row,
          balance,
          paymentStatus,
          billStatus
        }),
        applicantAction: resolveApplicantAction({
          ...row,
          balance,
          paymentStatus,
          billStatus
        }),
        receiptOrReference: row.receiptNumber || row.referenceNumber || 'N/A'
      }
    })
    .sort((left, right) => {
      if (left.bucket !== right.bucket) {
        return left.bucket === 'Pending' ? -1 : 1
      }
      return String(right.dueDate || '').localeCompare(String(left.dueDate || ''))
    })
)

const pendingRows = computed(() => paymentRows.value.filter((row) => row.bucket === 'Pending'))
const completedRows = computed(() => paymentRows.value.filter((row) => row.bucket === 'Completed'))
const hasPayments = computed(() => paymentRows.value.length > 0)
const outstandingBalance = computed(() =>
  pendingRows.value.reduce((sum, row) => sum + Number(row.balance || row.amount || 0), 0)
)
const completedAmount = computed(() =>
  completedRows.value.reduce((sum, row) => sum + Number(row.amountPaid || row.amount || 0), 0)
)
const nextPendingPayment = computed(() => pendingRows.value[0] || null)

const summaryCards = computed(() => [
  {
    label: 'Total Payment Records',
    value: paymentRows.value.length,
    detail: 'All application-related fee obligations for this account'
  },
  {
    label: 'Pending Payments',
    value: pendingRows.value.length,
    detail: `TZS ${toAmount(outstandingBalance.value)} still outstanding`
  },
  {
    label: 'Completed Payments',
    value: completedRows.value.length,
    detail: `TZS ${toAmount(completedAmount.value)} already settled`
  },
  {
    label: 'Next Focus',
    value: nextPendingPayment.value?.applicationId || 'Up to date',
    detail: nextPendingPayment.value
      ? nextPendingPayment.value.applicantAction
      : 'No pending payment action for this applicant account'
  }
])

const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 15

const filteredPaymentRows = computed(() => {
  if (!searchQuery.value.trim()) return paymentRows.value
  const q = searchQuery.value.toLowerCase()
  return paymentRows.value.filter((row) =>
    String(row.applicationId || '').toLowerCase().includes(q) ||
    String(row.relatedService || '').toLowerCase().includes(q) ||
    String(row.controlNumber || '').toLowerCase().includes(q) ||
    String(row.paymentStatus || '').toLowerCase().includes(q)
  )
})

const paginatedPaymentRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredPaymentRows.value.slice(start, start + pageSize)
})

function handlePaymentSearch() {
  currentPage.value = 1
}

function openPayment(row) {
  router.push({ name: 'payment-details', params: { id: row.id } })
}

const { exportCsv, exportExcel, exportPdf } = useTableExport('fcc-payments')

const exportColumns = [
  { key: 'applicationId', label: 'Application ID' },
  { key: 'relatedService', label: 'Service' },
  { key: 'controlNumber', label: 'Control Number' },
  { key: 'paymentStatus', label: 'Payment Status' },
  { key: 'amount', label: 'Amount (TZS)' },
  { key: 'amountPaid', label: 'Paid Amount (TZS)' },
  { key: 'balance', label: 'Balance (TZS)' }
]

function handleExport(format) {
  const data = filteredPaymentRows.value
  if (format === 'csv') exportCsv(data, exportColumns)
  if (format === 'excel') exportExcel(data, exportColumns)
  if (format === 'pdf') exportPdf(data, exportColumns, 'fcc-payments', 'FCC Payments')
}
</script>

<template>
  <section class="min-w-0 space-y-6 overflow-x-hidden">
    <div class="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-cyan-900 to-blue-900 p-5 text-slate-100 shadow-panel md:p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="max-w-3xl">
          <p class="text-xs uppercase tracking-[0.22em] text-cyan-200">Payments</p>
          <h2 class="mt-2 text-2xl font-semibold md:text-3xl">Payment Status</h2>
          <p class="mt-2 text-sm text-slate-200">
            See which application fees are pending, which ones are completed, and what the applicant must do next before an application can move forward.
          </p>
        </div>
        <router-link :to="{ name: 'applications' }">
          <el-button size="large" plain>Open Applications</el-button>
        </router-link>
      </div>

      <div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="card in summaryCards"
          :key="card.label"
          class="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"
        >
          <p class="text-xs uppercase tracking-wide text-slate-200">{{ card.label }}</p>
          <p class="mt-1 text-3xl font-semibold break-words">{{ card.value }}</p>
          <p class="mt-1 text-xs text-cyan-100">{{ card.detail }}</p>
        </article>
      </div>
    </div>

    <el-alert
      v-if="!hasPayments"
      type="info"
      :closable="false"
      show-icon
      title="No applicant payment records are available yet for this account."
    />

    <div v-else class="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-5">
      <article class="min-w-0 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm xl:col-span-2">
        <div class="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 class="font-semibold text-amber-900">Pending Payments</h3>
            <p class="mt-1 text-sm text-amber-800">
              These records still need payment, reconciliation, or final confirmation before the related application can continue.
            </p>
          </div>
          <span class="rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">
            {{ pendingRows.length }}
          </span>
        </div>

        <div v-if="pendingRows.length" class="space-y-3">
          <article
            v-for="row in pendingRows.slice(0, 4)"
            :key="row.id"
            class="rounded-2xl border border-amber-200 bg-white p-4"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p class="text-xs uppercase tracking-wide text-slate-500">{{ row.relatedService || 'Application Fee' }}</p>
                <p class="mt-1 text-sm font-semibold text-slate-900">{{ row.applicationId }}</p>
              </div>
              <StatusBadge :status="row.paymentStatus" />
            </div>
            <p class="mt-3 text-sm text-slate-700">{{ row.applicantAction }}</p>
            <dl class="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt class="text-xs uppercase tracking-wide text-slate-500">Control Number</dt>
                <dd class="mt-1 font-medium text-slate-900">{{ row.controlNumber || 'Awaiting issuance' }}</dd>
              </div>
              <div>
                <dt class="text-xs uppercase tracking-wide text-slate-500">Balance</dt>
                <dd class="mt-1 font-medium text-slate-900">TZS {{ toAmount(row.balance || row.amount) }}</dd>
              </div>
            </dl>
            <el-button class="mt-3" plain @click="openPayment(row)">Open payment</el-button>
          </article>
        </div>
        <el-empty v-else description="No pending payments." />
      </article>

      <article class="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-3">
        <div class="mb-3 flex items-center justify-between">
          <div>
            <h3 class="font-semibold text-slate-900">Payment Records</h3>
            <p class="mt-1 text-sm text-slate-600">
              Pending records are listed first so applicants can complete payment and return to the linked application quickly.
            </p>
          </div>
        </div>

        <div class="mb-3 flex items-center gap-3">
          <el-input
            v-model="searchQuery"
            placeholder="Search by application, service, or control number..."
            clearable
            class="max-w-sm"
            @input="handlePaymentSearch"
          >
            <template #prefix>
              <i class="fa-solid fa-search text-slate-400" />
            </template>
          </el-input>
          <span class="text-sm text-slate-500 dark:text-slate-400">{{ filteredPaymentRows.length }} records</span>
          <el-dropdown trigger="click" @command="handleExport">
            <el-button plain>
              <i class="fa-solid fa-download mr-2" />Export
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="csv">CSV</el-dropdown-item>
                <el-dropdown-item command="excel">Excel (.xlsx)</el-dropdown-item>
                <el-dropdown-item command="pdf">PDF</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <div class="min-w-0 overflow-x-auto rounded-2xl border border-slate-200">
          <el-table
            class="w-full min-w-[1100px]"
            :data="paginatedPaymentRows"
            v-loading="dataStore.loading"
            empty-text="No payments recorded"
          >
            <el-table-column label="Status" min-width="120">
              <template #default="scope">
                <el-tag :type="scope.row.bucket === 'Completed' ? 'success' : 'warning'" effect="light">
                  {{ scope.row.bucket }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="applicationId" label="Application" min-width="170" sortable />
            <el-table-column prop="relatedService" label="Service" min-width="220" sortable>
              <template #default="scope">{{ scope.row.relatedService || 'FCC Application Fee' }}</template>
            </el-table-column>
            <el-table-column prop="controlNumber" label="Control Number" min-width="170" sortable />
            <el-table-column prop="paymentStatus" label="Payment Status" min-width="150" sortable>
              <template #default="scope">
                <StatusBadge :status="scope.row.paymentStatus" />
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="Amount Due (TZS)" min-width="150" sortable>
              <template #default="scope">{{ toAmount(scope.row.amount) }}</template>
            </el-table-column>
            <el-table-column prop="amountPaid" label="Paid Amount (TZS)" min-width="150">
              <template #default="scope">{{ toAmount(scope.row.amountPaid) }}</template>
            </el-table-column>
            <el-table-column prop="balance" label="Balance (TZS)" min-width="140">
              <template #default="scope">{{ toAmount(scope.row.balance) }}</template>
            </el-table-column>
            <el-table-column prop="dueDateDisplay" label="Due Date" min-width="180" />
            <el-table-column prop="paidAtDisplay" label="Paid At" min-width="180" />
            <el-table-column label="Applicant Next Step" min-width="280">
              <template #default="scope">{{ scope.row.applicantAction }}</template>
            </el-table-column>
            <el-table-column label="Action" min-width="120" fixed="right">
              <template #default="scope">
                <el-button link type="primary" @click="openPayment(scope.row)">Open</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="filteredPaymentRows.length > pageSize" class="mt-4 flex justify-center">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="filteredPaymentRows.length"
            layout="prev, pager, next"
            background
          />
        </div>
      </article>
    </div>
  </section>
</template>
