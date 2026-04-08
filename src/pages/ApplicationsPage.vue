<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ApplicationsTable from '@/components/applications/ApplicationsTable.vue'
import { FccStatusBadge as StatusBadge } from '@shared/design-system/components'
import {
  buildApplicationDetailsRoute,
  buildApplicationUpdateRoute
} from '@/constants/applicationCatalog'
import { useApplicantDataStore } from '@/stores/applications'

const router = useRouter()
const dataStore = useApplicantDataStore()

function hasPendingPayment(application = {}) {
  if (application.journey) {
    return application.journey.paymentRequired && !application.journey.paymentComplete
  }
  return String(application.status || '').toLowerCase().includes('payment')
}

function needsAttention(application = {}) {
  if (application.journey?.steps?.some((step) => step.state === 'attention')) {
    return true
  }
  const normalized = String(application.status || '').toLowerCase()
  return normalized.includes('draft') || normalized.includes('query') || normalized.includes('rejected')
}

function isCompleted(application = {}) {
  const normalized = String(application.status || '').toLowerCase()
  return normalized.includes('approved') || normalized.includes('issued')
}

function isUnderReview(application = {}) {
  const normalized = String(application.status || '').toLowerCase()
  if (isCompleted(application) || normalized.includes('rejected') || hasPendingPayment(application)) {
    return false
  }
  return normalized.includes('submitted') || normalized.includes('review') || normalized.includes('screen') || normalized.includes('vet')
}

onMounted(async () => {
  await dataStore.loadApplications()
})

const tableRows = computed(() => dataStore.applications)
const hasApplications = computed(() => tableRows.value.length > 0)

const metrics = computed(() => [
  {
    label: 'Total Applications',
    value: tableRows.value.length,
    detail: 'Applications created under this applicant account'
  },
  {
    label: 'Action Required',
    value: tableRows.value.filter((application) => needsAttention(application)).length,
    detail: 'Drafts, FCC queries, or rejected records needing your attention'
  },
  {
    label: 'Awaiting Payment',
    value: tableRows.value.filter((application) => hasPendingPayment(application)).length,
    detail: 'Applications waiting for fee payment or confirmation'
  },
  {
    label: 'Under Review',
    value: tableRows.value.filter((application) => isUnderReview(application)).length,
    detail: 'Applications already submitted and moving through FCC review'
  }
])

const nextActions = computed(() =>
  tableRows.value
    .filter((application) => needsAttention(application) || hasPendingPayment(application))
    .slice(0, 4)
)

function openDetails(row) {
  router.push(buildApplicationDetailsRoute(row.serviceKey, row.applicationId))
}

function openUpdate(row) {
  router.push(buildApplicationUpdateRoute(row.serviceKey, row.applicationId))
}
</script>

<template>
  <section class="min-w-0 space-y-6 overflow-x-hidden">
    <div class="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-blue-900 to-indigo-900 p-5 text-slate-100 shadow-panel md:p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="max-w-3xl">
          <p class="text-xs uppercase tracking-[0.22em] text-sky-200">Applications</p>
          <h2 class="mt-2 text-2xl font-semibold md:text-3xl">My Applications</h2>
          <p class="mt-2 text-sm text-slate-200">
            View every filed application, identify the next applicant action, and move directly to update, payment, submission, or certificate follow-up.
          </p>
        </div>
        <router-link :to="{ name: 'services' }">
          <el-button size="large" plain>Browse Services</el-button>
        </router-link>
      </div>

      <div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="metric in metrics"
          :key="metric.label"
          class="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"
        >
          <p class="text-xs uppercase tracking-wide text-slate-200">{{ metric.label }}</p>
          <p class="mt-1 text-3xl font-semibold">{{ metric.value }}</p>
          <p class="mt-1 text-xs text-sky-100">{{ metric.detail }}</p>
        </article>
      </div>
    </div>

    <article
      v-if="nextActions.length"
      class="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="font-semibold text-amber-900">Next Applicant Actions</h3>
          <p class="mt-1 text-sm text-amber-800">
            These applications still need a payment, a response, or another applicant step before they can move forward.
          </p>
        </div>
        <router-link :to="{ name: 'payments' }">
          <el-button plain>Open Payments</el-button>
        </router-link>
      </div>

      <div class="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <article
          v-for="application in nextActions"
          :key="application.applicationId"
          class="rounded-2xl border border-amber-200 bg-white p-4"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-500">{{ application.service }}</p>
              <p class="mt-1 text-sm font-semibold text-slate-900">{{ application.applicationId }}</p>
            </div>
            <StatusBadge :status="application.status" />
          </div>
          <p class="mt-3 text-sm text-slate-700">{{ application.journey?.nextAction || 'Review the latest FCC update for this application.' }}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <el-button plain @click="openDetails(application)">Open</el-button>
            <el-button
              type="primary"
              plain
              :disabled="application.journey && !application.journey.canEdit"
              @click="openUpdate(application)"
            >
              Update
            </el-button>
          </div>
        </article>
      </div>
    </article>

    <article v-if="hasApplications" class="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="mb-3 flex items-center justify-between">
        <div>
          <h3 class="font-semibold text-slate-900">Application Portfolio</h3>
          <p class="mt-1 text-sm text-slate-600">
            The table below keeps the next applicant step visible so payment, submission, status tracking, and certificate follow-up stay connected.
          </p>
        </div>
      </div>

      <ApplicationsTable
        :applications="tableRows"
        :loading="dataStore.loading"
        @open="openDetails"
        @edit="openUpdate"
      />
    </article>

    <article v-else class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <el-empty description="No applications are linked to this applicant account yet.">
        <router-link :to="{ name: 'services' }">
          <el-button type="primary">Start from Services Catalog</el-button>
        </router-link>
      </el-empty>
    </article>
  </section>
</template>
