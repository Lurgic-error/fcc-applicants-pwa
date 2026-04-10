<script setup>
/**
 * TrademarkPaymentPanel — backward-compatibility wrapper around GePGPaymentPanel.
 * All logic lives in GePGPaymentPanel; this file just re-exports it transparently.
 */
import GePGPaymentPanel from '@/components/forms/GePGPaymentPanel.vue'
</script>

<template>
  <GePGPaymentPanel v-bind="$attrs" />
</template>

<script>
export default { inheritAttrs: false }
</script>
