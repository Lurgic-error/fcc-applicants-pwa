<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { buildServiceOverviewRoute, buildApplicationCreateRoute } from '@/constants/applicationCatalog'
import { getApplicationServiceExperience } from '@/constants/applicationServiceExperience'
import { useApplicantServiceCatalogStore } from '@/stores/serviceCatalog'

const catalogStore = useApplicantServiceCatalogStore()
const router = useRouter()

onMounted(() => {
  catalogStore.loadPublicServices()
})

const services = computed(() => catalogStore.availableServices)
const serviceCards = computed(() =>
  services.value.map((service) => ({
    ...service,
    experience: getApplicationServiceExperience(service.key)
  }))
)

// ── Decision Assistant ────────────────────────────────────────────────────────

const selectedService = ref(null)

const serviceGuideIcons = Object.freeze({
  'trademark-recordation': 'Shield',
  'merger-clearance': 'Building',
  'sfcc-registration': 'FileText',
  'legal-opinion': 'Scale',
  exemption: 'BadgeCheck'
})

const serviceGuides = computed(() =>
  Object.fromEntries(
    serviceCards.value.map((service) => [
      service.key,
      {
        name: service.label,
        icon: serviceGuideIcons[service.key] || 'FileText',
        description: service.description,
        bestFor: service.experience.bestFor,
        feeEstimate: service.experience.feeLabel,
        documents: service.experience.preparationChecklist,
        timeline: service.experience.workflowLabel,
        outcome: service.experience.outcomeLabel,
        goodToKnow: service.experience.goodToKnow
      }
    ])
  )
)

