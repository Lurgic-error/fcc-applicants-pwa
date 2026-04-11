<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import ActionDropdown from '@/components/ActionDropdown.vue'
import { FccStatusBadge as StatusBadge } from '@shared/design-system/components'
import { toTrademarkApplicantDetail } from '@/constants/trademarkApplicantViews'
import { useApplicantDataStore } from '@/stores/applications'

const route = useRoute()
const router = useRouter()
const dataStore = useApplicantDataStore()

const loading = ref(false)
const detail = ref(null)
const paymentActionLoading = ref(false)

const timelineRows = computed(() => detail.value?.timeline || [])
const documentRows = computed(() => detail.value?.documents || [])
const trademarkRows = computed(() => detail.value?.trademarks || [])

const isApproved = computed(() => {
  const status = String(detail.value?.status || '').toLowerCase()
  return status === 'approved' || status === 'registered' || status === 'issued'
})

const certificates = computed(() => {
  if (!isApproved.value) return []

  // Try direct certificates array from the API response
  if (Array.isArray(detail.value?.certificates) && detail.value.certificates.length) {
    return detail.value.certificates
  }

  // Fall back to extracting from trademarks (each approved version may carry a certificateId)
  const fromTrademarks = (detail.value?.trademarks || [])
    .filter(tm => tm.certificateId || tm.certificate)
    .map(tm => ({
      certificateId: tm.certificateId || tm.certificate?.certificateId,
      title: `Trademark Recordation - ${tm.trademarkName || tm.name || 'N/A'}`,
      issuedAt: tm.certificate?.issuedAt || tm.decidedAt,
      trademarkName: tm.trademarkName || tm.name
    }))

  if (fromTrademarks.length) return fromTrademarks

  // Generate a reference certificate entry from application-level data
  return [{
    certificateId: `CERT-${detail.value?.applicationId || 'N/A'}`,
    title: `Trademark Recordation - ${detail.value?.trademarkName || 'N/A'}`,
    issuedAt: detail.value?.timeline?.find(t => String(t.stage || '').toLowerCase() === 'approved')?.at || null,
    trademarkName: detail.value?.trademarkName
  }]
})
const canGenerateControlNumber = computed(() => {
  const control = String(detail.value?.controlNumber || '').trim()
  return !control
})
const canConfirmPayment = computed(() => {
  const status = String(detail.value?.paymentStatus || '').toLowerCase()
  const control = String(detail.value?.controlNumber || '').trim()
  return Boolean(control) && !status.includes('verified')
})
const canSubmitToFcc = computed(() => {
  const status = String(detail.value?.status || '').toLowerCase()
  const payment = String(detail.value?.paymentStatus || '').toLowerCase()
  const control = String(detail.value?.controlNumber || '').trim()
  if (status.includes('submitted') || status.includes('review') || status.includes('approved') || status.includes('rejected')) {
    return false
  }
  return Boolean(control) && (payment.includes('verified') || payment.includes('paid'))
})

// --- Periodic status polling ---
const POLL_STATUSES = new Set(['submitted', 'screening', 'under_review', 'awaiting_info'])
let pollTimer = null

const shouldPoll = computed(() => {
  const status = String(detail.value?.status || '').toLowerCase()
  return POLL_STATUSES.has(status)
})

async function pollStatus() {
  const id = String(route.params.id || '')
  if (!id) return
  try {
    const found = await dataStore.getApplicationById(id, { serviceKey: 'trademark-recordation' })
    if (found) {
      const oldStatus = detail.value?.status
      detail.value = toTrademarkApplicantDetail(found)
      const newStatus = detail.value?.status
      if (newStatus !== oldStatus && oldStatus) {
        ElMessage.info(`Application status updated to: ${newStatus}`)
      }
    }
  } catch {
    // Silent failure — don't interrupt the user
  }
}

