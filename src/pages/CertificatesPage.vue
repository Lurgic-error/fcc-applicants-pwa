<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  resolveApplicationServiceKeyFromText
} from '@/constants/applicationCatalog'
import { getCertificatePolicy } from '@/constants/applicationServiceRules'
import { useApplicantDataStore } from '@/stores/applications'
import { useTableExport } from '@/composables/useTableExport'

const router = useRouter()
const dataStore = useApplicantDataStore()

function normalizeDate(value) {
  if (!value || value === 'N/A') {
    return null
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatDate(value) {
  if (!value) {
    return 'No expiry'
  }
  return value.toISOString().slice(0, 10)
}

function resolveCertificateServiceKey(certificate = {}) {
  return certificate.relatedServiceKey || resolveApplicationServiceKeyFromText(certificate.service)
}

function resolveExpiryDate(certificate = {}) {
  const issued = normalizeDate(certificate.issuedAt)
  const policy = getCertificatePolicy(resolveCertificateServiceKey(certificate))
  if (!issued || !policy.validityMonths) {
    return null
  }

  const expiry = new Date(issued)
  expiry.setMonth(expiry.getMonth() + Number(policy.validityMonths))
  return expiry
}

function resolveLifecycle(certificate = {}) {
  const expiry = resolveExpiryDate(certificate)
  if (!expiry) {
    return 'Active'
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return 'Expired'
  }
  if (diffDays <= 30) {
    return 'Expiry Soon'
  }
  return 'Active'
}

onMounted(async () => {
  await dataStore.loadCertificates()
})

const certificateRows = computed(() =>
  (dataStore.certificates || []).map((certificate) => ({
    ...certificate,
    serviceKey: resolveCertificateServiceKey(certificate),
    expiryDate: formatDate(resolveExpiryDate(certificate)),
    lifecycle: resolveLifecycle(certificate)
  }))
)

const hasCertificates = computed(() => certificateRows.value.length > 0)

const summaryCards = computed(() => [
  {
    label: 'Total Certificates',
    value: certificateRows.value.length,
    detail: 'All certificates linked to this applicant account'
  },
  {
    label: 'Currently Active',
    value: certificateRows.value.filter((row) => row.lifecycle === 'Active').length,
    detail: 'Certificates still valid for use'
  },
  {
    label: 'Expiry Soon',
    value: certificateRows.value.filter((row) => row.lifecycle === 'Expiry Soon').length,
    detail: 'Certificates expiring in the next 30 days'
  },
  {
    label: 'Expired',
    value: certificateRows.value.filter((row) => row.lifecycle === 'Expired').length,
    detail: 'Certificates that require review or renewal action'
  }
])

const certificateTypes = computed(() => {
  const counts = new Map()
  for (const row of certificateRows.value) {
    const key = row.service || 'Certificate'
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
})

const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 15

const filteredCertificateRows = computed(() => {
  if (!searchQuery.value.trim()) return certificateRows.value
  const q = searchQuery.value.toLowerCase()
  return certificateRows.value.filter((row) =>
    String(row.certificateId || '').toLowerCase().includes(q) ||
    String(row.service || '').toLowerCase().includes(q) ||
    String(row.applicationId || '').toLowerCase().includes(q) ||
    String(row.lifecycle || '').toLowerCase().includes(q)
  )
})

const paginatedCertificateRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredCertificateRows.value.slice(start, start + pageSize)
})

function handleCertSearch() {
  currentPage.value = 1
}

function openCertificate(row) {
  router.push({ name: 'certificate-details', params: { id: row.certificateId } })
}

const { exportCsv, exportExcel, exportPdf } = useTableExport('fcc-certificates')

const exportColumns = [
  { key: 'certificateId', label: 'Certificate ID' },
  { key: 'service', label: 'Service' },
  { key: 'applicationId', label: 'Application ID' },
  { key: 'issuedAt', label: 'Issued At' },
  { key: 'expiryDate', label: 'Expiry Date' },
  { key: 'lifecycle', label: 'Lifecycle' },
  { key: 'status', label: 'Status' }
]

function handleExport(format) {
  const data = filteredCertificateRows.value
  if (format === 'csv') exportCsv(data, exportColumns)
  if (format === 'excel') exportExcel(data, exportColumns)
  if (format === 'pdf') exportPdf(data, exportColumns, 'fcc-certificates', 'FCC Certificates')
}
</script>

<template>
  <section class="min-w-0 space-y-6 overflow-x-hidden">
    <div class="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-indigo-900 to-sky-900 p-5 text-slate-100 shadow-panel md:p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="max-w-3xl">
          <p class="text-xs uppercase tracking-[0.22em] text-cyan-200">Certificates</p>
          <h2 class="mt-2 text-2xl font-semibold md:text-3xl">Certificates Overview</h2>
          <p class="mt-2 text-sm text-slate-200">
            Review the certificates already issued to this applicant account, see which ones are active, and identify any that are nearing expiry.
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
          <p class="mt-1 text-3xl font-semibold">{{ card.value }}</p>
          <p class="mt-1 text-xs text-sky-100">{{ card.detail }}</p>
        </article>
      </div>
    </div>

    <el-alert
      v-if="!hasCertificates"
      type="info"
      :closable="false"
      show-icon
      title="No certificates have been issued to this applicant account yet."
    />

    <div v-else class="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-5">
      <article class="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
        <div class="mb-3 flex items-center justify-between">
          <div>
            <h3 class="font-semibold text-slate-900">Certificate Types</h3>
            <p class="mt-1 text-sm text-slate-600">
              This shows which service types have already resulted in certificates for the applicant.
            </p>
          </div>
        </div>

        <div class="space-y-3">
          <article
            v-for="type in certificateTypes"
            :key="type.label"
            class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-semibold text-slate-900">{{ type.label }}</p>
              <span class="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{{ type.count }}</span>
            </div>
          </article>
        </div>
      </article>

      <article class="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-3">
        <div class="mb-3 flex items-center justify-between">
          <div>
            <h3 class="font-semibold text-slate-900">Issued Certificates</h3>
            <p class="mt-1 text-sm text-slate-600">
              Open any certificate to see the linked application, validity policy, and file download availability.
            </p>
          </div>
        </div>

        <div class="mb-3 flex items-center gap-3">
          <el-input
            v-model="searchQuery"
            placeholder="Search by certificate ID, service, or application..."
            clearable
            class="max-w-sm"
            @input="handleCertSearch"
          >
            <template #prefix>
              <i class="fa-solid fa-search text-slate-400" />
            </template>
          </el-input>
          <span class="text-sm text-slate-500 dark:text-slate-400">{{ filteredCertificateRows.length }} certificates</span>
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
            class="w-full min-w-[960px]"
            :data="paginatedCertificateRows"
            v-loading="dataStore.loading"
            empty-text="No certificates issued yet"
          >
            <el-table-column prop="certificateId" label="Certificate ID" min-width="180" sortable />
            <el-table-column prop="service" label="Type" min-width="220" sortable />
            <el-table-column prop="applicationId" label="Application ID" min-width="170" sortable />
            <el-table-column prop="issuedAt" label="Issued At" min-width="140" sortable />
            <el-table-column prop="expiryDate" label="Expiry" min-width="140" sortable />
            <el-table-column label="Lifecycle" min-width="130">
              <template #default="scope">
                <el-tag
                  :type="
                    scope.row.lifecycle === 'Expired'
                      ? 'danger'
                      : scope.row.lifecycle === 'Expiry Soon'
                        ? 'warning'
                        : 'success'
                  "
                  effect="light"
                >
                  {{ scope.row.lifecycle }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="Status" min-width="120" />
            <el-table-column label="Action" min-width="120" fixed="right">
              <template #default="scope">
                <el-button link type="primary" @click="openCertificate(scope.row)">Open</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="filteredCertificateRows.length > pageSize" class="mt-4 flex justify-center">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="filteredCertificateRows.length"
            layout="prev, pager, next"
            background
          />
        </div>
      </article>
    </div>
  </section>
</template>
