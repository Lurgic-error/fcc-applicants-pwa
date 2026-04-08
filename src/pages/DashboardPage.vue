<script setup>
import { computed, onMounted } from 'vue'
import { FccStatusBadge as StatusBadge, FccPageHeader, FccStatCard, FccSectionHeader } from '@shared/design-system/components'
import { useApplicantDataStore } from '@/stores/applications'
import { useApplicantServiceCatalogStore } from '@/stores/serviceCatalog'
import OnboardingOverlay from '@/components/OnboardingOverlay.vue'
import ApplicationsInsightsPanel from '@/components/applications/ApplicationsInsightsPanel.vue'
import { OVERVIEW_INSIGHTS } from '@/constants/applicationInsights'
import ApplicantAnalytics from '@/components/ApplicantAnalytics.vue'

const dataStore = useApplicantDataStore()
const catalogStore = useApplicantServiceCatalogStore()

onMounted(() => {
  dataStore.loadDashboard()
  catalogStore.loadPublicServices()
})

const metrics = computed(() => {
  const dashboard = dataStore.dashboard || {}
  return [
    { label: 'Open Applications', value: dashboard.openApplications || 0 },
    { label: 'Pending Payments', value: dashboard.pendingPayments || 0 },
    { label: 'Issued Certificates', value: dashboard.issuedCertificates || 0 },
    { label: 'Unread Messages', value: dashboard.unreadMessages || 0 }
  ]
})

const recentApplications = computed(() => dataStore.dashboard?.recentApplications || [])
const announcements = computed(() => dataStore.dashboard?.announcements || [])
const certificates = computed(() => dataStore.dashboard?.certificates || [])
const payments = computed(() => dataStore.dashboard?.payments || [])
const applicationCounts = computed(() =>
  catalogStore.availableServices.map((service) => ({
    ...service,
    count: dataStore.applicationsByService(service.key).length
  }))
)
</script>

