<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FccStatusBadge as StatusBadge, FccPageHeader } from '@shared/design-system/components'
import { getApplicationServiceByKey, buildApplicationUpdateRoute } from '@/constants/applicationCatalog'
import { assessApplicationCompleteness } from '@/services/applicationCompleteness'
import { useApplicantDataStore } from '@/stores/applications'

const DRAFT_KEY_PREFIX = 'fcc_wizard_draft_'

const route = useRoute()
const router = useRouter()
const dataStore = useApplicantDataStore()

const loading = ref(false)
const application = ref(null)
const formData = ref(null)

const serviceKey = computed(() => String(route.params.serviceKey || ''))
const applicationId = computed(() => String(route.params.id || ''))
const service = computed(() => getApplicationServiceByKey(serviceKey.value))
const isEditingMode = computed(() => Boolean(route.query.editing))
const returnStepIndex = computed(() => Number(route.query.step || 0))

const completeness = computed(() => {
  const data = formData.value || application.value?.raw || {}
  return assessApplicationCompleteness(serviceKey.value, data)
})

const isSubmitted = computed(() => {
  if (isEditingMode.value) return false
  const status = String(application.value?.status || '').toLowerCase()
  return status !== 'draft' && status !== ''
})

const pageTitle = computed(() =>
  isEditingMode.value ? `Preview — ${service.value?.label || 'Application'}` : service.value?.label || 'Application'
)

const pageSubtitle = computed(() => {
  if (isEditingMode.value) {
    return completeness.value.complete
      ? 'All required fields are complete. You may submit this application.'
      : `${completeness.value.totalRequired - completeness.value.totalProvided} required fields still missing across ${completeness.value.sections.filter((s) => s.status !== 'complete').length} sections.`
  }
  return `Application ${applicationId.value}`
})

function getFieldValue(data, path) {
  if (!data || !path) return undefined
  const keys = path.split('.')
  let current = data
  for (const key of keys) {
    if (current == null) return undefined
    current = current[key]
  }
  return current
}

function isProvided(value) {
  if (value == null) return false
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return true
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return Boolean(value)
}

function formatValue(value) {
  if (value == null || value === '') return null
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return value.toLocaleString()
  if (Array.isArray(value)) return value.length ? value.join(', ') : null
  return String(value)
}

function printApplication() {
  window.print()
}

function goBackToWizard() {
  if (applicationId.value && applicationId.value !== 'draft') {
    router.push({
      ...buildApplicationUpdateRoute(serviceKey.value, applicationId.value),
      query: { step: returnStepIndex.value }
    })
  } else {
    router.push({
      name: 'application-create',
      params: { serviceKey: serviceKey.value },
      query: { step: returnStepIndex.value }
    })
  }
}

function editSection(stepIndex) {
  if (applicationId.value && applicationId.value !== 'draft') {
    router.push({
      ...buildApplicationUpdateRoute(serviceKey.value, applicationId.value),
      query: { step: stepIndex }
    })
  } else {
    router.push({
      name: 'application-create',
      params: { serviceKey: serviceKey.value },
      query: { step: stepIndex }
    })
  }
}

const activeSectionKey = ref('')

