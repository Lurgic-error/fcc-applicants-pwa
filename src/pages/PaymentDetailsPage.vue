<script setup>
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FccStatusBadge as StatusBadge } from '@shared/design-system/components'
import { buildApplicationDetailsRoute } from '@/constants/applicationCatalog'
import { useApplicantDataStore } from '@/stores/applications'
import GepgPaymentPanel from '@/components/GepgPaymentPanel.vue'

const route = useRoute()
const router = useRouter()
const dataStore = useApplicantDataStore()
const loading = ref(false)
const verificationLoading = ref(false)
const proofLoading = ref(false)
const verificationResult = ref(null)
const uploadedProof = ref(null)
const selectedProofFile = ref(null)

onMounted(async () => {
  loading.value = true
  try {
    await dataStore.loadPayments()
    if (!dataStore.applications.length) {
      await dataStore.loadApplications()
    }
  } finally {
    loading.value = false
  }
})

const payment = computed(() =>
  dataStore.payments.find((item) => String(item.id) === String(route.params.id)) || null
)

function toDateTime(value) {
  if (!value) return 'N/A'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}

const amountDue = computed(() => Number(payment.value?.amount || 0))
const amountPaid = computed(() => Number(payment.value?.amountPaid || 0))
const balance = computed(() => {
  const resolved = Number(payment.value?.balance)
  if (Number.isFinite(resolved)) return resolved
  return Math.max(0, amountDue.value - amountPaid.value)
})

const paymentStatus = computed(() => String(payment.value?.paymentStatus || payment.value?.status || 'pending'))
const billStatus = computed(() => String(payment.value?.billStatus || payment.value?.status || 'pending'))
const paidAtDisplay = computed(() => toDateTime(payment.value?.paidAt))
const dueDateDisplay = computed(() => toDateTime(payment.value?.dueDate))
const receiptDisplay = computed(() => payment.value?.receiptNumber || payment.value?.referenceNumber || 'N/A')

const relatedApplication = computed(() => {
  if (!payment.value) {
    return null
  }
  return dataStore.applicationById(payment.value.applicationId)
})
const canManageTrademarkPayment = computed(() => relatedApplication.value?.serviceKey === 'trademark-recordation')
const canRefreshPaymentStatus = computed(() => canManageTrademarkPayment.value && Boolean(payment.value?.controlNumber))
const paymentJourneyHint = computed(() =>
  relatedApplication.value?.journey?.nextAction || 'Use the payment references below for follow-up.'
)

const timelineRows = computed(() => {
  if (!payment.value) {
    return []
  }

  return [
    { stage: 'Control Number Issued', date: dueDateDisplay.value, actor: 'GePG / FCC System' },
    { stage: 'Bank Settlement', date: paidAtDisplay.value, actor: 'Bank / Gateway' },
    { stage: 'Finance Confirmation', date: paidAtDisplay.value, actor: 'FCC Finance' }
  ]
})

function openRelatedApplication() {
  if (!relatedApplication.value) {
    return
  }

  router.push(buildApplicationDetailsRoute(relatedApplication.value.serviceKey, relatedApplication.value.applicationId))
}

function onProofFileChange(uploadFile) {
  selectedProofFile.value = uploadFile?.raw || null
}

function onProofFileRemove() {
  selectedProofFile.value = null
}

async function refreshPaymentStatus() {
  if (!payment.value?.controlNumber) {
    return
  }

  verificationLoading.value = true
  try {
    const result = await dataStore.verifyTrademarkPaymentByControlNumber(payment.value.controlNumber, {
      applicationId: payment.value.applicationId
    })
    verificationResult.value = result

    if (canManageTrademarkPayment.value && result.billStatus === 'paid') {
      await dataStore.confirmTrademarkPayment(payment.value.applicationId, {
        source: 'gepg-bill-verification'
      })
      await dataStore.loadPayments()
      ElMessage.success('Payment was verified in GePG and synchronized to your application record.')
      return
    }

    ElMessage.info(
      result.billStatus === 'paid'
        ? 'Payment was found in GePG.'
        : 'GePG still shows this bill as unpaid or pending.'
    )
  } catch (error) {
    ElMessage.error(error?.message || 'Failed to verify payment status.')
  } finally {
    verificationLoading.value = false
  }
}

