<script setup>
import { computed, ref, watch } from 'vue'
import { FccStatusBadge as StatusBadge } from '@shared/design-system/components'
import ActionDropdown from '@/components/ActionDropdown.vue'
import { labelTrademarkRequestType } from '@/constants/trademarkRecordation'
import { useTableExport } from '@/composables/useTableExport'

const props = defineProps({
  applications: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  pageSize: { type: Number, default: 15 },
  searchable: { type: Boolean, default: true }
})

const emit = defineEmits(['open', 'edit', 'view'])

const { exportCsv, exportExcel, exportPdf } = useTableExport('fcc-applications')

const exportColumns = [
  { key: 'applicationId', label: 'Application ID' },
  { key: 'service', label: 'Service' },
  { key: 'status', label: 'Status' },
  { key: 'workflowStageTitle', label: 'Workflow Stage' },
  { key: 'submittedAt', label: 'Submitted' }
]

function handleExport(format) {
  const data = filteredApplications.value
  if (format === 'csv') exportCsv(data, exportColumns)
  if (format === 'excel') exportExcel(data, exportColumns)
  if (format === 'pdf') exportPdf(data, exportColumns, 'fcc-applications', 'FCC Applications')
}

// --- Filter tabs ---
const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'needs_action', label: 'Needs Action' },
  { key: 'awaiting_payment', label: 'Awaiting Payment' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'completed', label: 'Completed' }
]

const activeTab = ref('all')
const searchQuery = ref('')
const currentPage = ref(1)

function normalizeStatus(row = {}) {
  return String(row.status || '').toLowerCase()
}

function hasPendingPayment(row = {}) {
  if (row.journey) {
    return row.journey.paymentRequired && !row.journey.paymentComplete
  }

  return String(row.payment?.status || row.raw?.paymentStatus || '').toLowerCase().includes('pending')
}

function needsAttention(row = {}) {
  if (row.journey?.hasOpenQuery) {
    return true
  }

  if (row.journey?.steps?.some((step) => step.state === 'attention')) {
    return true
  }

  const normalized = normalizeStatus(row)
  return normalized.includes('draft') || normalized.includes('query') || normalized.includes('rejected')
}

function isCompleted(row = {}) {
  const normalized = normalizeStatus(row)
  return normalized.includes('approved') || normalized.includes('issued') || normalized.includes('completed') || normalized.includes('closed')
}

function isUnderReview(row = {}) {
  const normalized = normalizeStatus(row)

  if (needsAttention(row) || hasPendingPayment(row) || isCompleted(row)) {
    return false
  }

  return (
    normalized.includes('submitted') ||
    normalized.includes('review') ||
    normalized.includes('screen') ||
    normalized.includes('vet') ||
    normalized.includes('acknowledged')
  )
}

function matchesActiveTab(row = {}) {
  if (activeTab.value === 'needs_action') return needsAttention(row)
  if (activeTab.value === 'awaiting_payment') return hasPendingPayment(row)
  if (activeTab.value === 'under_review') return isUnderReview(row)
  if (activeTab.value === 'completed') return isCompleted(row)
  return true
}

const tabFilteredApplications = computed(() =>
  props.applications.filter((application) => matchesActiveTab(application))
)

const filteredApplications = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return tabFilteredApplications.value
  return tabFilteredApplications.value.filter(
    (app) =>
      String(app.applicationId || '').toLowerCase().includes(q) ||
      String(app.service || '').toLowerCase().includes(q) ||
      String(app.title || '').toLowerCase().includes(q) ||
      String(app.referenceNumber || '').toLowerCase().includes(q) ||
      String(app.status || '').toLowerCase().includes(q) ||
      String(app.workflowStageTitle || '').toLowerCase().includes(q)
  )
})

const totalItems = computed(() => filteredApplications.value.length)

const paginatedApplications = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize
  return filteredApplications.value.slice(start, start + props.pageSize)
})

function handleSearchInput() {
  currentPage.value = 1
}

function handleTabChange(key) {
  activeTab.value = key
}

function tabCount(key) {
  const apps = props.applications
  if (key === 'all') return apps.length
  if (key === 'needs_action') return apps.filter((application) => needsAttention(application)).length
  if (key === 'awaiting_payment') return apps.filter((application) => hasPendingPayment(application)).length
  if (key === 'under_review') return apps.filter((application) => isUnderReview(application)).length
  if (key === 'completed') return apps.filter((application) => isCompleted(application)).length
  return 0
}

const hasTrademarkRows = computed(() =>
  (props.applications || []).some((row) => row.serviceKey === 'trademark-recordation')
)

function resolveRequestType(row = {}) {
  if (row.serviceKey !== 'trademark-recordation') {
    return 'N/A'
  }
  const requestType = row.requestType || row.trademarkRecordation?.requestType
  return labelTrademarkRequestType(requestType || 'new_recordation')
}

function resolveNextAction(row = {}) {
  return row.journey?.nextAction || 'Monitor the latest FCC update.'
}

function resolvePaymentStatus(row = {}) {
  return row.payment?.status || row.raw?.paymentStatus || 'Pending'
}

function resolveFees(row = {}) {
  return Number(row.fees?.total || row.raw?.applicationFee || 0).toLocaleString()
}