function startPolling() {
  stopPolling()
  if (shouldPoll.value) {
    pollTimer = setInterval(pollStatus, 30000)
  }
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

watch(shouldPoll, (newVal) => {
  if (newVal) startPolling()
  else stopPolling()
})

onUnmounted(() => stopPolling())
// --- End polling ---

async function loadDetails() {
  const id = String(route.params.id || '')
  loading.value = true

  try {
    const found = await dataStore.getApplicationById(id, { serviceKey: 'trademark-recordation' })
    detail.value = found ? toTrademarkApplicantDetail(found) : null
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push({ name: 'trademarks-overview' })
}

function openUpdate() {
  if (!detail.value?.applicationId) {
    return
  }
  router.push({ name: 'trademark-update', params: { id: detail.value.applicationId } })
}

function createFollowUp(requestType = 'renewal') {
  router.push({
    name: 'trademark-create',
    query: {
      requestType,
      sourceApplicationId: detail.value?.applicationId || ''
    }
  })
}

async function refreshDetailFromStore() {
  const id = String(route.params.id || '')
  if (!id) {
    return
  }
  const found = await dataStore.getApplicationById(id, { serviceKey: 'trademark-recordation' })
  if (found) {
    detail.value = toTrademarkApplicantDetail(found)
  }
}

async function generateControlNumber() {
  if (!detail.value?.applicationId) {
    return
  }
  paymentActionLoading.value = true
  try {
    await dataStore.generateTrademarkControlNumber(detail.value.applicationId)
    await refreshDetailFromStore()
    ElMessage.success('Control number generated successfully.')
  } catch (error) {
    ElMessage.error(error?.message || 'Failed to generate control number.')
  } finally {
    paymentActionLoading.value = false
  }
}

function confirmPayment() {
  ElMessage.info('Payment is verified automatically through the GePG system. If your payment is pending, please wait or contact FCC support.')
}

async function submitToFcc() {
  if (!detail.value?.applicationId) {
    return
  }
  paymentActionLoading.value = true
  try {
    await dataStore.submitTrademarkApplication(detail.value.applicationId)
    await refreshDetailFromStore()
    ElMessage.success('Application submitted to FCC successfully.')
  } catch (error) {
    ElMessage.error(error?.message || 'Failed to submit application.')
  } finally {
    paymentActionLoading.value = false
  }
}

function onDetailAction(command) {
  if (!command) {
    return
  }
  if (command === 'edit') {
    openUpdate()
    return
  }
  if (command === 'generate-control-number') {
    generateControlNumber()
    return
  }
  if (command === 'confirm-payment') {
    confirmPayment()
    return
  }
  if (command === 'submit-to-fcc') {
    submitToFcc()
    return
  }
  if (command.startsWith('followup:')) {
    createFollowUp(command.replace('followup:', ''))
  }
}

function formatDate(value) {
  if (!value) return 'N/A'
  const dateStr = String(value).slice(0, 10)
  if (!dateStr || dateStr === 'N/A') return 'N/A'
  return dateStr
}

function downloadCertificate(cert) {
  if (!cert?.certificateId) {
    ElMessage.warning('Certificate reference is not available.')
    return
  }

  // Attempt download via the certificates API endpoint
  const downloadUrl = `/api/v1/certificates/${encodeURIComponent(cert.certificateId)}/download`
  const link = document.createElement('a')
  link.href = downloadUrl
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.download = `${cert.certificateId}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

onMounted(async () => {
  await loadDetails()
  startPolling()
})
</script>

<template>
  <section class="space-y-4">
    <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-2xl font-semibold">Trademark Application Details</h2>
      <div class="flex flex-wrap gap-2">
        <el-button @click="goBack">Back to Trademarks</el-button>
        <ActionDropdown
          label="Actions"
          :button-plain="false"
          :items="[
            { key: 'edit', label: 'Edit Request' },
            { key: 'generate-control-number', label: 'Generate Control Number', disabled: !canGenerateControlNumber, divided: true },
            { key: 'confirm-payment', label: 'Payment Status', disabled: !canConfirmPayment },
            { key: 'submit-to-fcc', label: 'Submit to FCC', disabled: !canSubmitToFcc },
            { key: 'followup:renewal', label: 'Create Follow-up: Renewal', divided: true },
            { key: 'followup:alteration', label: 'Create Follow-up: Alteration' },
            { key: 'followup:ownership_change', label: 'Create Follow-up: Ownership Change' },
            { key: 'followup:name_change', label: 'Create Follow-up: Name Change' },
            { key: 'followup:agent_appointment', label: 'Create Follow-up: Agent Appointment' }
          ]"
          @select="({ command }) => onDetailAction(command)"
        />
      </div>
    </div>

    <el-skeleton v-if="loading" :rows="8" animated />

    <template v-else-if="detail">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
        <article class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wide text-slate-500">Application</p>
          <p class="mt-1 text-base font-semibold">{{ detail.applicationId }}</p>
          <p class="mt-1 text-xs text-slate-500">Ref: {{ detail.reference }}</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wide text-slate-500">Status</p>
          <p class="mt-2 flex items-center">
            <StatusBadge :status="detail.status" />
            <span v-if="shouldPoll" class="text-xs text-gray-400 ml-2">Auto-refreshing</span>
          </p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wide text-slate-500">Request Type</p>
          <p class="mt-1 text-base font-semibold">{{ detail.requestTypeLabel }}</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wide text-slate-500">Submitted</p>
          <p class="mt-1 text-base font-semibold">{{ detail.submittedAt }}</p>
        </article>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div class="rounded-2xl border border-slate-200 p-4">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Trademark Information</h3>
          <dl class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div class="rounded-lg bg-slate-50 p-3">
              <dt class="text-xs uppercase tracking-wide text-slate-500">Trademark</dt>
              <dd class="mt-1 text-sm font-medium">{{ detail.trademarkName }}</dd>
            </div>
            <div class="rounded-lg bg-slate-50 p-3">
              <dt class="text-xs uppercase tracking-wide text-slate-500">Class of Goods</dt>
              <dd class="mt-1 text-sm font-medium">{{ detail.classOfGoods }}</dd>
            </div>
            <div class="rounded-lg bg-slate-50 p-3">
              <dt class="text-xs uppercase tracking-wide text-slate-500">Representation</dt>
              <dd class="mt-1 text-sm font-medium">{{ detail.representationType }}</dd>
            </div>
            <div class="rounded-lg bg-slate-50 p-3">
              <dt class="text-xs uppercase tracking-wide text-slate-500">Country of Origin</dt>
              <dd class="mt-1 text-sm font-medium">{{ detail.countryOfOrigin }}</dd>
            </div>
            <div class="rounded-lg bg-slate-50 p-3 md:col-span-2">
              <dt class="text-xs uppercase tracking-wide text-slate-500">Registration Reference</dt>
              <dd class="mt-1 text-sm font-medium">{{ detail.registrationReference }}</dd>
            </div>
          </dl>

          <div class="mt-4 rounded-lg border border-slate-200 bg-white p-3">
            <p class="text-xs uppercase tracking-wide text-slate-500">Trademarks In Application</p>
            <el-table class="mt-2" :data="trademarkRows" empty-text="No trademarks listed">
              <el-table-column prop="trademarkName" label="Trademark" min-width="180" />
              <el-table-column prop="classOfGoods" label="Class" min-width="130" />
              <el-table-column prop="countryOfOrigin" label="Country" min-width="120" />
              <el-table-column prop="registrationReference" label="Reference" min-width="170" />
            </el-table>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 p-4">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Owner and Contact</h3>
          <dl class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div class="rounded-lg bg-slate-50 p-3">
              <dt class="text-xs uppercase tracking-wide text-slate-500">Owner Name</dt>
              <dd class="mt-1 text-sm font-medium">{{ detail.ownerName }}</dd>
            </div>
            <div class="rounded-lg bg-slate-50 p-3">
              <dt class="text-xs uppercase tracking-wide text-slate-500">Jurisdiction</dt>
              <dd class="mt-1 text-sm font-medium">{{ detail.ownerJurisdiction }}</dd>
            </div>
            <div class="rounded-lg bg-slate-50 p-3 md:col-span-2">
              <dt class="text-xs uppercase tracking-wide text-slate-500">Owner Address</dt>
              <dd class="mt-1 text-sm font-medium">{{ detail.ownerAddress }}</dd>
            </div>
            <div class="rounded-lg bg-slate-50 p-3">
              <dt class="text-xs uppercase tracking-wide text-slate-500">Email</dt>
              <dd class="mt-1 text-sm font-medium">{{ detail.applicantEmail }}</dd>
            </div>
            <div class="rounded-lg bg-slate-50 p-3">
              <dt class="text-xs uppercase tracking-wide text-slate-500">Phone</dt>
              <dd class="mt-1 text-sm font-medium">{{ detail.applicantPhone }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div class="rounded-2xl border border-slate-200 p-4">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Payment</h3>
          <dl class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div class="rounded-lg bg-slate-50 p-3">
              <dt class="text-xs uppercase tracking-wide text-slate-500">Payment Status</dt>
              <dd class="mt-1"><StatusBadge :status="detail.paymentStatus" /></dd>
            </div>
            <div class="rounded-lg bg-slate-50 p-3">
              <dt class="text-xs uppercase tracking-wide text-slate-500">Control Number</dt>
              <dd class="mt-1 text-sm font-medium">{{ detail.controlNumber || 'N/A' }}</dd>
            </div>
            <div class="rounded-lg bg-slate-50 p-3">
              <dt class="text-xs uppercase tracking-wide text-slate-500">Reference</dt>
              <dd class="mt-1 text-sm font-medium">{{ detail.paymentReference || 'N/A' }}</dd>
            </div>
            <div class="rounded-lg bg-slate-50 p-3">
              <dt class="text-xs uppercase tracking-wide text-slate-500">Amount Due</dt>
              <dd class="mt-1 text-sm font-medium">{{ Number(detail.amountDue || 0).toLocaleString() }} TZS</dd>
            </div>
            <div class="rounded-lg bg-slate-50 p-3">
              <dt class="text-xs uppercase tracking-wide text-slate-500">Amount Paid</dt>
              <dd class="mt-1 text-sm font-medium">{{ Number(detail.amountPaid || 0).toLocaleString() }} TZS</dd>
            </div>
            <div class="rounded-lg bg-slate-50 p-3">
              <dt class="text-xs uppercase tracking-wide text-slate-500">Balance</dt>
              <dd class="mt-1 text-sm font-medium">{{ Number(detail.balance || 0).toLocaleString() }} TZS</dd>
            </div>
          </dl>

          <div class="mt-3 flex flex-wrap gap-2">
            <el-button :loading="paymentActionLoading" :disabled="!canGenerateControlNumber" @click="generateControlNumber">
              Generate Control Number
            </el-button>
            <el-button type="success" :loading="paymentActionLoading" :disabled="!canConfirmPayment" @click="confirmPayment">
              Payment Status
            </el-button>
            <el-button type="primary" :loading="paymentActionLoading" :disabled="!canSubmitToFcc" @click="submitToFcc">
              Submit to FCC
            </el-button>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 p-4">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Status Timeline</h3>
          <el-timeline class="mt-3">
            <el-timeline-item v-for="(row, index) in timelineRows" :key="`${row.stage}-${index}`" :timestamp="String(row.at || '').slice(0, 10)">
              <div class="flex items-center gap-2">
                <StatusBadge :status="row.stage" />
                <span class="text-xs text-slate-500">by {{ row.by }}</span>
              </div>
            </el-timeline-item>
            <el-timeline-item v-if="!timelineRows.length" timestamp="N/A">
              No timeline entries yet.
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 p-4">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Submitted Documents</h3>
        <el-table class="mt-3" :data="documentRows" empty-text="No documents attached">
          <el-table-column prop="documentType" label="Document Type" min-width="180" />
          <el-table-column prop="fileName" label="File Name" min-width="220" />
          <el-table-column prop="issuedDate" label="Issued Date" min-width="130" />
        </el-table>
      </div>

      <!-- Recordation Certificates (visible only for approved applications) -->
      <div v-if="isApproved" class="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-emerald-700">Recordation Certificates</h3>

        <div v-if="certificates.length" class="mt-3 space-y-3">
          <div
            v-for="cert in certificates"
            :key="cert.certificateId"
            class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
          >
            <div class="min-w-0 flex-1 space-y-1">
              <p class="text-sm font-semibold text-slate-800">{{ cert.title || 'Recordation Certificate' }}</p>
              <p class="text-xs text-slate-500">Certificate ID: {{ cert.certificateId }}</p>
              <p v-if="cert.trademarkName" class="text-xs text-slate-500">Trademark: {{ cert.trademarkName }}</p>
              <p class="text-xs text-slate-500">Issued: {{ formatDate(cert.issuedAt || cert.createdAt) }}</p>
            </div>
            <el-button type="primary" @click="downloadCertificate(cert)">
              Download Certificate
            </el-button>
          </div>

          <p class="mt-2 text-xs text-slate-500">
            Your recordation certificate has also been dispatched to your registered email address.
            If you have not received it, please contact FCC support.
          </p>
        </div>

        <div v-else class="mt-3">
          <p class="text-sm text-slate-600">
            Your application has been approved. Certificate details will appear here once generated.
          </p>
        </div>
      </div>
    </template>

    <el-empty v-else description="Trademark application details are unavailable." />
  </section>
</template>
