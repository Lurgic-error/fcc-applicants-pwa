<script setup>
import { computed } from 'vue'
import TrademarkRecordationWizard from '@/pages/Trademarks/TrademarkRecordationWizard.vue'
import GenericServiceWizardAdapter from '@/components/wizards/GenericServiceWizardAdapter.vue'
import SFCCWizardAdapter from '@/components/wizards/SFCCWizardAdapter.vue'
import ExemptionWizardAdapter from '@/components/wizards/ExemptionWizardAdapter.vue'
import LegalOpinionWizardAdapter from '@/components/wizards/LegalOpinionWizardAdapter.vue'

const props = defineProps({
  serviceKey: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    default: 'create'
  }
})

const isTrademarkService = computed(() => props.serviceKey === 'trademark-recordation')
const isSfccService = computed(() => props.serviceKey === 'sfcc-registration')
const isExemptionService = computed(() => props.serviceKey === 'exemption')
const isLegalOpinionService = computed(() => props.serviceKey === 'legal-opinion')
</script>

<template>
  <TrademarkRecordationWizard
    v-if="isTrademarkService"
    :mode="mode"
  />
  <SFCCWizardAdapter
    v-else-if="isSfccService"
    :service-key="serviceKey"
    :mode="mode"
  />
  <ExemptionWizardAdapter
    v-else-if="isExemptionService"
    :service-key="serviceKey"
    :mode="mode"
  />
  <LegalOpinionWizardAdapter
    v-else-if="isLegalOpinionService"
    :service-key="serviceKey"
    :mode="mode"
  />
  <GenericServiceWizardAdapter
    v-else
    :service-key="serviceKey"
    :mode="mode"
  />
</template>
