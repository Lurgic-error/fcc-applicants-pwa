<script setup>
import { computed } from 'vue'
import { useQrCode } from '@/composables/useQrCode'

const props = defineProps({
  certificate: { type: Object, required: true }
})

const { generateVerificationUrl, generateQrDataUrl } = useQrCode()
const verificationUrl = computed(() => generateVerificationUrl(props.certificate.certificateId))
const qrImage = computed(() => generateQrDataUrl(props.certificate.certificateId))

const lifecycleColor = computed(() => {
  if (props.certificate.lifecycle === 'Expired') return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
  if (props.certificate.lifecycle === 'Expiry Soon') return 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
  return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
})

function copyUrl() {
  navigator.clipboard?.writeText(verificationUrl.value)
}
</script>

<template>
  <div class="rounded-2xl border p-5" :class="lifecycleColor">
    <div class="flex flex-wrap gap-5">
      <div class="flex flex-col items-center gap-2">
        <img :src="qrImage" alt="Verification QR Code" class="h-32 w-32 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-600" />
        <el-button link type="primary" @click="copyUrl">
          <i class="fa-solid fa-copy mr-1" />Copy verification link
        </el-button>
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{{ certificate.service }}</p>
            <h3 class="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{{ certificate.certificateId }}</h3>
          </div>
          <el-tag :type="certificate.lifecycle === 'Expired' ? 'danger' : certificate.lifecycle === 'Expiry Soon' ? 'warning' : 'success'" effect="light">
            {{ certificate.lifecycle }}
          </el-tag>
        </div>
        <dl class="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Application ID</dt>
            <dd class="mt-0.5 text-sm text-slate-900 dark:text-slate-100">{{ certificate.applicationId || 'N/A' }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Issued Date</dt>
            <dd class="mt-0.5 text-sm text-slate-900 dark:text-slate-100">{{ certificate.issuedAt || 'N/A' }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Expiry Date</dt>
            <dd class="mt-0.5 text-sm text-slate-900 dark:text-slate-100">{{ certificate.expiryDate || 'No expiry' }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Verification URL</dt>
            <dd class="mt-0.5 truncate text-sm text-fcc-brand">{{ verificationUrl }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>
