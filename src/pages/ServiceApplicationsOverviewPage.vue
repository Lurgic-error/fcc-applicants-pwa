<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ApplicationsTable from '@/components/applications/ApplicationsTable.vue'
import {
  buildApplicationCreateRoute,
  buildApplicationDetailsRoute,
  buildApplicationUpdateRoute
} from '@/constants/applicationCatalog'
import { getApplicationServiceExperience } from '@/constants/applicationServiceExperience'
import { getApplicationProcessStages } from '@/constants/applicationProcesses'
import { getCertificatePolicy } from '@/constants/applicationServiceRules'
import { TRADEMARK_REQUEST_TYPE_OPTIONS, labelTrademarkRequestType } from '@/constants/trademarkRecordation'
import { useApplicantDataStore } from '@/stores/applications'
import { useApplicantServiceCatalogStore } from '@/stores/serviceCatalog'

const props = defineProps({
  serviceKey: {
    type: String,
    required: true
  }
})

const router = useRouter()
const dataStore = useApplicantDataStore()
const catalogStore = useApplicantServiceCatalogStore()

const service = computed(() => catalogStore.serviceByKey(props.serviceKey))
const serviceExperience = computed(() => getApplicationServiceExperience(props.serviceKey))
const rows = computed(() => dataStore.applicationsByService(props.serviceKey))
const hasApplications = computed(() => rows.value.length > 0)
const isTrademarkService = computed(() => props.serviceKey === 'trademark-recordation')
const certificatePolicy = computed(() => getCertificatePolicy(props.serviceKey))

function hasPendingPayment(application = {}) {
  if (application.journey) {
    return application.journey.paymentRequired && !application.journey.paymentComplete
  }
  return String(application.status || '').toLowerCase().includes('payment')
}

function isCompleted(application = {}) {
  const normalized = String(application.status || '').toLowerCase()
  return normalized.includes('approved') || normalized.includes('issued')
}

const processRoadmap = computed(() =>
  getApplicationProcessStages(props.serviceKey).map((stage, index) => ({
    ...stage,
    order: index + 1
  }))
)

const serviceStats = computed(() => {
  const total = rows.value.length
  const awaitingPayment = rows.value.filter((row) => hasPendingPayment(row)).length
  const completed = rows.value.filter((row) => isCompleted(row)).length
  const active = Math.max(0, total - completed)

  return [
    { label: 'Filed Applications', value: total, detail: 'Applications created for this service' },
    { label: 'Awaiting Payment', value: awaitingPayment, detail: 'Still waiting on applicant payment action' },
    { label: 'Active Cases', value: active, detail: 'Open applications moving through FCC review' },
    {
      label: 'Certificate Policy',
      value: certificatePolicy.value.available ? 'Available' : 'Not issued',
      detail: certificatePolicy.value.available
        ? certificatePolicy.value.validityMonths
          ? `${certificatePolicy.value.validityMonths} month validity when approved`
          : 'Certificate is issued without expiry when approved'
        : 'Applicants receive a decision or notification instead of a certificate'
    }
  ]
})

const trademarkRequestSummary = computed(() => {
  if (!isTrademarkService.value) {
    return []
  }

  return TRADEMARK_REQUEST_TYPE_OPTIONS.map((item) => {
    const count = rows.value.filter((row) => {
      const requestType = row.requestType || row.trademarkRecordation?.requestType
      return requestType === item.key
    }).length

    return {
      ...item,
      count
    }
  })
})

onMounted(async () => {
  await Promise.all([
    dataStore.loadApplications(),
    catalogStore.loadPublicServices()
  ])
})

function openDetails(row) {
  router.push(buildApplicationDetailsRoute(row.serviceKey, row.applicationId))
}

function openUpdate(row) {
  router.push(buildApplicationUpdateRoute(row.serviceKey, row.applicationId))
}

function startApplication(requestType = '') {
  const routeTarget = buildApplicationCreateRoute(props.serviceKey)
  if (isTrademarkService.value && requestType) {
    routeTarget.query = { requestType }
  }
  router.push(routeTarget)
}
</script>