const serviceCardMeta = [
  { key: 'trademark-recordation', colorClass: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800', iconColorClass: 'text-sky-600 dark:text-sky-400', accentClass: 'text-sky-600 dark:text-sky-400' },
  { key: 'merger-clearance',      colorClass: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800', iconColorClass: 'text-violet-600 dark:text-violet-400', accentClass: 'text-violet-600 dark:text-violet-400' },
  { key: 'sfcc-registration',     colorClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800', iconColorClass: 'text-emerald-600 dark:text-emerald-400', accentClass: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'legal-opinion',         colorClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800', iconColorClass: 'text-amber-600 dark:text-amber-400', accentClass: 'text-amber-600 dark:text-amber-400' },
  { key: 'exemption',             colorClass: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800', iconColorClass: 'text-rose-600 dark:text-rose-400', accentClass: 'text-rose-600 dark:text-rose-400' },
]

const selectedMeta = computed(() =>
  serviceCardMeta.find((m) => m.key === selectedService.value) || serviceCardMeta[0]
)

const selectedGuide = computed(() =>
  selectedService.value ? serviceGuides.value[selectedService.value] : null
)

function selectService(key) {
  selectedService.value = selectedService.value === key ? null : key
}

function startApplication() {
  if (!selectedService.value) return
  router.push(buildApplicationCreateRoute(selectedService.value))
}
</script>

<template>
  <section>
    <!-- Hero Section -->
    <div class="home-hero rounded-3xl p-8 md:p-12 shadow-panel">
      <p class="text-sm font-semibold uppercase tracking-[0.2em] text-fcc-brand">Fair Competition Commission</p>
      <h1 class="mt-3 text-4xl font-bold text-fcc-ink dark:text-slate-100 md:text-5xl">
        Submit and track FCC service requests in one place.
      </h1>
      <p class="mt-5 max-w-2xl text-base text-slate-600 dark:text-slate-300 md:text-lg">
        This dedicated portal gives applicants a clean workflow for filing applications, receiving requests for
        clarification, and monitoring payment status.
      </p>
      <div class="mt-8 flex flex-wrap gap-3">
        <router-link to="/auth/register">
          <el-button type="primary" size="large">Create Applicant Account</el-button>
        </router-link>
        <router-link to="/auth/login">
          <el-button size="large">Sign In</el-button>
        </router-link>
      </div>
    </div>

    <!-- Decision Assistant -->
    <div class="mt-10">
      <h2 class="text-2xl font-bold text-fcc-ink dark:text-slate-100">Decision Assistant</h2>
      <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Not sure where to start? Select a service below to see eligibility requirements, required documents, fee estimates, and processing timelines before you begin.
      </p>

      <!-- Service selector cards -->
      <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <button
          v-for="meta in serviceCardMeta"
          :key="meta.key"
          type="button"
          @click="selectService(meta.key)"
          :class="[
            'group relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-fcc-brand',
            selectedService === meta.key
              ? meta.colorClass + ' shadow-md ring-2 ring-fcc-brand/40'
              : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 hover:border-fcc-brand hover:shadow-sm',
          ]"
        >
          <!-- Icon -->
          <span :class="['flex h-9 w-9 items-center justify-center rounded-xl', selectedService === meta.key ? meta.iconColorClass + ' bg-white/60 dark:bg-black/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-fcc-brand/10 group-hover:text-fcc-brand']">
            <!-- Shield -->
            <svg v-if="serviceGuides[meta.key].icon === 'Shield'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <!-- Building -->
            <svg v-if="serviceGuides[meta.key].icon === 'Building'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
            <!-- FileText -->
            <svg v-if="serviceGuides[meta.key].icon === 'FileText'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <!-- Scale (legal opinion) -->
            <svg v-if="serviceGuides[meta.key].icon === 'Scale'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1.5m0 0l3.75 7.5m-3.75-7.5L8.25 12M12 4.5C8.25 4.5 5.25 7.5 5.25 11.25m13.5 0c0-3.75-3-6.75-6.75-6.75M3 17.25l4.5-9 4.5 9M12 17.25l4.5-9 4.5 9M3 17.25h6m12 0h-6m-6 0v3m0-3h.008v.008H12v-.008z" />
            </svg>
            <!-- BadgeCheck (exemption) -->
            <svg v-if="serviceGuides[meta.key].icon === 'BadgeCheck'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-.723 3.065 3.745 3.745 0 01-3.065.723 3.745 3.745 0 01-3.068 1.593c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.065-.723 3.745 3.745 0 01-.723-3.065A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 01.723-3.065 3.745 3.745 0 013.065-.723A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.065.723 3.745 3.745 0 01.723 3.065A3.745 3.745 0 0121 12z" />
            </svg>
          </span>

          <div>
            <p :class="['text-sm font-semibold leading-snug', selectedService === meta.key ? meta.accentClass : 'text-fcc-ink dark:text-slate-100 group-hover:text-fcc-brand']">
              {{ serviceGuides[meta.key].name }}
            </p>
            <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-snug">{{ serviceGuides[meta.key].description }}</p>
          </div>

          <!-- Selected indicator dot -->
          <span
            v-if="selectedService === meta.key"
            :class="['absolute right-3 top-3 h-2 w-2 rounded-full', meta.accentClass.replace('text-', 'bg-')]"
          />
        </button>
      </div>

      <!-- Info panel (shown when a service is selected) -->
      <transition name="panel-slide">
        <div
          v-if="selectedGuide"
          :class="['mt-5 rounded-2xl border p-6 shadow-sm', selectedMeta.colorClass]"
        >
          <div class="flex items-center gap-3">
            <span :class="['text-lg font-bold', selectedMeta.accentClass]">{{ selectedGuide.name }}</span>
            <span class="rounded-full bg-white/70 dark:bg-black/20 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-white/50">
              Pre-application guide
            </span>
          </div>

          <div class="mt-5 grid gap-5 sm:grid-cols-2">
            <!-- Best fit -->
            <div class="rounded-xl bg-white/70 dark:bg-slate-900/60 p-4 border border-white/60 dark:border-slate-700/60">
              <p class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Best For
              </p>
              <p class="mt-2 text-sm text-slate-700 dark:text-slate-200">{{ selectedGuide.bestFor }}</p>
            </div>

            <!-- Fee Estimate -->
            <div class="rounded-xl bg-white/70 dark:bg-slate-900/60 p-4 border border-white/60 dark:border-slate-700/60">
              <p class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Fee Estimate
              </p>
              <p class="mt-2 text-sm text-slate-700 dark:text-slate-200">{{ selectedGuide.feeEstimate }}</p>
            </div>

            <!-- Required Documents -->
            <div class="rounded-xl bg-white/70 dark:bg-slate-900/60 p-4 border border-white/60 dark:border-slate-700/60">
              <p class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
                Required Documents
              </p>
              <ul class="mt-2 space-y-1.5">
                <li
                  v-for="(doc, i) in selectedGuide.documents"
                  :key="i"
                  class="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200"
                >
                  <svg :class="['mt-0.5 h-4 w-4 shrink-0', selectedMeta.accentClass]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {{ doc }}
                </li>
              </ul>
            </div>

            <!-- Workflow + Outcome -->
            <div class="flex flex-col gap-4">
              <div class="rounded-xl bg-white/70 dark:bg-slate-900/60 p-4 border border-white/60 dark:border-slate-700/60">
                <p class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Workflow Scope
                </p>
                <p class="mt-2 text-sm text-slate-700 dark:text-slate-200">{{ selectedGuide.timeline }}</p>
              </div>
              <div class="rounded-xl bg-white/70 dark:bg-slate-900/60 p-4 border border-white/60 dark:border-slate-700/60">
                <p class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                  Expected Outcome
                </p>
                <p class="mt-2 text-sm text-slate-700 dark:text-slate-200">{{ selectedGuide.outcome }}</p>
              </div>
            </div>
          </div>

          <p class="mt-5 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 text-sm text-slate-700 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200">
            {{ selectedGuide.goodToKnow }}
          </p>

          <!-- Start Application CTA -->
          <div class="mt-6 flex items-center gap-3">
            <el-button type="primary" size="large" @click="startApplication">
              Start Application &rarr;
            </el-button>
            <router-link :to="buildServiceOverviewRoute(selectedService)">
              <el-button size="large">View Service Overview</el-button>
            </router-link>
          </div>
        </div>
      </transition>
    </div>

    <!-- Services Overview Grid -->
    <div class="mt-10">
      <h2 class="text-2xl font-bold text-fcc-ink dark:text-slate-100">Our Services</h2>
      <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">Apply for any of the following FCC regulatory services through this portal.</p>
      <div class="mt-6 grid gap-4" style="grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr))">
        <router-link
          v-for="service in serviceCards"
          :key="service.key"
          :to="buildServiceOverviewRoute(service.key)"
          class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-fcc-brand hover:shadow-md no-underline dark:border-slate-700 dark:bg-slate-900"
        >
          <h3 class="text-lg font-semibold text-fcc-ink dark:text-slate-100 group-hover:text-fcc-brand">{{ service.label }}</h3>
          <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">{{ service.description }}</p>

          <div class="mt-4 flex flex-wrap gap-2 text-[11px] font-medium">
            <span class="rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {{ service.experience.feeLabel }}
            </span>
            <span class="rounded-full bg-sky-50 px-3 py-1 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200">
              {{ service.experience.workflowLabel }}
            </span>
            <span class="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
              {{ service.experience.outcomeChipLabel }}
            </span>
          </div>

          <p class="mt-4 text-sm font-medium text-slate-800 dark:text-slate-100">
            {{ service.experience.bestFor }}
          </p>

          <ul class="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li
              v-for="item in service.experience.preparationChecklist.slice(0, 2)"
              :key="item"
              class="flex items-start gap-2"
            >
              <span class="mt-1 h-1.5 w-1.5 rounded-full bg-fcc-brand" />
              <span>{{ item }}</span>
            </li>
          </ul>

          <p class="mt-4 text-xs text-slate-500 dark:text-slate-400">{{ service.experience.requiredFieldLabel }}</p>
          <p class="mt-3 text-xs font-semibold uppercase tracking-wide text-fcc-brand">Review Service &rarr;</p>
        </router-link>
      </div>
    </div>

    <!-- How It Works Stepper -->
    <div class="mt-12">
      <h2 class="text-2xl font-bold text-fcc-ink dark:text-slate-100">How It Works</h2>
      <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">Follow these four simple steps to complete your application.</p>
      <div class="mt-6 grid gap-6 md:grid-cols-4">
        <div class="relative rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-5 text-center">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-fcc-brand/10 text-fcc-brand text-xl font-bold">
            1
          </div>
          <h3 class="mt-4 text-base font-semibold text-fcc-ink dark:text-slate-100">Register</h3>
          <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">Create your applicant account with a valid email and business details.</p>
        </div>
        <div class="relative rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-5 text-center">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-fcc-brand/10 text-fcc-brand text-xl font-bold">
            2
          </div>
          <h3 class="mt-4 text-base font-semibold text-fcc-ink dark:text-slate-100">Apply</h3>
          <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">Select a service and complete the guided application wizard with required documents.</p>
        </div>
        <div class="relative rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-5 text-center">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-fcc-brand/10 text-fcc-brand text-xl font-bold">
            3
          </div>
          <h3 class="mt-4 text-base font-semibold text-fcc-ink dark:text-slate-100">Pay</h3>
          <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">Make the required payment through integrated GePG payment channels.</p>
        </div>
        <div class="relative rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-5 text-center">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-fcc-brand/10 text-fcc-brand text-xl font-bold">
            4
          </div>
          <h3 class="mt-4 text-base font-semibold text-fcc-ink dark:text-slate-100">Receive Certificate</h3>
          <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">Track progress in real-time and download your certificate once approved.</p>
        </div>
      </div>
    </div>

    <!-- Trust Indicators -->
    <div class="mt-12">
      <div class="grid gap-4 md:grid-cols-3">
        <div class="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-5 text-center">
          <div class="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
            <svg class="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 class="mt-3 font-semibold text-fcc-ink dark:text-slate-100">Government Authority</h3>
          <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Official FCC regulatory portal under the Fair Competition Act.</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-5 text-center">
          <div class="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
            <svg class="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="mt-3 font-semibold text-fcc-ink dark:text-slate-100">Fast Processing</h3>
          <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Applications are processed within statutory timelines with real-time status updates.</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-5 text-center">
          <div class="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-purple-50">
            <svg class="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 class="mt-3 font-semibold text-fcc-ink dark:text-slate-100">Secure Submission</h3>
          <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">All data is encrypted and securely stored in compliance with data protection regulations.</p>
        </div>
      </div>
    </div>

    <!-- What Applicants Get (preserved from original) -->
    <div class="mt-12 rounded-3xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-5 shadow-panel">
      <h2 class="text-xl font-semibold text-fcc-ink dark:text-slate-100">What applicants get</h2>
      <ul class="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
        <li class="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">Apply for Trademark Recordation, Merger Clearance, SFCC Registration, Legal Opinion, and Exemption.</li>
        <li class="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">Dedicated overview pages for each application service with filtered tracking.</li>
        <li class="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">Creation and update wizard pages for each submitted application type.</li>
        <li class="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">Live workflow stage tracking, payment visibility, and secure profile management.</li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.home-hero {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--fcc-border);
  animation: hero-fade-in 0.6s ease;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.12), transparent 32%),
    radial-gradient(circle at top right, rgba(15, 76, 129, 0.14), transparent 36%),
    linear-gradient(145deg, var(--fcc-bg-surface) 0%, var(--fcc-bg-surface-muted) 100%);
}

:global(:root[data-theme='dark']) .home-hero {
  background:
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 32%),
    radial-gradient(circle at top right, rgba(15, 76, 129, 0.22), transparent 36%),
    linear-gradient(145deg, var(--fcc-bg-elevated) 0%, var(--fcc-bg-surface) 100%);
}

@keyframes hero-fade-in {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
