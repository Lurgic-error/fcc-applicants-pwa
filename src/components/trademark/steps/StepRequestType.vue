<script setup>
import { inject } from 'vue'
import TrademarkRequestTypeSelector from '@/components/trademark/TrademarkRequestTypeSelector.vue'
import { TRADEMARK_REQUEST_TYPE_OPTIONS } from '@/constants/trademarkRecordation'

const form = inject('wizardForm')
</script>

<template>
  <div class="space-y-4">
    <div>
      <h2 class="text-lg font-semibold text-slate-800">Select Request Type</h2>
      <p class="mt-1 text-sm text-slate-500">
        Choose the type of trademark recordation request you wish to submit.
      </p>
    </div>

    <TrademarkRequestTypeSelector
      v-model="form.requestType"
      :options="TRADEMARK_REQUEST_TYPE_OPTIONS"
    />
  </div>
</template>
