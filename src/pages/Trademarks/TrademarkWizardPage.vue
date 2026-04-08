<script setup>
import TrademarkApplicationPage from './TrademarkApplicationPage.vue'

defineProps({
  mode: {
    type: String,
    default: 'create'
  }
})
</script>

<template>
  <TrademarkApplicationPage :mode="mode" />
</template>
