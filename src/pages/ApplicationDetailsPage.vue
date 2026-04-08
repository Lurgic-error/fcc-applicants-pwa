<script setup>
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FccStatusBadge as StatusBadge } from '@shared/design-system/components'
import {
  buildApplicationUpdateRoute,
  buildServiceOverviewRoute,
  getApplicationServiceByKey
} from '@/constants/applicationCatalog'
import { labelTrademarkRequestType } from '@/constants/trademarkRecordation'
import { useApplicantDataStore } from '@/stores/applications'
import ApplicationTimeline from '@/components/ApplicationTimeline.vue'

const route = useRoute()
const router = useRouter()
const dataStore = useApplicantDataStore()

const loading = ref(false)
const actionLoading = ref(false)
const application = ref(null)

const actionForm = reactive({
  director: '',
  manager: '',
  officer: '',
  status: 'under_review',
  stage: '',
  notes: '',
  activity: '',
  task: '',
  reviewTitle: '',
  reviewReport: '',
  reportTitle: '',
  reportBody: '',
  reviewId: '',
  reportId: '',
  attachmentId: '',
  attachmentName: ''
})

const service = computed(() => getApplicationServiceByKey(route.params.serviceKey))
const workflowStages = computed(() => application.value?.workflowStages || [])
const historyRows = computed(() => application.value?.workflowStageHistory || [])
const applicant = computed(() => application.value?.raw?.applicant || {})
const isPreviewApplication = computed(() =>
  Boolean(application.value?.previewOnly || application.value?.raw?.previewOnly || application.value?.raw?.__preview)
)
const reviews = computed(() => application.value?.reviews || [])
const reports = computed(() => application.value?.reports || [])
const submissions = computed(() => application.value?.submissions || [])
const attachments = computed(() => application.value?.attachments || [])
const auditTrail = computed(() => application.value?.auditTrail || [])
const isTrademarkService = computed(() => application.value?.serviceKey === 'trademark-recordation')
const trademarkRecordation = computed(() => application.value?.trademarkRecordation || null)
const trademarkAttachmentRows = computed(() => trademarkRecordation.value?.attachments || [])
const paymentControlNumber = computed(
  () => application.value?.payment?.controlNumber || trademarkRecordation.value?.payment?.controlNumber || 'N/A'
)
const paymentReferenceNumber = computed(
  () => application.value?.payment?.referenceNumber || trademarkRecordation.value?.payment?.referenceNumber || 'N/A'
)
const paymentPaidAt = computed(
  () => trademarkRecordation.value?.payment?.paidAt || application.value?.payment?.paidAt || 'N/A'
)
const journey = computed(() => application.value?.journey || null)
const linkedCertificate = computed(() =>
  dataStore.certificates.find((certificate) => String(certificate.applicationId) === String(application.value?.applicationId || '')) || null
)
const serviceDetailRows = computed(() => {
  const details = application.value?.serviceDetails || {}
  return Object.entries(details)
    .filter(([key]) => !['trademarkVersions', 'contracts', 'mergerClearance', 'trademarkRecordation'].includes(key))
    .map(([key, value]) => ({
      key,
      label: key
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/^./, (char) => char.toUpperCase()),
      value
    }))
})
const referenceRows = computed(() => {
  if (!application.value) {
    return []
  }

  return [
    { label: 'Responsible Officer', value: application.value.responsibleOfficer?.name || application.value.responsibleOfficer?.id || 'N/A' },
    { label: 'Responsible Manager', value: application.value.responsibleManager?.name || application.value.responsibleManager?.id || 'N/A' },
    { label: 'Responsible Director', value: application.value.responsibleDirector?.name || application.value.responsibleDirector?.id || 'N/A' },
    { label: 'Activity Reference', value: application.value.activity?.name || application.value.activity?.id || 'N/A' },
    { label: 'Task Reference', value: application.value.task?.name || application.value.task?.id || 'N/A' },
    { label: 'Directorate', value: application.value.directorate?.name || application.value.directorate?.id || 'N/A' },
    { label: 'Section', value: application.value.section?.name || application.value.section?.id || 'N/A' },
    { label: 'Office', value: application.value.office?.name || application.value.office?.id || 'N/A' },
    { label: 'Financial Year', value: application.value.financialYear || 'N/A' },
    { label: 'Quarter', value: application.value.quarter || 'N/A' }
  ]
})