<template>
  <section class="min-w-0 space-y-6 overflow-x-hidden">
    <div class="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-blue-900 to-indigo-900 p-5 text-slate-100 shadow-panel md:p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="max-w-2xl">
          <p class="text-xs uppercase tracking-[0.2em] text-sky-200">Application Service</p>
          <h2 class="mt-2 text-2xl font-semibold md:text-3xl">{{ service.label }}</h2>
          <p class="mt-2 text-sm text-slate-200">{{ service.description }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <router-link :to="{ name: 'applications' }">
            <el-button plain size="large">My Applications</el-button>
          </router-link>
          <router-link :to="{ name: 'service-preparation', params: { serviceKey } }">
            <el-button plain size="large">
              <i class="fa-solid fa-list-check mr-2" />Preparation Checklist
            </el-button>
          </router-link>
          <el-dropdown v-if="isTrademarkService" trigger="click">
            <el-button type="primary" size="large">New {{ service.label }}</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="item in trademarkRequestSummary"
                  :key="item.key"
                  @click="startApplication(item.key)"
                >
                  {{ item.shortLabel }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <router-link v-else :to="buildApplicationCreateRoute(service.key)">
            <el-button type="primary" size="large">New {{ service.label }}</el-button>
          </router-link>
        </div>
      </div>

      <div class="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="item in serviceStats"
          :key="item.label"
          class="min-w-0 rounded-2xl border border-sky-200/20 bg-white/10 p-4 backdrop-blur"
        >
          <p class="text-xs uppercase tracking-wide text-slate-200">{{ item.label }}</p>
          <p class="mt-1 text-3xl font-semibold">{{ item.value }}</p>
          <p class="mt-1 text-xs text-sky-100">{{ item.detail }}</p>
        </article>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
      <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="font-semibold text-slate-900">Choose This Service When</h3>
            <p class="mt-1 text-sm text-slate-600">
              A quick decision guide for applicants before they open the filing wizard.
            </p>
          </div>
          <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {{ serviceExperience.workflowLabel }}
          </span>
        </div>

        <p class="mt-4 text-sm font-medium leading-relaxed text-slate-800">
          {{ serviceExperience.bestFor }}
        </p>

        <ul class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <li
            v-for="point in serviceExperience.decisionPoints"
            :key="point"
            class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"
          >
            {{ point }}
          </li>
        </ul>

        <p class="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          {{ serviceExperience.goodToKnow }}
        </p>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 class="font-semibold text-slate-900">Prepare Before You Start</h3>
        <p class="mt-1 text-sm text-slate-600">
          These checkpoints reduce applicant back-and-forth once the filing is in progress.
        </p>

        <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="rounded-2xl bg-slate-50 p-4">
            <p class="text-xs uppercase tracking-wide text-slate-500">Fee model</p>
            <p class="mt-2 text-sm font-semibold text-slate-900">{{ serviceExperience.feeLabel }}</p>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4">
            <p class="text-xs uppercase tracking-wide text-slate-500">Outcome</p>
            <p class="mt-2 text-sm font-semibold text-slate-900">{{ serviceExperience.outcomeLabel }}</p>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
            <p class="text-xs uppercase tracking-wide text-slate-500">Form scope</p>
            <p class="mt-2 text-sm font-semibold text-slate-900">{{ serviceExperience.requiredFieldLabel }}</p>
          </div>
        </div>

        <ul class="mt-4 space-y-3">
          <li
            v-for="item in serviceExperience.preparationChecklist"
            :key="item"
            class="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
          >
            <span class="mt-1 h-2 w-2 shrink-0 rounded-full bg-fcc-brand" />
            <span>{{ item }}</span>
          </li>
        </ul>
      </article>
    </div>

    <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="mb-3 flex items-center justify-between">
        <div>
          <h3 class="font-semibold text-slate-900">How {{ service.label }} Works</h3>
          <p class="mt-1 text-sm text-slate-600">
            The service below is driven from the shared application catalog. Applicants can create, pay, submit, track updates, and receive the final outcome from the same reusable workflow.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <article
          v-for="step in processRoadmap"
          :key="step.key"
          class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
        >
          <p class="text-xs uppercase tracking-wide text-slate-500">Step {{ step.order }}</p>
          <p class="mt-2 text-sm font-semibold text-slate-900">{{ step.title }}</p>
          <p class="mt-1 text-xs text-slate-600">Owner: {{ step.actor }}</p>
        </article>
      </div>
    </article>

    <article v-if="isTrademarkService" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="font-semibold text-slate-900">Trademark Request Types</h3>
        <span class="text-xs text-slate-500">Create the right filing directly</span>
      </div>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <button
          v-for="item in trademarkRequestSummary"
          :key="item.key"
          type="button"
          class="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-sky-300 hover:bg-sky-50"
          @click="startApplication(item.key)"
        >
          <p class="text-xs uppercase tracking-wide text-slate-500">{{ labelTrademarkRequestType(item.key) }}</p>
          <p class="mt-1 text-2xl font-semibold text-slate-900">{{ item.count }}</p>
          <p class="mt-1 text-xs text-slate-600">{{ item.description }}</p>
        </button>
      </div>
    </article>

    <article v-if="hasApplications" class="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="mb-3 flex items-center justify-between">
        <div>
          <h3 class="font-semibold text-slate-900">{{ service.label }} Applications</h3>
          <p class="mt-1 text-sm text-slate-600">
            Open the application to pay, submit, update responses, or continue tracking the FCC status.
          </p>
        </div>
      </div>

      <ApplicationsTable
        :applications="rows"
        :loading="dataStore.loading"
        @open="openDetails"
        @edit="openUpdate"
      />
    </article>

    <article v-else class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <el-empty :description="`No ${service.label.toLowerCase()} applications are linked to this account yet.`">
        <router-link :to="buildApplicationCreateRoute(service.key)">
          <el-button type="primary">Start {{ service.label }}</el-button>
        </router-link>
      </el-empty>
    </article>
  </section>
</template>
