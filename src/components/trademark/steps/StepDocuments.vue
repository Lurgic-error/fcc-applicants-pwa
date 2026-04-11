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
        Upload all required supporting documents for your request.
    </div>

    <!-- Required documents info box -->
    <div
      v-if="requiredDocs.length"
      class="wizard-step__info"
    >
      <strong>Required Documents</strong>
      <ul>
        <li
          v-for="doc in requiredDocs"
          :key="doc.key"
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