async function loadApplication() {
  loading.value = true
  try {
    application.value = await dataStore.getApplicationById(route.params.id, {
      serviceKey: String(route.params.serviceKey || '')
    })
    if (application.value?.certificatePolicy?.available && !dataStore.certificates.length) {
      await dataStore.loadCertificates()
    }
  } catch (error) {
    application.value = null
    ElMessage.error(error?.message || 'Unable to load application details.')
  } finally {
    loading.value = false
  }
}

async function runAction(actionKey, payload = {}, successMessage = 'Action completed successfully') {
  if (!application.value) {
    return
  }

  actionLoading.value = true
  try {
    const updated = await dataStore.performApplicationUseCase(application.value.applicationId, actionKey, {
      ...payload,
      serviceKey: application.value.serviceKey
    })
    application.value = updated
    ElMessage.success(successMessage)
  } catch (error) {
    ElMessage.error(error?.message || `Failed to execute ${actionKey}`)
  } finally {
    actionLoading.value = false
  }
}

function goBack() {
  const serviceKey = String(application.value?.serviceKey || route.params.serviceKey || '')
  if (serviceKey) {
    router.push(buildServiceOverviewRoute(serviceKey))
    return
  }
  router.push({ name: 'applications' })
}

function openUpdateWizard() {
  if (!application.value) {
    return
  }

  router.push(buildApplicationUpdateRoute(application.value.serviceKey, application.value.applicationId))
}

function openTrademarkFollowUp(requestType) {
  if (!application.value) {
    return
  }

  router.push({
    name: 'trademark-create',
    query: {
      requestType,
      sourceApplicationId: application.value.applicationId
    }
  })
}

function actionReviewSummary() {
  return {
    title: actionForm.reviewTitle || 'Application Review',
    report: actionForm.reviewReport || 'Review submitted from applicant workspace.',
    stageKey: 'screening'
  }
}

function actionReportSummary() {
  return {
    title: actionForm.reportTitle || 'Application Report',
    body: actionForm.reportBody || 'Report submitted from applicant workspace.'
  }
}

function lifecycleStateLabel(value = '') {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'completed') return 'Completed'
  if (normalized === 'attention') return 'Action Required'
  if (normalized === 'current') return 'In Progress'
  return 'Upcoming'
}

function lifecycleStateClass(value = '') {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'completed') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
  if (normalized === 'attention') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }
  if (normalized === 'current') {
    return 'border-sky-200 bg-sky-50 text-sky-700'
  }
  return 'border-slate-200 bg-slate-50 text-slate-600'
}

function openCertificate() {
  if (!linkedCertificate.value) {
    return
  }

  router.push({
    name: 'certificate-details',
    params: {
      id: linkedCertificate.value.certificateId
    }
  })
}

function openPreview() {
  router.push({
    name: 'application-preview',
    params: {
      serviceKey: route.params.serviceKey,
      id: route.params.id
    }
  })
}

function cloneApplication() {
  if (!application.value) return
  router.push({
    name: 'application-create',
    params: { serviceKey: route.params.serviceKey },
    query: { cloneFrom: application.value.applicationId }
  })
}

const timelineEvents = computed(() => {
  if (!application.value) return []
  const events = []

  if (application.value.submittedAt) {
    events.push({
      type: 'submitted',
      title: 'Application Submitted',
      description: `${application.value.service || 'Application'} submitted for review.`,
      date: application.value.submittedAt,
      actor: 'Applicant'
    })
  }

  for (const entry of historyRows.value) {
    events.push({
      type: 'stage_change',
      title: entry.title || entry.stage || 'Stage Change',
      description: entry.notes || entry.description || '',
      date: entry.date || entry.timestamp || entry.changedAt,
      actor: entry.actor || entry.changedBy || ''
    })
  }

  for (const entry of auditTrail.value) {
    events.push({
      type: entry.action === 'approve' ? 'approved' : entry.action === 'reject' ? 'rejected' : 'stage_change',
      title: entry.action ? `${entry.action.charAt(0).toUpperCase()}${entry.action.slice(1)}` : 'Action',
      description: entry.notes || entry.details || '',
      date: entry.timestamp || entry.date,
      actor: entry.performedBy || entry.actor || ''
    })
  }

  return events
})

onMounted(loadApplication)

// --- Action Center ---
const unresolvedQueries = computed(() => {
  return (application.value?.queries || []).filter(q => q.status !== 'resolved')
})

const needsPayment = computed(() => {
  const status = application.value?.payment?.status
  return status && !['confirmed', 'paid', 'waived'].includes(status)
})