function scrollToSection(key) {
  activeSectionKey.value = key
  const el = document.getElementById(`preview-section-${key}`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(async () => {
  loading.value = true
  try {
    if (isEditingMode.value) {
      const draftRaw = localStorage.getItem(`${DRAFT_KEY_PREFIX}${serviceKey.value}`)
      if (draftRaw) {
        formData.value = JSON.parse(draftRaw)
      }
    }

    if (applicationId.value && applicationId.value !== 'draft') {
      application.value = await dataStore.getApplicationById(applicationId.value, { serviceKey: serviceKey.value })
      if (!formData.value) {
        formData.value = application.value?.raw || {}
      }
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="preview-page">
    <FccPageHeader :title="pageTitle" :subtitle="pageSubtitle" borderless>
      <template #actions>
        <el-button v-if="isEditingMode" plain @click="goBackToWizard">
          <i class="fa-solid fa-arrow-left mr-2" />Back to Wizard
        </el-button>
        <el-button plain @click="printApplication">
          <i class="fa-solid fa-print mr-2" />Print / Save PDF
        </el-button>
      </template>
    </FccPageHeader>

    <el-skeleton v-if="loading" class="mt-6" :rows="12" animated />

    <template v-else>
      <div
        v-if="isEditingMode"
        class="mt-4 rounded-2xl border p-4"
        :class="completeness.complete
          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
          : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'"
      >
        <div class="flex items-center gap-3">
          <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              class="h-full rounded-full transition-all"
              :class="completeness.complete ? 'bg-green-500' : 'bg-amber-500'"
              :style="{ width: `${completeness.percentage}%` }"
            />
          </div>
          <span class="text-sm font-semibold" :class="completeness.complete ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'">
            {{ completeness.percentage }}%
          </span>
        </div>
        <p class="mt-2 text-sm" :class="completeness.complete ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'">
          {{ completeness.complete
            ? 'All required fields are provided. This application is ready to submit.'
            : `${completeness.totalRequired - completeness.totalProvided} required fields remaining.`
          }}
        </p>
      </div>

      <div v-if="!isEditingMode && application" class="mt-4 flex flex-wrap items-center gap-3">
        <StatusBadge :status="application.status" />
        <span v-if="application.workflowStageTitle" class="text-sm text-slate-600 dark:text-slate-300">
          Stage: {{ application.workflowStageTitle }}
        </span>
        <span v-if="application.submittedAt" class="text-sm text-slate-500 dark:text-slate-400">
          Submitted: {{ application.submittedAt }}
        </span>
      </div>

      <div class="mt-6 flex gap-6">
        <nav class="hidden w-64 shrink-0 lg:block" aria-label="Preview sections">
          <ul class="sticky top-0 space-y-1">
            <li
              v-for="section in completeness.sections"
              :key="section.key"
              class="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800"
              :class="activeSectionKey === section.key ? 'bg-slate-100 dark:bg-slate-800 font-semibold' : ''"
              @click="scrollToSection(section.key)"
            >
              <span
                class="flex h-5 w-5 shrink-0 items-center justify-center text-xs"
                :class="{
                  'text-green-500': section.status === 'complete',
                  'text-amber-500': section.status === 'partial',
                  'text-red-400': section.status === 'empty'
                }"
              >
                <i :class="section.status === 'complete' ? 'fa-solid fa-circle-check' : section.status === 'partial' ? 'fa-solid fa-circle-half-stroke' : 'fa-regular fa-circle'" />
              </span>
              <span class="flex-1 text-slate-900 dark:text-slate-100">{{ section.label }}</span>
              <span v-if="section.missingFields.length && isEditingMode" class="text-xs text-red-500">
                {{ section.missingFields.length }}
              </span>
            </li>
          </ul>
        </nav>

        <div class="mb-4 lg:hidden">
          <el-select
            :model-value="activeSectionKey || completeness.sections[0]?.key"
            @change="scrollToSection"
            class="w-full"
          >
            <el-option
              v-for="section in completeness.sections"
              :key="section.key"
              :label="`${section.stepIndex + 1}. ${section.label}`"
              :value="section.key"
            />
          </el-select>
        </div>

        <div class="min-w-0 flex-1 space-y-6">
          <article
            v-for="section in completeness.sections"
            :key="section.key"
            :id="`preview-section-${section.key}`"
            class="rounded-2xl border border-slate-200 p-5 dark:border-slate-700"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {{ section.stepIndex + 1 }}. {{ section.label }}
                </h3>
                <p v-if="isEditingMode && section.status !== 'complete'" class="mt-1 text-xs text-red-500">
                  {{ section.missingFields.length }} required field{{ section.missingFields.length === 1 ? '' : 's' }} missing
                </p>
              </div>
              <el-button
                v-if="isEditingMode"
               
                plain
                @click="editSection(section.stepIndex)"
              >
                Edit
              </el-button>
            </div>

            <dl class="mt-4 grid gap-3 sm:grid-cols-2">
              <template v-for="field in section.requiredFields" :key="field.key">
                <div>
                  <dt class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{{ field.label }}</dt>
                  <dd v-if="isProvided(getFieldValue(formData || application?.raw, field.key))" class="mt-1 text-sm text-slate-900 dark:text-slate-100">
                    {{ formatValue(getFieldValue(formData || application?.raw, field.key)) }}
                  </dd>
                  <dd v-else-if="isEditingMode" class="mt-1 border-b-2 border-dashed border-red-300 pb-1 text-sm italic text-red-400 dark:border-red-700">
                    Required — not provided
                  </dd>
                  <dd v-else class="mt-1 text-sm text-slate-400 dark:text-slate-500">N/A</dd>
                </div>
              </template>
            </dl>
          </article>
        </div>
      </div>
    </template>
  </section>
</template>

<style>
@media print {
  .portal-shell > header,
  .portal-shell > aside,
  .portal-shell > footer,
  .portal-shell > .fixed:first-child,
  .preview-page nav,
  .preview-page .el-button,
  .preview-page .el-select,
  .preview-page .mb-4.lg\\:hidden {
    display: none !important;
  }

  .portal-shell > main {
    position: static !important;
    left: 0 !important;
    right: 0 !important;
    top: 0 !important;
    bottom: auto !important;
    overflow: visible !important;
  }

  .portal-shell > main > div {
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    padding: 0 !important;
  }

  .preview-page article {
    break-inside: avoid;
    page-break-inside: avoid;
    border: 1px solid #e2e8f0 !important;
  }

  body {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
</style>
