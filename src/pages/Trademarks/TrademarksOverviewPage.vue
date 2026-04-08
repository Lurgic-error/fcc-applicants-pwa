<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ActionDropdown from '@/components/ActionDropdown.vue'
import { FccStatusBadge as StatusBadge } from '@shared/design-system/components'
import { TRADEMARK_REQUEST_TYPE_OPTIONS } from '@/constants/trademarkRecordation'
import {
  TRADEMARK_APPLICANT_STATUS_ORDER,
  toTrademarkApplicantRow
} from '@/constants/trademarkApplicantViews'
import { useApplicantDataStore } from '@/stores/applications'

const router = useRouter()
const dataStore = useApplicantDataStore()

onMounted(() => {
  dataStore.loadApplications()
})

const liveRows = computed(() =>
  dataStore
    .applicationsByService('trademark-recordation')
    .map((application) => toTrademarkApplicantRow(application))
)

const rows = computed(() => liveRows.value)
const hasRows = computed(() => rows.value.length > 0)

const statusSummary = computed(() =>
  TRADEMARK_APPLICANT_STATUS_ORDER.map((status) => ({
    status,
    count: rows.value.filter((row) => row.status === status).length
  }))
)

const requestMix = computed(() =>
  TRADEMARK_REQUEST_TYPE_OPTIONS.map((item) => ({
    ...item,
    count: rows.value.filter((row) => row.requestType === item.key).length
  }))
)

function openDetails(row) {
  router.push({ name: 'trademark-details', params: { id: row.applicationId } })
}

function openUpdate(row) {
  router.push({ name: 'trademark-update', params: { id: row.applicationId } })
}

function startRequest(requestType = 'new_recordation') {
  router.push({
    name: 'trademark-create',
    query: { requestType }
  })
}

function onRequestAction(command) {
  startRequest(command || 'new_recordation')
}

function onRowAction(command, row) {
  if (command === 'open') {
    openDetails(row)
    return
  }
  if (command === 'edit') {
    openUpdate(row)
  }
}
</script>

<template>
  <section class="space-y-5">
    <div class="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-sky-900 to-cyan-900 p-5 text-slate-100 shadow-panel md:p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="max-w-2xl">
          <p class="text-xs uppercase tracking-[0.22em] text-cyan-200">Trademark Recordation</p>
          <h2 class="mt-2 text-2xl font-semibold md:text-3xl">My Trademark Requests</h2>
          <p class="mt-2 text-sm text-slate-200">
            Submit and track trademark recordation requests from draft to final decision.
          </p>
        </div>
        <ActionDropdown
          label="New Request"
          :button-plain="false"
          button-size="large"
          :items="requestMix.map((item) => ({ key: item.key, label: item.shortLabel }))"
          @select="({ command }) => onRequestAction(command)"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <article
        v-for="item in statusSummary"
        :key="item.status"
        class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
      >
        <p class="text-xs uppercase tracking-wide text-slate-500">{{ item.status }}</p>
        <p class="mt-1 text-2xl font-semibold text-slate-900">{{ item.count }}</p>
      </article>
    </div>

    <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="font-semibold text-slate-900">Request Type Mix</h3>
        <span class="text-xs text-slate-500">Trademark-specific</span>
      </div>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <button
          v-for="item in requestMix"
          :key="item.key"
          type="button"
          class="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-sky-300 hover:bg-sky-50"
          @click="startRequest(item.key)"
        >
          <p class="text-xs uppercase tracking-wide text-slate-500">{{ item.shortLabel }}</p>
          <p class="mt-1 text-xl font-semibold text-slate-900">{{ item.count }}</p>
          <p class="mt-1 text-xs text-slate-600">{{ item.description }}</p>
        </button>
      </div>
    </article>

    <article v-if="hasRows" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="font-semibold text-slate-900">Trademark Applications</h3>
        <span class="text-xs text-slate-500">Live rows</span>
      </div>

      <div class="overflow-x-auto rounded-2xl border border-slate-200">
        <el-table :data="rows" v-loading="dataStore.loading" class="w-full min-w-[980px]" empty-text="No trademark applications found">
          <el-table-column prop="applicationId" label="Application ID" min-width="170" />
          <el-table-column prop="requestTypeLabel" label="Request Type" min-width="180" />
          <el-table-column prop="trademarkName" label="Trademark" min-width="180" />
          <el-table-column prop="classOfGoods" label="Class" min-width="150" />
          <el-table-column prop="submittedAt" label="Submitted" min-width="120" />
          <el-table-column label="Status" min-width="130">
            <template #default="scope">
              <StatusBadge :status="scope.row.status" />
            </template>
          </el-table-column>
          <el-table-column label="Payment" min-width="130">
            <template #default="scope">
              <StatusBadge :status="scope.row.paymentStatus" />
            </template>
          </el-table-column>
          <el-table-column prop="certificateStatus" label="Certificate" min-width="130" />
          <el-table-column label="Action" min-width="160">
            <template #default="scope">
              <ActionDropdown
                label="Actions"
                :button-plain="false"
                :items="[
                  { key: 'open', label: 'Open' },
                  { key: 'edit', label: 'Edit' }
                ]"
                @select="({ command }) => onRowAction(command, scope.row)"
              />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </article>

    <article v-else class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <el-empty description="No trademark applications are linked to this account yet.">
        <ActionDropdown
          label="Start Trademark Request"
          :button-plain="false"
          :items="requestMix.map((item) => ({ key: item.key, label: item.shortLabel }))"
          @select="({ command }) => onRequestAction(command)"
        />
      </el-empty>
    </article>
  </section>
</template>
