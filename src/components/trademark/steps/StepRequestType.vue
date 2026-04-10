<script setup>
import { inject } from 'vue'
import TrademarkRequestTypeSelector from '@/components/trademark/TrademarkRequestTypeSelector.vue'
import { TRADEMARK_REQUEST_TYPE_OPTIONS } from '@/constants/trademarkRecordation'

const form = inject('wizardForm')
</script>

<template>
  <div class="space-y-4">
    <div>
      <h3 class="wizard-step__title">Select Request Type</h3>
      <p class="wizard-step__description">
        Choose the type of trademark recordation request you wish to submit.
      </p>
    </div>

    <TrademarkRequestTypeSelector
      v-model="form.requestType"
      :options="TRADEMARK_REQUEST_TYPE_OPTIONS"
    />
  </div>
</template>