const missingDocuments = computed(() => {
  const required = application.value?.requiredDocuments || []
  const provided = application.value?.attachments || []
  return required.filter(r => !provided.some(p => p.documentType === r.type))
})

const upcomingDeadline = computed(() => {
  return application.value?.deadline || application.value?.dueDate || null
})

const hasActions = computed(() => {
  return unresolvedQueries.value.length > 0 || needsPayment.value || missingDocuments.value.length > 0 || upcomingDeadline.value
})

// --- What Happens Next ---
const nextStepDescription = computed(() => {
  const status = (application.value?.status || '').toLowerCase()
  const descriptions = {
    draft: 'Complete your application and submit it for review.',
    submitted: 'Your application is being reviewed by FCC officers. You will be notified of any queries or the outcome.',
    'under review': 'An FCC officer is reviewing your application. This typically takes 14-30 business days.',
    'payment pending': 'Please complete your payment to proceed. Your application will be reviewed after payment is confirmed.',
    approved: 'Congratulations! Your application has been approved. Your certificate will be issued shortly.',
    rejected: 'Your application was not approved. You may review the reasons and submit a new application.',
  }
  return descriptions[status] || 'Your application is being processed. Check back for updates.'
})

// --- Helper functions ---
function scrollToQueries() { document.getElementById('queries-section')?.scrollIntoView({ behavior: 'smooth' }) }
function scrollToPayment() { document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' }) }
function scrollToDocs() { document.getElementById('documents-section')?.scrollIntoView({ behavior: 'smooth' }) }
function formatAmount(amount) { return amount ? `TSH ${Number(amount).toLocaleString()}` : 'N/A' }
function formatDate(date) { return date ? new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '' }
</script>

<template>
  <section>
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-2xl font-semibold">Application Details</h2>
      <div class="flex flex-wrap items-center gap-2">
        <el-button @click="goBack">Back to {{ service.label }}</el-button>
        <el-button type="primary" plain :disabled="!application || isPreviewApplication || !journey?.canEdit" @click="openUpdateWizard">Update Wizard</el-button>
        <el-button plain @click="openPreview">
          <i class="fa-solid fa-eye mr-2" />View Application
        </el-button>
        <el-button plain @click="cloneApplication">
          <i class="fa-solid fa-clone mr-2" />Apply Again
        </el-button>
        <el-button v-if="linkedCertificate" type="success" plain @click="openCertificate">Open Certificate</el-button>
        <el-dropdown v-if="isTrademarkService" trigger="click">
          <el-button plain type="success">Create Follow-up Request</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="openTrademarkFollowUp('renewal')">Renewal</el-dropdown-item>
              <el-dropdown-item @click="openTrademarkFollowUp('alteration')">Alteration</el-dropdown-item>
              <el-dropdown-item @click="openTrademarkFollowUp('ownership_change')">Ownership Change</el-dropdown-item>
              <el-dropdown-item @click="openTrademarkFollowUp('name_change')">Name Change</el-dropdown-item>
              <el-dropdown-item @click="openTrademarkFollowUp('agent_appointment')">Agent Appointment</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button
          type="danger"
          plain
          :disabled="!application || isPreviewApplication || !journey?.canClose"
          :loading="actionLoading"
          @click="runAction('closeApplication', { notes: 'Closed from applicant workspace.' }, 'Application closed')"
        >
          Close Application
        </el-button>
      </div>
    </div>

    <el-skeleton v-if="loading" :rows="8" animated />

    <el-empty v-else-if="!application" description="Application not found or not linked to this account" />

    <div v-else class="space-y-4">
      <el-alert
        v-if="isPreviewApplication"
        type="info"
        :closable="false"
        show-icon
        title="Preview data is shown because this application was not found in live records."
      />

      <!-- Action Center -->
      <div v-if="hasActions" class="mb-6 p-4 rounded-lg border-2 border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700">
        <h3 class="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-3">Action Required</h3>
        <div class="space-y-2">
          <!-- Unresolved queries -->
          <div v-if="unresolvedQueries.length" class="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
            <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span class="text-sm">{{ unresolvedQueries.length }} query(ies) from FCC require your response</span>
            <button class="ml-auto text-sm text-blue-600 underline" @click="scrollToQueries">Respond</button>
          </div>
          <!-- Payment needed -->
          <div v-if="needsPayment" class="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
            <span class="w-2 h-2 bg-amber-500 rounded-full"></span>
            <span class="text-sm">Payment of {{ formatAmount(application?.fee?.totalAmount) }} is pending</span>
            <button class="ml-auto text-sm text-blue-600 underline" @click="scrollToPayment">Pay Now</button>
          </div>
          <!-- Missing documents -->
          <div v-if="missingDocuments.length" class="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
            <span class="w-2 h-2 bg-orange-500 rounded-full"></span>
            <span class="text-sm">{{ missingDocuments.length }} required document(s) missing</span>
            <button class="ml-auto text-sm text-blue-600 underline" @click="scrollToDocs">Upload</button>
          </div>
          <!-- Deadline -->
          <div v-if="upcomingDeadline" class="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
            <span class="w-2 h-2 bg-purple-500 rounded-full"></span>
            <span class="text-sm">Deadline: {{ formatDate(upcomingDeadline) }}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wide text-slate-500">Application ID</p>
          <p class="mt-1 text-base font-semibold">{{ application.applicationId }}</p>
          <p class="mt-1 text-xs text-slate-500">File Number: {{ application.fileNumber || 'Pending' }}</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wide text-slate-500">Fees</p>
          <p class="mt-1 text-base font-semibold">{{ Number(application.fees?.total || 0).toLocaleString() }} {{ application.fees?.currency || 'TZS' }}</p>
          <p class="mt-1 text-xs text-slate-500">Model: {{ application.fees?.model || 'fixed' }}</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wide text-slate-500">Payment</p>
          <p class="mt-1 text-base font-semibold">{{ application.payment?.status || 'Pending' }}</p>
          <p class="mt-1 text-xs text-slate-500">
            Due: {{ Number(application.payment?.amountDue || 0).toLocaleString() }} | Balance: {{ Number(application.payment?.balance || 0).toLocaleString() }}
          </p>
          <p class="mt-1 text-xs text-slate-500">
            Control: {{ paymentControlNumber }} | Ref: {{ paymentReferenceNumber }}
          </p>
          <p class="mt-1 text-xs text-slate-500">
            Paid At: {{ paymentPaidAt }}
          </p>
        </article>
      </div>

      <div class="rounded-2xl border border-slate-200 p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="max-w-3xl">
            <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Applicant Lifecycle</h3>
            <p class="mt-2 text-sm text-slate-700">{{ journey?.summary }}</p>
          </div>
          <div class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {{ journey?.nextAction }}
          </div>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          <article
            v-for="step in journey?.steps || []"
            :key="step.key"
            class="rounded-xl border p-3"
            :class="lifecycleStateClass(step.state)"
          >
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-semibold">{{ step.label }}</p>
              <span class="rounded-full border border-current/20 px-2 py-0.5 text-[11px] uppercase tracking-wide">
                {{ lifecycleStateLabel(step.state) }}
              </span>
            </div>
            <p class="mt-2 text-sm">{{ step.detail }}</p>
          </article>
        </div>
      </div>

      <dl class="grid gap-4 rounded-2xl border border-slate-200 p-4 md:grid-cols-2">
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Service</dt>
          <dd class="mt-1 text-sm font-medium">{{ application.service }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Applicant Type</dt>
          <dd class="mt-1 text-sm font-medium">{{ String(application.applicantType || 'firm').toUpperCase() }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Status</dt>
          <dd class="mt-1"><StatusBadge :status="application.status" /></dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Current Workflow Stage</dt>
          <dd class="mt-1 text-sm font-medium">{{ application.workflowStageTitle }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Submitted</dt>
          <dd class="mt-1 text-sm">{{ application.submittedAt }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Reference</dt>
          <dd class="mt-1 text-sm">{{ application.reference }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Latest action</dt>
          <dd class="mt-1 text-sm">{{ application.lastAction }}</dd>
        </div>
      </dl>

      <dl class="grid gap-4 rounded-2xl border border-slate-200 p-4 md:grid-cols-2">
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Applicant Name</dt>
          <dd class="mt-1 text-sm font-medium">
            {{ applicant.type === 'individual' ? `${applicant.firstName || ''} ${applicant.surname || ''}`.trim() : applicant.companyName }}
          </dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Primary Email</dt>
          <dd class="mt-1 text-sm">{{ applicant.email || applicant.contactPerson?.email || 'N/A' }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Primary Phone</dt>
          <dd class="mt-1 text-sm">{{ applicant.phoneNumber || applicant.contactPerson?.phoneNumber || 'N/A' }}</dd>
        </div>
        <div v-if="applicant.type !== 'individual'">
          <dt class="text-xs uppercase tracking-wide text-slate-500">Contact Person</dt>
          <dd class="mt-1 text-sm">{{ applicant.contactPerson?.name || 'N/A' }}</dd>
        </div>
      </dl>

      <div class="rounded-2xl border border-slate-200 p-4">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Application References</h3>
        <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <article v-for="row in referenceRows" :key="row.label" class="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p class="text-xs uppercase tracking-wide text-slate-500">{{ row.label }}</p>
            <p class="mt-1 text-sm font-medium text-slate-800">{{ row.value }}</p>
          </article>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 p-4">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Fees Breakdown</h3>
        <el-table class="mt-3" :data="application.fees?.breakdown || []" empty-text="No fee rows available">
          <el-table-column prop="label" label="Line Item" min-width="220" />
          <el-table-column prop="amount" label="Amount" min-width="140">
            <template #default="scope">{{ Number(scope.row.amount || 0).toLocaleString() }}</template>
          </el-table-column>
        </el-table>
      </div>

      <div class="rounded-2xl border border-slate-200 p-4" v-if="trademarkRecordation">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Trademark Recordation Request</h3>
        <dl class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div class="rounded-lg bg-slate-50 p-3">
            <dt class="text-xs uppercase tracking-wide text-slate-500">Request Type</dt>
            <dd class="mt-1 text-sm font-medium">{{ labelTrademarkRequestType(trademarkRecordation.requestType) }}</dd>
          </div>
          <div class="rounded-lg bg-slate-50 p-3">
            <dt class="text-xs uppercase tracking-wide text-slate-500">Trademark Name</dt>
            <dd class="mt-1 text-sm font-medium">{{ trademarkRecordation.trademarkName || 'N/A' }}</dd>
          </div>
          <div class="rounded-lg bg-slate-50 p-3">
            <dt class="text-xs uppercase tracking-wide text-slate-500">Class of Goods</dt>
            <dd class="mt-1 text-sm font-medium">{{ trademarkRecordation.classOfGoods || 'N/A' }}</dd>
          </div>
          <div class="rounded-lg bg-slate-50 p-3">
            <dt class="text-xs uppercase tracking-wide text-slate-500">Registration Reference</dt>
            <dd class="mt-1 text-sm font-medium">{{ trademarkRecordation.registrationReference || 'N/A' }}</dd>
          </div>
          <div class="rounded-lg bg-slate-50 p-3">
            <dt class="text-xs uppercase tracking-wide text-slate-500">Owner</dt>
            <dd class="mt-1 text-sm font-medium">{{ trademarkRecordation.ownerFullName || 'N/A' }}</dd>
          </div>
          <div class="rounded-lg bg-slate-50 p-3">
            <dt class="text-xs uppercase tracking-wide text-slate-500">Owner Jurisdiction</dt>
            <dd class="mt-1 text-sm font-medium">{{ trademarkRecordation.ownerNationalityOrJurisdiction || 'N/A' }}</dd>
          </div>
          <div class="rounded-lg bg-slate-50 p-3 md:col-span-2">
            <dt class="text-xs uppercase tracking-wide text-slate-500">Owner Address</dt>
            <dd class="mt-1 text-sm font-medium">{{ trademarkRecordation.ownerBusinessAddress || 'N/A' }}</dd>
          </div>
          <div class="rounded-lg bg-slate-50 p-3 md:col-span-2">
            <dt class="text-xs uppercase tracking-wide text-slate-500">Request Notes</dt>
            <dd class="mt-1 text-sm font-medium">{{ trademarkRecordation.notes || 'N/A' }}</dd>
          </div>
        </dl>

        <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <article class="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p class="text-xs uppercase tracking-wide text-slate-500">Payment Status</p>
            <p class="mt-1 text-sm font-semibold">{{ trademarkRecordation.payment?.status || 'N/A' }}</p>
          </article>
          <article class="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p class="text-xs uppercase tracking-wide text-slate-500">Control Number</p>
            <p class="mt-1 text-sm font-semibold">{{ trademarkRecordation.payment?.controlNumber || 'N/A' }}</p>
          </article>
          <article class="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p class="text-xs uppercase tracking-wide text-slate-500">Paid Amount (TZS)</p>
            <p class="mt-1 text-sm font-semibold">{{ Number(trademarkRecordation.payment?.amountPaid || 0).toLocaleString() }}</p>
          </article>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 p-4" v-if="trademarkAttachmentRows.length">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Submitted Trademark Documents</h3>
        <el-table class="mt-3" :data="trademarkAttachmentRows">
          <el-table-column prop="documentType" label="Document Type" min-width="170" />
          <el-table-column prop="fileName" label="File Name" min-width="200" />
          <el-table-column prop="referenceNumber" label="Reference" min-width="160" />
          <el-table-column prop="issuedDate" label="Issued Date" min-width="120" />
        </el-table>
      </div>

      <div class="rounded-2xl border border-slate-200 p-4" v-if="application.trademarkVersions?.length">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Trademark Versions</h3>
        <el-table class="mt-3" :data="application.trademarkVersions">
          <el-table-column prop="versionTag" label="Version" min-width="120" />
          <el-table-column prop="markName" label="Trademark" min-width="180" />
          <el-table-column prop="purpose" label="Purpose" min-width="160" />
          <el-table-column prop="classCount" label="Classes" min-width="120" />
        </el-table>
      </div>

      <div class="rounded-2xl border border-slate-200 p-4" v-if="application.contracts?.length">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">SFCC Contracts</h3>
        <el-table class="mt-3" :data="application.contracts">
          <el-table-column prop="contractName" label="Contract Name" min-width="220" />
          <el-table-column prop="contractCategory" label="Category" min-width="160" />
          <el-table-column prop="language" label="Language" min-width="120" />
          <el-table-column prop="pages" label="Pages" min-width="90" />
        </el-table>
      </div>

      <div class="rounded-2xl border border-slate-200 p-4" v-if="application.mergerClearance">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Merger Clearance</h3>
        <dl class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div class="rounded-lg bg-slate-50 p-3">
            <dt class="text-xs uppercase tracking-wide text-slate-500">Transaction Type</dt>
            <dd class="mt-1 text-sm font-medium">{{ application.mergerClearance.transactionType || 'N/A' }}</dd>
          </div>
          <div class="rounded-lg bg-slate-50 p-3">
            <dt class="text-xs uppercase tracking-wide text-slate-500">Transaction Value</dt>
            <dd class="mt-1 text-sm font-medium">{{ Number(application.mergerClearance.transactionValue || 0).toLocaleString() }}</dd>
          </div>
          <div class="rounded-lg bg-slate-50 p-3 md:col-span-2">
            <dt class="text-xs uppercase tracking-wide text-slate-500">Parties Involved</dt>
            <dd class="mt-1 text-sm font-medium">{{ application.mergerClearance.partiesInvolved || 'N/A' }}</dd>
          </div>
          <div class="rounded-lg bg-slate-50 p-3">
            <dt class="text-xs uppercase tracking-wide text-slate-500">Target Firm</dt>
            <dd class="mt-1 text-sm font-medium">{{ application.mergerClearance.targetFirmName || 'N/A' }}</dd>
          </div>
          <div class="rounded-lg bg-slate-50 p-3">
            <dt class="text-xs uppercase tracking-wide text-slate-500">Confidentiality Claim (FCC-2)</dt>
            <dd class="mt-1 text-sm font-medium">
              {{ application.mergerClearance.confidentialityClaimRequired ? 'Claimed' : 'Not Claimed' }}
            </dd>
          </div>
          <div class="rounded-lg bg-slate-50 p-3 md:col-span-2">
            <dt class="text-xs uppercase tracking-wide text-slate-500">Acquisition Description</dt>
            <dd class="mt-1 text-sm font-medium">{{ application.mergerClearance.acquisitionDescription || 'N/A' }}</dd>
          </div>
          <div class="rounded-lg bg-slate-50 p-3 md:col-span-2">
            <dt class="text-xs uppercase tracking-wide text-slate-500">Commercial Rationale</dt>
            <dd class="mt-1 text-sm font-medium">{{ application.mergerClearance.commercialRationale || 'N/A' }}</dd>
          </div>
          <div class="rounded-lg bg-slate-50 p-3 md:col-span-2">
            <dt class="text-xs uppercase tracking-wide text-slate-500">Relevant Market Definition</dt>
            <dd class="mt-1 text-sm font-medium">{{ application.mergerClearance.relevantMarketDefinition || 'N/A' }}</dd>
          </div>
        </dl>
      </div>

      <div class="rounded-2xl border border-slate-200 p-4" v-if="serviceDetailRows.length">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Service Details</h3>
        <el-table class="mt-3" :data="serviceDetailRows" empty-text="No service details available">
          <el-table-column prop="label" label="Field" min-width="180" />
          <el-table-column prop="value" label="Value" min-width="260" />
        </el-table>
      </div>

      <div class="rounded-2xl border border-slate-200 p-4">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Workflow Stages</h3>
        <div class="mt-3 flex flex-wrap gap-2">
          <el-tag
            v-for="stage in workflowStages"
            :key="stage.key"
            :type="stage.key === application.workflowStageKey ? 'primary' : 'info'"
            effect="light"
          >
            {{ stage.title }}
          </el-tag>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div class="rounded-2xl border border-slate-200 p-4">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Stage History</h3>
          <el-table class="mt-3" :data="historyRows" empty-text="No stage history available">
            <el-table-column prop="stage" label="Stage" min-width="160" />
            <el-table-column prop="at" label="Date" min-width="130" />
            <el-table-column prop="by" label="Updated by" min-width="180" />
          </el-table>
        </div>

        <div class="rounded-2xl border border-slate-200 p-4">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Workflow Assets</h3>
          <ul class="mt-3 space-y-2 text-sm">
            <li class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Reviews</span>
              <strong>{{ reviews.length }}</strong>
            </li>
            <li class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Reports</span>
              <strong>{{ reports.length }}</strong>
            </li>
            <li class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Submissions</span>
              <strong>{{ submissions.length }}</strong>
            </li>
            <li class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Attachments</span>
              <strong>{{ attachments.length }}</strong>
            </li>
            <li class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Audit Rows</span>
              <strong>{{ auditTrail.length }}</strong>
            </li>
          </ul>
        </div>
      </div>

      <article class="mt-6 rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
        <h3 class="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Application Timeline</h3>
        <ApplicationTimeline :events="timelineEvents" />
      </article>

      <!-- What Happens Next -->
      <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 class="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">What happens next?</h3>
        <p class="text-sm text-blue-700 dark:text-blue-300">{{ nextStepDescription }}</p>
      </div>

      <div v-if="!isPreviewApplication" class="rounded-2xl border border-slate-200 p-4">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Workflow Actions</h3>
        <div class="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <article class="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <h4 class="text-sm font-semibold">Assignments</h4>
            <div class="mt-2 space-y-2">
              <el-input v-model="actionForm.director" placeholder="Director ID / Name" />
              <el-input v-model="actionForm.manager" placeholder="Manager ID / Name" />
              <el-input v-model="actionForm.officer" placeholder="Officer ID / Name" />
              <div class="flex flex-wrap gap-2">
                <el-button size="small" :loading="actionLoading" @click="runAction('assignDirector', { director: actionForm.director }, 'Director assigned')">Assign Director</el-button>
                <el-button size="small" :loading="actionLoading" @click="runAction('assignManager', { manager: actionForm.manager }, 'Manager assigned')">Assign Manager</el-button>
                <el-button size="small" :loading="actionLoading" @click="runAction('assignOfficer', { officer: actionForm.officer }, 'Officer assigned')">Assign Officer</el-button>
                <el-button size="small" :loading="actionLoading" @click="runAction('reassignDirector', { director: actionForm.director }, 'Director reassigned')">Reassign Director</el-button>
                <el-button size="small" :loading="actionLoading" @click="runAction('reassignManager', { manager: actionForm.manager }, 'Manager reassigned')">Reassign Manager</el-button>
                <el-button size="small" :loading="actionLoading" @click="runAction('reassignOfficer', { officer: actionForm.officer }, 'Officer reassigned')">Reassign Officer</el-button>
              </div>
            </div>
          </article>

          <article class="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <h4 class="text-sm font-semibold">Status and Links</h4>
            <div class="mt-2 space-y-2">
              <el-input v-model="actionForm.status" placeholder="Status (e.g. under_review)" />
              <el-input v-model="actionForm.stage" placeholder="Stage key" />
              <el-input v-model="actionForm.notes" placeholder="Notes" />
              <el-input v-model="actionForm.activity" placeholder="Activity ID" />
              <el-input v-model="actionForm.task" placeholder="Task ID" />
              <div class="flex flex-wrap gap-2">
                <el-button size="small" :loading="actionLoading" @click="runAction('updateStatus', { status: actionForm.status, stage: actionForm.stage, notes: actionForm.notes }, 'Status updated')">Update Status</el-button>
                <el-button size="small" :loading="actionLoading" @click="runAction('linkActivity', { activity: actionForm.activity, notes: actionForm.notes }, 'Activity linked')">Link Activity</el-button>
                <el-button size="small" :loading="actionLoading" @click="runAction('linkTask', { task: actionForm.task, notes: actionForm.notes }, 'Task linked')">Link Task</el-button>
              </div>
            </div>
          </article>

          <article class="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <h4 class="text-sm font-semibold">Review and Report</h4>
            <div class="mt-2 space-y-2">
              <el-input v-model="actionForm.reviewTitle" placeholder="Review title" />
              <el-input v-model="actionForm.reviewReport" type="textarea" :rows="2" placeholder="Review summary" />
              <el-button size="small" :loading="actionLoading" @click="runAction('addReview', { review: actionReviewSummary() }, 'Review added')">Add Review</el-button>

              <el-select v-model="actionForm.reviewId" clearable placeholder="Select review">
                <el-option v-for="review in reviews" :key="review.reviewId" :label="review.reviewId" :value="review.reviewId" />
              </el-select>
              <div class="flex flex-wrap gap-2">
                <el-button size="small" :disabled="!actionForm.reviewId" :loading="actionLoading" @click="runAction('editReview', { reviewId: actionForm.reviewId, changes: { title: actionForm.reviewTitle, report: actionForm.reviewReport } }, 'Review updated')">Edit Review</el-button>
                <el-button size="small" :disabled="!actionForm.reviewId" :loading="actionLoading" @click="runAction('submitReview', { reviewId: actionForm.reviewId }, 'Review submitted')">Submit Review</el-button>
                <el-button size="small" :disabled="!actionForm.reviewId" :loading="actionLoading" @click="runAction('approveReview', { reviewId: actionForm.reviewId }, 'Review approved')">Approve Review</el-button>
                <el-button size="small" :disabled="!actionForm.reviewId" :loading="actionLoading" @click="runAction('rejectReview', { reviewId: actionForm.reviewId }, 'Review rejected')">Reject Review</el-button>
              </div>

              <el-input v-model="actionForm.reportTitle" placeholder="Report title" />
              <el-input v-model="actionForm.reportBody" type="textarea" :rows="2" placeholder="Report summary" />
              <el-button size="small" :loading="actionLoading" @click="runAction('addReport', { report: actionReportSummary() }, 'Report added')">Add Report</el-button>

              <el-select v-model="actionForm.reportId" clearable placeholder="Select report">
                <el-option v-for="report in reports" :key="report.reportId" :label="report.reportId" :value="report.reportId" />
              </el-select>
              <div class="flex flex-wrap gap-2">
                <el-button size="small" :disabled="!actionForm.reportId" :loading="actionLoading" @click="runAction('editReport', { reportId: actionForm.reportId, changes: { title: actionForm.reportTitle, body: actionForm.reportBody } }, 'Report updated')">Edit Report</el-button>
                <el-button size="small" :disabled="!actionForm.reportId" :loading="actionLoading" @click="runAction('submitReport', { reportId: actionForm.reportId }, 'Report submitted')">Submit Report</el-button>
                <el-button size="small" :disabled="!actionForm.reportId" :loading="actionLoading" @click="runAction('approveReport', { reportId: actionForm.reportId }, 'Report approved')">Approve Report</el-button>
                <el-button size="small" :disabled="!actionForm.reportId" :loading="actionLoading" @click="runAction('rejectReport', { reportId: actionForm.reportId }, 'Report rejected')">Reject Report</el-button>
              </div>

              <el-divider />
              <el-input v-model="actionForm.attachmentName" placeholder="Attachment file name" />
              <el-input v-model="actionForm.attachmentId" placeholder="Attachment ID (for edit/remove)" />
              <div class="flex flex-wrap gap-2">
                <el-button size="small" :loading="actionLoading" @click="runAction('addAttachment', { attachment: { fileName: actionForm.attachmentName || 'attachment' } }, 'Attachment added')">Add Attachment</el-button>
                <el-button size="small" :disabled="!actionForm.attachmentId" :loading="actionLoading" @click="runAction('editAttachment', { attachmentId: actionForm.attachmentId, changes: { fileName: actionForm.attachmentName || 'attachment' } }, 'Attachment updated')">Edit Attachment</el-button>
                <el-button size="small" :disabled="!actionForm.attachmentId" :loading="actionLoading" @click="runAction('removeAttachment', { attachmentId: actionForm.attachmentId }, 'Attachment removed')">Remove Attachment</el-button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>
