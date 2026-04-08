<script setup>
import { onMounted, ref } from 'vue'
import { previewServiceFee } from '@/services/applicantApi'

const props = defineProps({
  serviceKey: { type: String, required: true },
  feeContext: { type: Object, default: () => ({}) }
})

const loading = ref(false)
const fee = ref(null)
const error = ref(null)

async function loadFeePreview() {
  loading.value = true
  error.value = null
  try {
    const result = await previewServiceFee({ serviceKey: props.serviceKey, feeContext: props.feeContext })
    if (result?.error) throw new Error(result.error)
    fee.value = result?.fee || result?.data?.fee || null
  } catch (err) {
    error.value = err?.message || 'Failed to load fee preview'
  } finally {
    loading.value = false
  }
}

function formatAmount(value) {
  return `TZS ${Number(value || 0).toLocaleString()}`
}

onMounted(loadFeePreview)
</script>

<template>
  <div>
    <el-skeleton v-if="loading" :rows="5" animated />

    <el-alert v-else-if="error" type="warning" :title="error" :closable="false" show-icon />

    <div v-else-if="fee" class="space-y-4">
      <div v-if="fee.breakdown?.length" class="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th class="px-4 py-2 text-left font-medium text-slate-700 dark:text-slate-200">Item</th>
              <th class="px-4 py-2 text-right font-medium text-slate-700 dark:text-slate-200">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in fee.breakdown" :key="item.code" class="border-t border-slate-200 dark:border-slate-700">
              <td class="px-4 py-2 text-slate-900 dark:text-slate-100">
                {{ item.label }}
                <span v-if="item.quantity > 1" class="text-xs text-slate-500"> x{{ item.quantity }}</span>
              </td>
              <td class="px-4 py-2 text-right text-slate-900 dark:text-slate-100">{{ formatAmount(item.amount) }}</td>
            </tr>
          </tbody>
          <tfoot class="bg-slate-50 dark:bg-slate-800">
            <tr v-if="fee.taxAmount" class="border-t border-slate-200 dark:border-slate-700">
              <td class="px-4 py-2 text-slate-600 dark:text-slate-300">VAT</td>
              <td class="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{{ formatAmount(fee.taxAmount) }}</td>
            </tr>
            <tr v-if="fee.discountAmount" class="border-t border-slate-200 dark:border-slate-700">
              <td class="px-4 py-2 text-green-600">Discount</td>
              <td class="px-4 py-2 text-right text-green-600">-{{ formatAmount(fee.discountAmount) }}</td>
            </tr>
            <tr class="border-t-2 border-slate-300 dark:border-slate-600">
              <td class="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">Total</td>
              <td class="px-4 py-3 text-right text-lg font-semibold text-fcc-brand">{{ formatAmount(fee.totalAmount) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div v-else class="rounded-2xl border border-slate-200 p-4 text-center dark:border-slate-700">
        <p class="text-2xl font-semibold text-fcc-brand">{{ formatAmount(fee.totalAmount || fee.amount) }}</p>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Application Fee</p>
      </div>

      <el-button link type="primary" @click="loadFeePreview">
        <i class="fa-solid fa-rotate mr-1" />Recalculate
      </el-button>
    </div>

    <div v-else class="text-center text-sm text-slate-500 dark:text-slate-400 py-6">
      Fee information is not available for this service.
    </div>
  </div>
</template>