function onRowAction(command, row) {
  if (command === 'open') {
    emit('open', row)
    return
  }
  if (command === 'edit') {
    emit('edit', row)
  }
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

watch([activeTab, searchQuery], () => {
  currentPage.value = 1
})

watch(totalItems, (count) => {
  const maxPage = Math.max(1, Math.ceil(count / props.pageSize))
  if (currentPage.value > maxPage) {
    currentPage.value = maxPage
  }
})
</script>

<template>
  <div class="mt-2 min-w-0">
    <!-- Quick filter tabs -->
    <div class="mb-3 flex gap-1 overflow-x-auto pb-1">
      <button
        v-for="tab in FILTER_TABS"
        :key="tab.key"
        type="button"
        class="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors"
        :class="
          activeTab === tab.key
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
        "
        @click="handleTabChange(tab.key)"
      >
        {{ tab.label }}
        <span
          class="rounded-full px-1.5 py-0.5 text-xs"
          :class="
            activeTab === tab.key
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400'
          "
        >{{ tabCount(tab.key) }}</span>
      </button>
    </div>

    <!-- Search + export bar -->
    <div v-if="searchable" class="mb-3 flex flex-wrap items-center gap-3">
      <el-input
        v-model="searchQuery"
        placeholder="Search by ID, service, or status..."
        clearable
        class="max-w-sm"
        @input="handleSearchInput"
      >
        <template #prefix>
          <i class="fa-solid fa-search text-slate-400" />
        </template>
      </el-input>
      <span class="text-sm text-slate-500 dark:text-slate-400">{{ totalItems }} results</span>
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

    <!-- Desktop table (md+) -->
    <div class="hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
      <el-table
        class="w-full min-w-[960px]"
        :data="paginatedApplications"
        v-loading="loading"
        empty-text="No applications found"
      >
        <el-table-column prop="applicationId" label="Application ID" min-width="170" sortable />
        <el-table-column prop="service" label="Service" min-width="220" sortable />
        <el-table-column v-if="hasTrademarkRows" label="Request Type" min-width="180">
          <template #default="scope">{{ resolveRequestType(scope.row) }}</template>
        </el-table-column>
        <el-table-column prop="workflowStageTitle" label="Workflow Stage" min-width="180" />
        <el-table-column prop="status" label="Status" min-width="140" sortable>
          <template #default="scope">
            <StatusBadge :status="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="Fees (TZS)" min-width="150">
          <template #default="scope">
            {{ resolveFees(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column label="Payment" min-width="130">
          <template #default="scope">{{ resolvePaymentStatus(scope.row) }}</template>
        </el-table-column>
        <el-table-column label="Applicant Next Step" min-width="260">
          <template #default="scope">{{ resolveNextAction(scope.row) }}</template>
        </el-table-column>
        <el-table-column prop="submittedAt" label="Submitted" min-width="120" sortable />
        <el-table-column label="Action" min-width="170">
          <template #default="scope">
            <ActionDropdown
              label="Actions"
              :button-plain="false"
              :items="[
                { key: 'open', label: 'Open' },
                { key: 'edit', label: 'Update', disabled: scope.row.journey && !scope.row.journey.canEdit }
              ]"
              @select="({ command }) => onRowAction(command, scope.row)"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Mobile card list (<md) -->
    <div v-if="loading" class="space-y-3 md:hidden">
      <div
        v-for="n in 4"
        :key="n"
        class="h-24 animate-pulse rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
      />
    </div>
    <div v-else-if="filteredApplications.length === 0" class="py-10 text-center text-sm text-gray-400 md:hidden">
      No applications found.
    </div>
    <div v-else class="space-y-3 md:hidden">
      <div
        v-for="app in paginatedApplications"
        :key="app.applicationId"
        class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {{ app.serviceType || app.service || 'Application' }}
            </p>
            <h3 class="mt-1 truncate text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">
              {{ app.title || app.referenceNumber || app.applicationId }}
            </h3>
          </div>
          <StatusBadge :status="app.status" />
        </div>

        <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
          <span class="font-medium text-slate-800 dark:text-slate-100">Application ID:</span>
          {{ app.applicationId }}
        </p>

        <p v-if="hasTrademarkRows && app.serviceKey === 'trademark-recordation'" class="mt-2 text-sm text-slate-600 dark:text-slate-300">
          <span class="font-medium text-slate-800 dark:text-slate-100">Request Type:</span>
          {{ resolveRequestType(app) }}
        </p>

        <dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div class="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/80">
            <dt class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Workflow</dt>
            <dd class="mt-1 font-medium text-slate-900 dark:text-slate-100">{{ app.workflowStageTitle || 'Not started' }}</dd>
          </div>
          <div class="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/80">
            <dt class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Payment</dt>
            <dd class="mt-1 font-medium text-slate-900 dark:text-slate-100">{{ resolvePaymentStatus(app) }}</dd>
          </div>
          <div class="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/80">
            <dt class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Fees (TZS)</dt>
            <dd class="mt-1 font-medium text-slate-900 dark:text-slate-100">{{ resolveFees(app) }}</dd>
          </div>
          <div class="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/80">
            <dt class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Submitted</dt>
            <dd class="mt-1 font-medium text-slate-900 dark:text-slate-100">{{ formatDate(app.createdAt || app.submittedAt) }}</dd>
          </div>
        </dl>

        <div class="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 dark:border-sky-900/70 dark:bg-sky-950/20">
          <p class="text-xs uppercase tracking-wide text-sky-700 dark:text-sky-300">Applicant next step</p>
          <p class="mt-1 text-sm text-sky-900 dark:text-sky-100">{{ resolveNextAction(app) }}</p>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <el-button plain @click="emit('open', app)">Open</el-button>
          <el-button
            type="primary"
            plain
           
            :disabled="app.journey && !app.journey.canEdit"
            @click="emit('edit', app)"
          >
            Update
          </el-button>
        </div>
      </div>
    </div>

    <!-- Pagination (shared) -->
    <div v-if="totalItems > pageSize" class="mt-4 flex justify-center">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="totalItems"
        layout="prev, pager, next"
        background
      />
    </div>
  </div>
</template>