<template>
  <section class="dashboard-page">
    <FccPageHeader title="Dashboard" subtitle="Applications, payments, certificates, and FCC announcements at a glance." borderless />

    <div class="dashboard-metrics-grid" aria-live="polite">
      <FccStatCard
        v-for="metric in metrics"
        :key="metric.label"
        :label="metric.label"
        :value="metric.value"
        class="dashboard-metric-card"
        data-test="dashboard-metric"
      />
    </div>

    <div class="dashboard-panels-grid mt-6">
      <div class="dashboard-panel rounded-2xl border border-slate-200 p-4">
        <FccSectionHeader title="Services catalog">
          <template #actions>
            <router-link :to="{ name: 'services' }">
              <el-button link type="primary">Open</el-button>
            </router-link>
          </template>
        </FccSectionHeader>
        <ul class="space-y-2 text-sm">
          <li v-for="service in applicationCounts" :key="service.key" class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
            <span>{{ service.label }}</span>
            <span class="font-semibold">{{ service.count }}</span>
          </li>
        </ul>
      </div>

      <div class="dashboard-panel rounded-2xl border border-slate-200 p-4">
        <FccSectionHeader title="Payments overview">
          <template #actions>
            <router-link :to="{ name: 'payments' }">
              <el-button link type="primary">Open</el-button>
            </router-link>
          </template>
        </FccSectionHeader>
        <el-skeleton v-if="!payments.length && dataStore.loading" :rows="3" animated />
        <el-table v-else :data="payments.slice(0, 5)" size="small" empty-text="No payment records">
          <el-table-column prop="applicationId" label="Application" min-width="150" />
          <el-table-column prop="amount" label="Amount" min-width="120">
            <template #default="scope">{{ Number(scope.row.amount || 0).toLocaleString() }}</template>
          </el-table-column>
          <el-table-column prop="status" label="Status" min-width="120" />
        </el-table>
      </div>
    </div>

    <div class="dashboard-panels-grid mt-6">
      <div class="dashboard-panel rounded-2xl border border-slate-200 p-4">
        <FccSectionHeader title="Certificates overview">
          <template #actions>
            <router-link :to="{ name: 'certificates' }">
              <el-button link type="primary">Open</el-button>
            </router-link>
          </template>
        </FccSectionHeader>
        <el-skeleton v-if="!certificates.length && dataStore.loading" :rows="3" animated />
        <el-table v-else :data="certificates.slice(0, 5)" size="small" empty-text="No certificates yet">
          <el-table-column prop="certificateId" label="Certificate ID" min-width="160" />
          <el-table-column prop="service" label="Service" min-width="160" />
          <el-table-column prop="issuedAt" label="Issued" min-width="120" />
        </el-table>
      </div>

      <div class="dashboard-panel rounded-2xl border border-slate-200 p-4">
        <FccSectionHeader title="Announcements from FCC" />
        <ul class="mt-3 space-y-3">
          <li v-for="announcement in announcements" :key="announcement.id" class="rounded-xl bg-slate-50 p-3">
            <p class="font-medium">{{ announcement.title }}</p>
            <p class="mt-1 text-sm text-slate-600">{{ announcement.message }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ String(announcement.publishedAt || '').slice(0, 10) }}</p>
          </li>
          <li v-if="!announcements.length" class="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
            No announcements available.
          </li>
        </ul>
      </div>
    </div>

    <div class="dashboard-panel mt-6 rounded-2xl border border-slate-200 p-4">
      <FccSectionHeader title="Recent applications">
        <template #actions>
          <router-link :to="{ name: 'applications' }">
            <el-button link type="primary">View all</el-button>
          </router-link>
        </template>
      </FccSectionHeader>

      <el-table :data="recentApplications" v-loading="dataStore.loading" empty-text="No applications yet">
        <el-table-column prop="applicationId" label="Application ID" min-width="160" />
        <el-table-column prop="service" label="Service" min-width="220" />
        <el-table-column prop="workflowStageTitle" label="Workflow Stage" min-width="180" />
        <el-table-column prop="status" label="Status" min-width="140">
          <template #default="scope">
            <StatusBadge :status="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column prop="submittedAt" label="Submitted" min-width="120" />
      </el-table>
    </div>

    <article class="mt-6 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
      <FccSectionHeader title="Application Insights" />
      <ApplicationsInsightsPanel
        :summary="OVERVIEW_INSIGHTS.summary"
        :stats="OVERVIEW_INSIGHTS.stats"
        :trend="OVERVIEW_INSIGHTS.trend"
        :volume-series="OVERVIEW_INSIGHTS.volumeSeries"
        :status-breakdown="OVERVIEW_INSIGHTS.statusBreakdown"
        :progress-milestones="OVERVIEW_INSIGHTS.progressMilestones"
        :health-score="OVERVIEW_INSIGHTS.healthScore"
      />
    </article>

    <article class="mt-6 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
      <FccSectionHeader title="My Analytics" />
      <ApplicantAnalytics
        :applications="dataStore.applications"
        :payments="dataStore.payments"
        :certificates="dataStore.certificates"
      />
    </article>

    <OnboardingOverlay />
  </section>
</template>

<style scoped>
.dashboard-page {
  width: 100%;
}

.dashboard-metrics-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1rem;
  width: 100%;
}

.dashboard-panels-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1rem;
  width: 100%;
  align-items: stretch;
}

.dashboard-metric-card,
.dashboard-panel {
  min-width: 0;
  height: 100%;
}

.dashboard-metric-card {
  animation: fade-slide-up 0.4s ease both;
}

.dashboard-metric-card:nth-child(1) { animation-delay: 0ms; }
.dashboard-metric-card:nth-child(2) { animation-delay: 80ms; }
.dashboard-metric-card:nth-child(3) { animation-delay: 160ms; }
.dashboard-metric-card:nth-child(4) { animation-delay: 240ms; }

.dashboard-panel {
  animation: fade-slide-up 0.4s ease both;
  animation-delay: 320ms;
}

@keyframes fade-slide-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (min-width: 768px) {
  .dashboard-metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .dashboard-panels-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1536px) {
  .dashboard-metrics-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
