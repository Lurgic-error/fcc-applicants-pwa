<script setup>
import { FccPageHeader } from '@shared/design-system/components'
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import FileDropZone from '@/components/FileDropZone.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import http from '@/services/http'
import { fetchApplicantApplications } from '@/services/applicantApi'

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function submitSupportTicket(payload) {
  const { data } = await http.post('/api/v1/service-requests', {
    title: payload.subject,
    description: payload.description,
    serviceCatalogCode: 'support',
    priority: 'medium',
    category: payload.category,
    relatedApplicationId: payload.relatedApplicationId || undefined,
    attachments: payload.attachments || [],
  })
  return data
}

async function loadMyTickets() {
  const { data } = await http.get('/api/v1/service-requests/my-requests')
  return data
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const activeTab = ref('new-ticket')
const activeCollapse = ref([])
const showTicketDialog = ref(false)
const submittingTicket = ref(false)
const loadingTickets = ref(false)
const expandedTicket = ref(null)

const tickets = ref([])
const userApplications = ref([])

const ticketForm = reactive({
  subject: '',
  category: '',
  description: '',
  relatedApplicationId: '',
  attachments: [],
})

const categories = [
  { value: 'general', label: 'General' },
  { value: 'technical', label: 'Technical' },
  { value: 'payment', label: 'Payment' },
  { value: 'application_status', label: 'Application Status' },
  { value: 'account', label: 'Account' },
]

const faqs = [
  {
    name: 'faq-1',
    question: 'How do I create an applicant account?',
    answer: 'Click the "Create Applicant Account" button on the home page. Fill in your business name, email address, and contact details. You will receive a verification email to activate your account before you can submit applications.',
  },
  {
    name: 'faq-2',
    question: 'What documents are required for an application?',
    answer: 'Document requirements vary by service type. Generally, you will need a business registration certificate, TIN certificate, and service-specific documents. The application wizard will guide you through the exact requirements for your selected service.',
  },
  {
    name: 'faq-3',
    question: 'How do I make a payment for my application?',
    answer: 'Payments are processed through the Government Electronic Payment Gateway (GePG). Once your application is reviewed and a fee is assessed, you will receive a control number. Use this control number to pay via bank transfer, mobile money, or at any authorized payment point.',
  },
  {
    name: 'faq-4',
    question: 'How long does it take to process an application?',
    answer: 'Processing times vary by service type. Trademark Recordation typically takes 14-30 days, Merger Clearance 14-90 days depending on complexity, and SFCC Registration 14-21 days. You can track your application status in real-time through your dashboard.',
  },
  {
    name: 'faq-5',
    question: 'Can I update my application after submission?',
    answer: 'Yes, you can update certain fields of your application before it enters the review stage. Navigate to your application details page and click "Update Application". If your application is already under review, contact the assigned officer for guidance.',
  },
  {
    name: 'faq-6',
    question: 'How do I track the status of my application?',
    answer: 'Log in to your account and visit the Dashboard. All your applications are listed with their current workflow stage and status. Click on any application to view detailed progress, officer comments, and payment information.',
  },
  {
    name: 'faq-7',
    question: 'What should I do if I forgot my password?',
    answer: 'Click the "Forgot Password" link on the login page. Enter your registered email address and follow the instructions sent to your inbox to reset your password. If you do not receive the email, check your spam folder or contact support.',
  },
  {
    name: 'faq-8',
    question: 'How do I download my certificate after approval?',
    answer: 'Once your application is approved and the certificate is issued, navigate to the Certificates section in your dashboard. Click on the relevant certificate to view details and use the download button to save a PDF copy.',
  },
]

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------

const ticketCount = computed(() => tickets.value.length)

function categoryLabel(value) {
  return categories.find((c) => c.value === value)?.label ?? value ?? '—'
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-TZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

function handleFilesSelected(files) {
  ticketForm.attachments = files
}

function removeAttachment(index) {
  ticketForm.attachments.splice(index, 1)
}

function toggleTicket(ticketId) {
  expandedTicket.value = expandedTicket.value === ticketId ? null : ticketId
}

function resetForm() {
  ticketForm.subject = ''
  ticketForm.category = ''
  ticketForm.description = ''
  ticketForm.relatedApplicationId = ''
  ticketForm.attachments = []
}

const handleTicketSubmit = async () => {
  if (!ticketForm.subject.trim()) {
    ElMessage.warning('Please enter a subject.')
    return
  }
  if (!ticketForm.category) {
    ElMessage.warning('Please select a category.')
    return
  }
  if (!ticketForm.description.trim()) {
    ElMessage.warning('Please enter a description.')
    return
  }

  submittingTicket.value = true
  try {
    await submitSupportTicket({
      subject: ticketForm.subject.trim(),
      category: ticketForm.category,
      description: ticketForm.description.trim(),
      relatedApplicationId: ticketForm.relatedApplicationId || null,
      attachments: ticketForm.attachments,
    })
    ElMessage.success('Support ticket submitted. We will respond shortly.')
    resetForm()
    showTicketDialog.value = false
    // Refresh ticket list
    await fetchTickets()
    activeTab.value = 'my-tickets'
  } catch (err) {
    const msg = err?.response?.data?.message || 'Failed to submit ticket. Please try again.'
    ElMessage.error(msg)
  } finally {
    submittingTicket.value = false
  }
}

async function fetchTickets() {
  loadingTickets.value = true
  try {
    const result = await loadMyTickets()
    tickets.value = Array.isArray(result) ? result : (result?.data ?? result?.requests ?? [])
  } catch {
    // Silently fail — user may not have submitted any tickets yet
    tickets.value = []
  } finally {
    loadingTickets.value = false
  }
}

async function fetchApplications() {
  try {
    const result = await fetchApplicantApplications()
    userApplications.value = Array.isArray(result) ? result : []
  } catch {
    userApplications.value = []
  }
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

onMounted(() => {
  fetchTickets()
  fetchApplications()
})
</script>

<template>
  <section>
    <FccPageHeader
      title="Support"
      subtitle="Get help if you face issues with your FCC applicant account or submissions."
      borderless
    />

    <!-- Tab bar -->
    <div class="mt-6 flex items-center justify-between gap-4">
      <div class="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
        <button
          class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          :class="activeTab === 'new-ticket'
            ? 'bg-fcc-brand text-white shadow-sm'
            : 'text-slate-600 hover:text-fcc-ink dark:text-slate-400 dark:hover:text-slate-100'"
          @click="activeTab = 'new-ticket'"
        >
          New Ticket
        </button>
        <button
          class="relative rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          :class="activeTab === 'my-tickets'
            ? 'bg-fcc-brand text-white shadow-sm'
            : 'text-slate-600 hover:text-fcc-ink dark:text-slate-400 dark:hover:text-slate-100'"
          @click="activeTab = 'my-tickets'"
        >
          My Tickets
          <span
            v-if="ticketCount > 0"
            class="ml-1.5 inline-flex items-center justify-center rounded-full bg-white/25 px-1.5 py-0.5 text-xs font-bold leading-none"
            :class="activeTab === 'my-tickets' ? 'text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'"
          >{{ ticketCount }}</span>
        </button>
      </div>
    </div>

    <!-- ===== NEW TICKET FORM ===== -->
    <div v-if="activeTab === 'new-ticket'" class="mt-6">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h2 class="text-lg font-semibold text-fcc-ink dark:text-slate-100">Submit a Support Ticket</h2>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Describe your issue and our team will respond within one business day.
        </p>

        <el-form label-position="top" class="mt-6 space-y-1" v-loading="submittingTicket">
          <!-- Subject -->
          <el-form-item label="Subject" required>
            <el-input
              v-model="ticketForm.subject"
              placeholder="Brief summary of your issue"
              maxlength="150"
              show-word-limit
            />
          </el-form-item>

          <!-- Category + Related Application (side by side on md+) -->
          <div class="grid gap-x-4 md:grid-cols-2">
            <el-form-item label="Category" required>
              <el-select
                v-model="ticketForm.category"
                placeholder="Select a category"
                class="w-full"
              >
                <el-option
                  v-for="cat in categories"
                  :key="cat.value"
                  :label="cat.label"
                  :value="cat.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="Related Application (optional)">
              <el-select
                v-model="ticketForm.relatedApplicationId"
                placeholder="Select an application"
                clearable
                class="w-full"
              >
                <el-option
                  v-for="app in userApplications"
                  :key="app.applicationId ?? app.id"
                  :label="app.applicationNumber ?? app.applicationId ?? app.id"
                  :value="app.applicationId ?? app.id"
                />
              </el-select>
            </el-form-item>
          </div>

          <!-- Description -->
          <el-form-item label="Description" required>
            <el-input
              v-model="ticketForm.description"
              type="textarea"
              :rows="6"
              placeholder="Describe your issue in detail. Include application IDs, error messages, or any other relevant context."
            />
          </el-form-item>

          <!-- Attachments -->
          <el-form-item label="Attachments (optional)">
            <FileDropZone
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              :multiple="true"
              :max-size-mb="10"
              @files-selected="handleFilesSelected"
            />
            <!-- File list -->
            <ul v-if="ticketForm.attachments.length" class="mt-3 space-y-1.5">
              <li
                v-for="(file, idx) in ticketForm.attachments"
                :key="idx"
                class="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                <div class="flex items-center gap-2 overflow-hidden">
                  <i class="fa-solid fa-paperclip text-slate-400" />
                  <span class="truncate text-sm text-slate-700 dark:text-slate-200">{{ file.name }}</span>
                  <span class="shrink-0 text-xs text-slate-400">({{ (file.size / 1024).toFixed(1) }} KB)</span>
                </div>
                <button
                  type="button"
                  class="ml-2 shrink-0 text-slate-400 hover:text-rose-500 transition-colors"
                  @click="removeAttachment(idx)"
                  title="Remove"
                >
                  <i class="fa-solid fa-xmark" />
                </button>
              </li>
            </ul>
          </el-form-item>

          <!-- Submit -->
          <div class="flex justify-end pt-2">
            <el-button
              type="primary"
              :loading="submittingTicket"
              @click="handleTicketSubmit"
            >
              Submit Ticket
            </el-button>
          </div>
        </el-form>
      </div>

      <!-- FAQ Section (below the form) -->
      <div class="mt-10">
        <h2 class="text-xl font-semibold text-fcc-ink dark:text-slate-100">Frequently Asked Questions</h2>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Find quick answers to common questions about FCC applications and services.
        </p>

        <el-collapse v-model="activeCollapse" class="mt-4">
          <el-collapse-item
            v-for="faq in faqs"
            :key="faq.name"
            :title="faq.question"
            :name="faq.name"
          >
            <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{{ faq.answer }}</p>
          </el-collapse-item>
        </el-collapse>
      </div>

      <!-- Contact Information -->
      <div class="mt-10">
        <h2 class="text-xl font-semibold text-fcc-ink dark:text-slate-100">Contact Information</h2>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Reach out to our support team through any of the channels below.</p>

        <div class="mt-5 grid gap-4 md:grid-cols-2">
          <article class="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-5">
            <h3 class="font-semibold text-fcc-ink dark:text-slate-100">Applicant Help Desk</h3>
            <div class="mt-3 space-y-2">
              <div class="flex items-start gap-3">
                <svg class="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Email</p>
                  <p class="text-sm text-slate-700 dark:text-slate-200">applicants.support@fcc.go.tz</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <svg class="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Phone</p>
                  <p class="text-sm text-slate-700 dark:text-slate-200">+255 22 000 0000</p>
                </div>
              </div>
            </div>
          </article>

          <article class="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-5">
            <h3 class="font-semibold text-fcc-ink dark:text-slate-100">Office Details</h3>
            <div class="mt-3 space-y-2">
              <div class="flex items-start gap-3">
                <svg class="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Office Hours</p>
                  <p class="text-sm text-slate-700 dark:text-slate-200">Monday to Friday</p>
                  <p class="text-sm text-slate-700 dark:text-slate-200">08:00 - 17:00 (EAT)</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <svg class="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Physical Address</p>
                  <p class="text-sm text-slate-700 dark:text-slate-200">Fair Competition Commission</p>
                  <p class="text-sm text-slate-700 dark:text-slate-200">Haki House, Luthuli Street</p>
                  <p class="text-sm text-slate-700 dark:text-slate-200">P.O. Box 7883, Dar es Salaam, Tanzania</p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>

    <!-- ===== MY TICKETS LIST ===== -->
    <div v-else-if="activeTab === 'my-tickets'" class="mt-6">

      <!-- Loading state -->
      <div v-if="loadingTickets" class="flex items-center justify-center py-16">
        <el-icon class="animate-spin text-2xl text-fcc-brand"><i class="fa-solid fa-circle-notch" /></el-icon>
        <span class="ml-3 text-sm text-slate-500 dark:text-slate-400">Loading tickets…</span>
      </div>

      <!-- Empty state -->
      <div v-else-if="tickets.length === 0" class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center dark:border-slate-600 dark:bg-slate-900">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <i class="fa-solid fa-ticket text-2xl text-slate-400" />
        </div>
        <h3 class="mt-4 font-semibold text-fcc-ink dark:text-slate-100">No tickets yet</h3>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Submit your first support ticket using the New Ticket tab.</p>
        <el-button type="primary" class="mt-5" @click="activeTab = 'new-ticket'">New Ticket</el-button>
      </div>

      <!-- Ticket list -->
      <ul v-else class="space-y-3">
        <li
          v-for="ticket in tickets"
          :key="ticket.id ?? ticket._id"
          class="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
        >
          <!-- Ticket header (always visible) -->
          <button
            type="button"
            class="flex w-full items-start gap-4 p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            @click="toggleTicket(ticket.id ?? ticket._id)"
          >
            <!-- Ticket number + title -->
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="shrink-0 font-mono text-xs font-semibold text-fcc-brand">
                  {{ ticket.ticketNumber ?? ticket.referenceNumber ?? `TKT-${String(ticket.id ?? ticket._id).slice(-6).toUpperCase()}` }}
                </span>
                <StatusBadge :value="ticket.status ?? 'open'" />
                <span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {{ categoryLabel(ticket.category) }}
                </span>
              </div>
              <p class="mt-1.5 font-medium text-fcc-ink dark:text-slate-100 leading-snug">
                {{ ticket.title ?? ticket.subject ?? '(No subject)' }}
              </p>
              <p class="mt-1 text-xs text-slate-400">Submitted {{ formatDate(ticket.createdAt ?? ticket.created_at) }}</p>
            </div>
            <!-- Expand chevron -->
            <i
              class="fa-solid fa-chevron-down mt-1 shrink-0 text-slate-400 transition-transform"
              :class="expandedTicket === (ticket.id ?? ticket._id) ? 'rotate-180' : ''"
            />
          </button>

          <!-- Expandable detail panel -->
          <div
            v-if="expandedTicket === (ticket.id ?? ticket._id)"
            class="border-t border-slate-100 px-5 pb-5 pt-4 dark:border-slate-700"
          >
            <!-- Description -->
            <div class="mb-4">
              <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Description</p>
              <p class="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {{ ticket.description ?? '—' }}
              </p>
            </div>

            <!-- Related application -->
            <div v-if="ticket.relatedApplicationId" class="mb-4">
              <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Related Application</p>
              <p class="font-mono text-sm text-fcc-ink dark:text-slate-200">{{ ticket.relatedApplicationId }}</p>
            </div>

            <!-- Responses / comments -->
            <div v-if="ticket.responses?.length || ticket.comments?.length">
              <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Responses</p>
              <ul class="space-y-3">
                <li
                  v-for="(response, i) in (ticket.responses ?? ticket.comments)"
                  :key="i"
                  class="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div class="mb-1 flex items-center gap-2">
                    <span class="text-xs font-semibold text-fcc-ink dark:text-slate-100">
                      {{ response.authorName ?? response.author ?? 'FCC Support' }}
                    </span>
                    <span class="text-xs text-slate-400">{{ formatDate(response.createdAt ?? response.created_at) }}</span>
                  </div>
                  <p class="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{{ response.body ?? response.message ?? response.content }}</p>
                </li>
              </ul>
            </div>
            <div v-else>
              <p class="text-sm text-slate-400 italic">No responses yet. We will reply within one business day.</p>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
