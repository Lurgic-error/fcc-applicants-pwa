<script setup>
import { computed, onMounted } from 'vue'
import {
  buildApplicationCreateRoute,
  buildServiceOverviewRoute,
  resolveApplicationServiceKeyFromText
} from '@/constants/applicationCatalog'
import { getCertificatePolicy } from '@/constants/applicationServiceRules'
import { useApplicantDataStore } from '@/stores/applications'
import { useApplicantServiceCatalogStore } from '@/stores/serviceCatalog'

const dataStore = useApplicantDataStore()
const catalogStore = useApplicantServiceCatalogStore()

const applicantLifecycle = [
  {
    label: 'Create application',
    detail: 'Choose a service from the catalog and start a new filing with the right requirements.'
  },
  {
    label: 'Pay application fee',
    detail: 'Generate or use the issued control number, then complete payment for the application.'
  },
  {
    label: 'Submit to FCC',
    detail: 'Finalize and submit the application once the required payment and attachments are in place.'
  },
  {
    label: 'Track status and queries',
    detail: 'Monitor acknowledgements, FCC requests, approvals, rejections, and every status update in one place.'
  },
  {
    label: 'Receive outcome',
    detail: 'Download certificates for approved services or receive rejection notification where applicable.'
  }
]

function hasPendingPayment(application = {}) {
  if (application.journey) {
    return application.journey.paymentRequired && !application.journey.paymentComplete
  }
  return String(application.status || '').toLowerCase().includes('payment')
}

function isCompletedOutcome(application = {}) {
  const normalized = String(application.status || '').toLowerCase()
  return normalized.includes('approved') || normalized.includes('issued')
}

function isRejectedOutcome(application = {}) {
  return String(application.status || '').toLowerCase().includes('rejected')
}

onMounted(async () => {
  await Promise.all([
    dataStore.loadDashboard(),
    catalogStore.loadPublicServices()
  ])
})

const catalogServices = computed(() => catalogStore.availableServices)

const portfolioMetrics = computed(() => [
  {
    label: 'Service Catalog',
    value: catalogServices.value.length,
    detail: 'Applicant services available for filing'
  },
  {
    label: 'My Applications',
    value: dataStore.applications.length,
    detail: 'Applications already linked to this account'
  },
  {
    label: 'Pending Payments',
    value: dataStore.payments.filter((payment) => Number(payment.balance || 0) > 0).length,
    detail: 'Payment obligations still awaiting settlement'
  },
  {
    label: 'Issued Certificates',
    value: dataStore.certificates.length,
    detail: 'Certificates already available for download'
  }
])

const serviceCards = computed(() =>
  catalogServices.value.map((service) => {
    const applications = dataStore.applicationsByService(service.key)
    const policy = getCertificatePolicy(service.key)
    const pendingPayments = applications.filter((application) => hasPendingPayment(application)).length
    const completed = applications.filter((application) => isCompletedOutcome(application)).length
    const rejected = applications.filter((application) => isRejectedOutcome(application)).length
    const active = Math.max(0, applications.length - completed - rejected)
    const certificates = dataStore.certificates.filter((certificate) => {
      const certificateServiceKey = certificate.relatedServiceKey || resolveApplicationServiceKeyFromText(certificate.service)
      return certificateServiceKey === service.key
    }).length

    return {
      ...service,
      applications: applications.length,
      active,
      pendingPayments,
      completed,
      rejected,
      certificates,
      certificatePolicyText: policy.available
        ? policy.validityMonths
          ? `${policy.validityMonths}-month certificate validity`
          : 'Certificate issued without expiry'
        : 'No certificate issued for this service'
    }
  })
)
</script>

<template>
  <section class="min-w-0 space-y-6 overflow-x-hidden">
    <div class="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-sky-900 to-cyan-900 p-5 text-slate-100 shadow-panel md:p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="max-w-3xl">
          <p class="text-xs uppercase tracking-[0.22em] text-cyan-200">Services</p>
          <h2 class="mt-2 text-2xl font-semibold md:text-3xl">Application Catalog</h2>
          <p class="mt-2 text-sm text-slate-200">
            Start a new FCC filing, understand the expected applicant journey, and open the service workspace for each application type.
          </p>
        </div>
        <router-link :to="{ name: 'applications' }">
          <el-button size="large" plain>Open My Applications</el-button>
        </router-link>
      </div>

      <div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="metric in portfolioMetrics"
          :key="metric.label"
          class="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"
        >
          <p class="text-xs uppercase tracking-wide text-slate-200">{{ metric.label }}</p>
          <p class="mt-1 text-3xl font-semibold">{{ metric.value }}</p>
          <p class="mt-1 text-xs text-cyan-100">{{ metric.detail }}</p>
        </article>
      </div>
    </div>

    <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="font-semibold text-slate-900">Applicant Journey</h3>
          <p class="mt-1 text-sm text-slate-600">
            Every service follows the same applicant-facing path: create, pay, submit, track updates, then receive a decision or certificate.
          </p>
        </div>
        <router-link :to="{ name: 'payments' }">
          <el-button plain>Review Payments</el-button>
        </router-link>
      </div>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <article
          v-for="step in applicantLifecycle"
          :key="step.label"
          class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
        >
          <p class="text-xs uppercase tracking-wide text-slate-500">{{ step.label }}</p>
          <p class="mt-2 text-sm text-slate-700">{{ step.detail }}</p>
        </article>
      </div>
    </article>

    <div class="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="service in serviceCards"
        :key="service.key"
        class="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs uppercase tracking-wide text-slate-500">Application Service</p>
            <h3 class="mt-1 text-lg font-semibold text-slate-900">{{ service.label }}</h3>
          </div>
          <span class="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
            {{ service.applications }} filed
          </span>
        </div>

        <p class="mt-3 text-sm text-slate-600">{{ service.description }}</p>
        <p class="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">Outcome policy</p>
        <p class="mt-1 text-sm text-slate-700">{{ service.certificatePolicyText }}</p>

        <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div class="rounded-xl bg-slate-50 p-3">
            <p class="text-xs uppercase tracking-wide text-slate-500">Active</p>
            <p class="mt-1 text-xl font-semibold text-slate-900">{{ service.active }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 p-3">
            <p class="text-xs uppercase tracking-wide text-slate-500">Pending Payment</p>
            <p class="mt-1 text-xl font-semibold text-slate-900">{{ service.pendingPayments }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 p-3">
            <p class="text-xs uppercase tracking-wide text-slate-500">Completed</p>
            <p class="mt-1 text-xl font-semibold text-slate-900">{{ service.completed }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 p-3">
            <p class="text-xs uppercase tracking-wide text-slate-500">Certificates</p>
            <p class="mt-1 text-xl font-semibold text-slate-900">{{ service.certificates }}</p>
          </div>
        </div>

        <p
          v-if="service.rejected"
          class="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          {{ service.rejected }} application{{ service.rejected === 1 ? '' : 's' }} ended in rejection. Applicants can still review the decision and file a new request where allowed.
        </p>

        <div class="mt-4 flex flex-wrap gap-2">
          <router-link :to="buildServiceOverviewRoute(service.key)">
            <el-button plain>Open Service</el-button>
          </router-link>
          <router-link :to="buildApplicationCreateRoute(service.key)">
            <el-button type="primary">Start Application</el-button>
          </router-link>
        </div>
      </article>
    </div>
  </section>
</template>
