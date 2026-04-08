<script setup>
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCertificatePolicy } from '@/constants/applicationServiceRules'
import { buildApplicationDetailsRoute, resolveApplicationServiceKeyFromText } from '@/constants/applicationCatalog'
import { useApplicantDataStore } from '@/stores/applications'
import CertificateCard from '@/components/CertificateCard.vue'

const route = useRoute()
const router = useRouter()
const dataStore = useApplicantDataStore()
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    await dataStore.loadCertificates()
    if (!dataStore.applications.length) {
      await dataStore.loadApplications()
    }
  } finally {
    loading.value = false
  }
})

const certificate = computed(() =>
  dataStore.certificates.find((item) => String(item.certificateId) === String(route.params.id)) || null
)

const linkedApplication = computed(() => {
  if (!certificate.value) {
    return null
  }
  return dataStore.applicationById(certificate.value.applicationId)
})

const certificatePolicy = computed(() => {
  const key = resolveApplicationServiceKeyFromText(certificate.value?.service)
  return getCertificatePolicy(key)
})

const expiryDate = computed(() => {
  if (!certificate.value?.issuedAt || !certificatePolicy.value?.validityMonths) {
    return 'No expiry'
  }

  const issued = new Date(certificate.value.issuedAt)
  if (Number.isNaN(issued.getTime())) {
    return 'N/A'
  }

  issued.setMonth(issued.getMonth() + Number(certificatePolicy.value.validityMonths))
  return issued.toISOString().slice(0, 10)
})

const timelineRows = computed(() => {
  if (!certificate.value) {
    return []
  }
  return [
    { stage: 'Application Approved', date: certificate.value.issuedAt, actor: 'FCC Review Unit' },
    { stage: 'Certificate Generated', date: certificate.value.issuedAt, actor: 'FCC Registry' },
    { stage: 'Certificate Issued', date: certificate.value.issuedAt, actor: 'FCC Directorate' }
  ]
})

function openLinkedApplication() {
  if (!linkedApplication.value) {
    return
  }

  router.push(buildApplicationDetailsRoute(linkedApplication.value.serviceKey, linkedApplication.value.applicationId))
}

function openDownloadUrl(downloadUrl) {
  const anchor = document.createElement('a')
  anchor.href = downloadUrl
  anchor.target = '_blank'
  anchor.rel = 'noopener'
  anchor.click()
}

async function downloadCertificate() {
  if (!certificate.value) {
    return
  }

  try {
    const result = await dataStore.downloadCertificate(certificate.value.certificateId)
    if (!result?.downloadUrl) {
      throw new Error('Certificate download file is not available yet.')
    }
    openDownloadUrl(result.downloadUrl)
  } catch (error) {
    ElMessage.error(error?.message || 'Unable to download the certificate.')
  }
}
</script>

<template>
  <section class="min-w-0 space-y-4 overflow-x-hidden">
    <div class="mb-1 flex items-center justify-between">
      <h2 class="text-2xl font-semibold">Certificate Details</h2>
      <div class="flex flex-wrap gap-2">
        <el-button @click="router.push({ name: 'certificates' })">Back to certificates</el-button>
        <el-button v-if="linkedApplication" plain @click="openLinkedApplication">Open linked application</el-button>
        <el-button v-if="certificate" type="primary" plain @click="downloadCertificate">Download certificate</el-button>
      </div>
    </div>

    <el-skeleton v-if="loading" :rows="8" animated />
    <el-empty v-else-if="!certificate" description="Certificate not found" />

    <div v-else class="space-y-4">
      <CertificateCard :certificate="{ ...certificate, expiryDate }" />

      <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wide text-slate-500">Certificate ID</p>
          <p class="mt-1 text-base font-semibold">{{ certificate.certificateId }}</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wide text-slate-500">Issued At</p>
          <p class="mt-1 text-base font-semibold">{{ certificate.issuedAt }}</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wide text-slate-500">Validity</p>
          <p class="mt-1 text-base font-semibold">{{ expiryDate }}</p>
        </article>
      </div>

      <dl class="grid gap-4 rounded-2xl border border-slate-200 p-4 md:grid-cols-2">
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Application</dt>
          <dd class="mt-1 text-sm font-medium">{{ certificate.applicationId }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Service</dt>
          <dd class="mt-1 text-sm font-medium">{{ certificate.service }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Status</dt>
          <dd class="mt-1 text-sm">{{ certificate.status }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Workflow Stage</dt>
          <dd class="mt-1 text-sm">{{ certificate.workflowStage }}</dd>
        </div>
      </dl>

      <div class="rounded-2xl border border-slate-200 p-4">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Policy</h3>
        <dl class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div class="rounded-lg bg-slate-50 p-3">
            <dt class="text-xs uppercase tracking-wide text-slate-500">Certificate Available</dt>
            <dd class="mt-1 text-sm font-medium">{{ certificatePolicy.available ? 'Yes' : 'No' }}</dd>
          </div>
          <div class="rounded-lg bg-slate-50 p-3">
            <dt class="text-xs uppercase tracking-wide text-slate-500">Validity Months</dt>
            <dd class="mt-1 text-sm font-medium">{{ certificatePolicy.validityMonths ?? 'No lifespan' }}</dd>
          </div>
        </dl>
      </div>

      <div class="rounded-2xl border border-slate-200 p-4">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Linked Application</h3>
        <el-empty v-if="!linkedApplication" class="mt-2" description="Linked application is not loaded yet" />
        <dl v-else class="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div class="rounded-lg bg-slate-50 p-3">
            <dt class="text-xs uppercase tracking-wide text-slate-500">Applicant</dt>
            <dd class="mt-1 text-sm font-medium">{{ linkedApplication.applicantName }}</dd>
          </div>
          <div class="rounded-lg bg-slate-50 p-3">
            <dt class="text-xs uppercase tracking-wide text-slate-500">Current Stage</dt>
            <dd class="mt-1 text-sm font-medium">{{ linkedApplication.workflowStageTitle }}</dd>
          </div>
          <div class="rounded-lg bg-slate-50 p-3 md:col-span-2">
            <dt class="text-xs uppercase tracking-wide text-slate-500">Service Reference</dt>
            <dd class="mt-1 text-sm font-medium">{{ linkedApplication.reference }}</dd>
          </div>
        </dl>
      </div>

      <div class="min-w-0 rounded-2xl border border-slate-200 p-4">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Issuance Timeline</h3>
        <div class="mt-3 min-w-0 overflow-x-auto rounded-2xl border border-slate-200">
          <el-table class="w-full min-w-[640px]" :data="timelineRows">
            <el-table-column prop="stage" label="Stage" min-width="220" />
            <el-table-column prop="date" label="Date" min-width="130" />
            <el-table-column prop="actor" label="Actor" min-width="160" />
          </el-table>
        </div>
      </div>
    </div>
  </section>
</template>