async function uploadPaymentProof() {
  if (!payment.value?.applicationId || !selectedProofFile.value) {
    return
  }

  proofLoading.value = true
  try {
    uploadedProof.value = await dataStore.uploadTrademarkPaymentProof(
      payment.value.applicationId,
      selectedProofFile.value,
      {
        title: 'Payment proof',
        description: 'Uploaded from the applicant payment details page.'
      }
    )
    selectedProofFile.value = null
    ElMessage.success('Payment proof uploaded successfully. FCC will review it before confirming payment.')
  } catch (error) {
    ElMessage.error(error?.message || 'Failed to upload payment proof.')
  } finally {
    proofLoading.value = false
  }
}

function handleVerify(controlNumber) {
  ElMessage.info(`Verifying payment for control number: ${controlNumber}`)
}

function handleUploadProof(file) {
  ElMessage.success(`Payment proof "${file.name}" uploaded.`)
}
</script>

<template>
  <section class="min-w-0 space-y-4 overflow-x-hidden">
    <div class="mb-1 flex items-center justify-between">
      <h2 class="text-2xl font-semibold">Payment Details</h2>
      <div class="flex flex-wrap gap-2">
        <el-button @click="router.push({ name: 'payments' })">Back to payments</el-button>
        <el-button v-if="relatedApplication" plain @click="openRelatedApplication">Open related application</el-button>
        <el-button
          v-if="canRefreshPaymentStatus"
          type="primary"
          plain
          :loading="verificationLoading"
          @click="refreshPaymentStatus"
        >
          Refresh from GePG
        </el-button>
      </div>
    </div>

    <el-skeleton v-if="loading" :rows="7" animated />
    <el-empty v-else-if="!payment" description="Payment not found" />

    <div v-else class="space-y-4">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wide text-slate-500">Payment ID</p>
          <p class="mt-1 text-base font-semibold">{{ payment.id }}</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wide text-slate-500">Amount</p>
          <p class="mt-1 text-base font-semibold">{{ amountDue.toLocaleString() }} TZS</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wide text-slate-500">Bill Status</p>
          <p class="mt-1"><StatusBadge :status="billStatus" /></p>
        </article>
      </div>

      <dl class="grid gap-4 rounded-2xl border border-slate-200 p-4 md:grid-cols-2">
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Payment Status</dt>
          <dd class="mt-1 text-sm font-medium"><StatusBadge :status="paymentStatus" /></dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Service Provider</dt>
          <dd class="mt-1 text-sm font-medium">{{ payment.serviceProvider || 'FCC' }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Application ID</dt>
          <dd class="mt-1 text-sm font-medium">{{ payment.applicationId }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Control Number</dt>
          <dd class="mt-1 text-sm font-medium">{{ payment.controlNumber || 'N/A' }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Amount Paid</dt>
          <dd class="mt-1 text-sm font-medium">{{ amountPaid.toLocaleString() }} TZS</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Balance</dt>
          <dd class="mt-1 text-sm font-medium">{{ balance.toLocaleString() }} TZS</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Receipt / Reference Number</dt>
          <dd class="mt-1 text-sm font-medium">{{ receiptDisplay }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">GePG Response Code</dt>
          <dd class="mt-1 text-sm font-medium">{{ payment.gePGResponseCode || 'N/A' }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">GePG Response Message</dt>
          <dd class="mt-1 text-sm font-medium">{{ payment.gePGResponseMessage || 'N/A' }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Paid At</dt>
          <dd class="mt-1 text-sm font-medium">{{ paidAtDisplay }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Due Date</dt>
          <dd class="mt-1 text-sm font-medium">{{ dueDateDisplay }}</dd>
        </div>
      </dl>

      <div class="rounded-2xl border border-slate-200 p-4">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Linked Application</h3>
        <el-empty
          v-if="!relatedApplication"
          class="mt-2"
          description="Linked application is not loaded yet"
        />
        <dl v-else class="mt-2 grid gap-3 md:grid-cols-2">
          <div class="rounded-lg bg-slate-50 p-3">
            <dt class="text-xs uppercase tracking-wide text-slate-500">Service</dt>
            <dd class="mt-1 text-sm font-medium">{{ relatedApplication.service }}</dd>
          </div>
          <div class="rounded-lg bg-slate-50 p-3">
            <dt class="text-xs uppercase tracking-wide text-slate-500">Workflow Stage</dt>
            <dd class="mt-1 text-sm font-medium">{{ relatedApplication.workflowStageTitle }}</dd>
          </div>
          <div class="rounded-lg bg-slate-50 p-3 md:col-span-2">
            <dt class="text-xs uppercase tracking-wide text-slate-500">Applicant</dt>
            <dd class="mt-1 text-sm font-medium">{{ relatedApplication.applicantName }}</dd>
          </div>
        </dl>
      </div>

      <div class="rounded-2xl border border-slate-200 p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Applicant Payment Management</h3>
            <p class="mt-2 text-sm text-slate-700">{{ paymentJourneyHint }}</p>
          </div>
          <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {{ canManageTrademarkPayment ? 'Trademark payment tools enabled' : 'Read-only payment record' }}
          </span>
        </div>

        <el-alert
          v-if="verificationResult"
          class="mt-4"
          :type="verificationResult.billStatus === 'paid' ? 'success' : 'info'"
          :closable="false"
          show-icon
          :title="verificationResult.billStatus === 'paid' ? 'GePG confirms payment for this control number.' : 'GePG has not yet confirmed payment for this control number.'"
          :description="`Expected: TZS ${Number(verificationResult.expectedAmount || 0).toLocaleString()} | Paid: TZS ${Number(verificationResult.amountPaid || 0).toLocaleString()} | Reference: ${verificationResult.referenceNumber || 'N/A'}`"
        />

        <div v-if="canManageTrademarkPayment" class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-slate-900">Upload Payment Proof</p>
              <p class="mt-1 text-xs text-slate-500">Use this when bank settlement exists but the application record still needs a supporting slip.</p>
            </div>
            <el-button
              type="success"
              plain
              :disabled="!selectedProofFile"
              :loading="proofLoading"
              @click="uploadPaymentProof"
            >
              Upload Proof
            </el-button>
          </div>

          <el-upload
            class="mt-3"
            :auto-upload="false"
            :limit="1"
            :on-change="onProofFileChange"
            :on-remove="onProofFileRemove"
          >
            <el-button plain>Select proof file</el-button>
          </el-upload>

          <p v-if="uploadedProof" class="mt-3 text-xs text-slate-500">
            Last uploaded proof: {{ uploadedProof.fileName || uploadedProof.title || 'Payment proof' }}
          </p>
        </div>
      </div>

      <div class="min-w-0 rounded-2xl border border-slate-200 p-4">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Payment Timeline</h3>
        <div class="mt-3 min-w-0 overflow-x-auto rounded-2xl border border-slate-200">
          <el-table class="w-full min-w-[620px]" :data="timelineRows">
            <el-table-column prop="stage" label="Stage" min-width="200" />
            <el-table-column prop="date" label="Date" min-width="130" />
            <el-table-column prop="actor" label="Actor" min-width="150" />
          </el-table>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 p-4">
        <h3 class="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">GePG Payment Instructions</h3>
        <GepgPaymentPanel v-if="payment" :payment="payment" @verify="handleVerify" @upload-proof="handleUploadProof" />
      </div>
    </div>
  </section>
</template>
