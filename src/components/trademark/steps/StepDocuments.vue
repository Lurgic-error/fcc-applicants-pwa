<script setup>
import { inject, computed } from 'vue'
import TrademarkAttachmentManager from '@/components/trademark/TrademarkAttachmentManager.vue'
import { getTrademarkRequiredDocuments } from '@/constants/trademarkRecordation'

const form = inject('wizardForm')

const requiredDocs = computed(() =>
  getTrademarkRequiredDocuments(form.requestType, {
    includePaymentProof: false,
    requiresAgent: form.applicantRole === 'agent'
  })
)
</script>

<template>
  <div class="space-y-5">
    <div>
      <h2 class="text-lg font-semibold text-slate-800">Documents & Attachments</h2>
      <p class="mt-1 text-sm text-slate-500">
        Upload all required supporting documents for your request.
      </p>
    </div>

    <!-- Required documents info box -->
    <div
      v-if="requiredDocs.length"
      class="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3"
    >
      <p class="text-sm font-semibold text-sky-800">Required Documents</p>
      <ul class="mt-2 list-inside list-disc space-y-1">
        <li
          v-for="doc in requiredDocs"
          :key="doc.key"
          class="text-sm text-sky-700"
        >
          {{ doc.label }}
        </li>
      </ul>
    </div>

    <TrademarkAttachmentManager
      v-model="form.attachments"
      :required-documents="requiredDocs"
    />
  </div>
</template>
