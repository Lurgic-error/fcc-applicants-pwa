<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  payment: { type: Object, required: true }
})

const emit = defineEmits(['verify', 'upload-proof'])

const verifying = ref(false)
const proofFile = ref(null)

const controlNumber = computed(() => props.payment.controlNumber || '')
const amount = computed(() => Number(props.payment.amount || 0))
const amountPaid = computed(() => Number(props.payment.amountPaid || 0))
const balance = computed(() => Math.max(0, amount.value - amountPaid.value))
const isPaid = computed(() => balance.value <= 0)

const paymentChannels = [
  { icon: 'fa-solid fa-building-columns', label: 'Bank Transfer', description: 'Visit any commercial bank and provide the control number.' },
  { icon: 'fa-solid fa-mobile-screen', label: 'Mobile Money', description: 'Pay via M-Pesa, Tigo Pesa, or Airtel Money using the control number.' },
  { icon: 'fa-solid fa-globe', label: 'Online Banking', description: "Use your bank's internet/mobile banking to pay with the control number." }
]

async function verifyPayment() {
  verifying.value = true
  try {
    emit('verify', controlNumber.value)
    ElMessage.info('Payment verification requested. This may take a moment.')
  } finally {
    setTimeout(() => { verifying.value = false }, 2000)
  }
}

function handleProofUpload(uploadFile) {
  proofFile.value = uploadFile?.raw || null
  if (proofFile.value) {
    emit('upload-proof', proofFile.value)
    ElMessage.success('Payment proof uploaded. Pending review.')
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Control Number Display -->
    <div class="rounded-2xl border-2 border-fcc-brand/30 bg-fcc-brand/5 p-5 text-center dark:bg-fcc-brand/10">
      <p class="text-xs uppercase tracking-wide text-fcc-brand">GePG Control Number</p>
      <p v-if="controlNumber" class="mt-2 text-3xl font-bold tracking-wider text-fcc-brand">
        {{ controlNumber }}
      </p>
      <p v-else class="mt-2 text-lg italic text-slate-500 dark:text-slate-400">
        Awaiting control number issuance
      </p>
      <div v-if="controlNumber" class="mt-3 flex justify-center gap-2">
        <el-button size="small" plain @click="navigator.clipboard?.writeText(controlNumber)">
          <i class="fa-solid fa-copy mr-1" />Copy
        </el-button>
      </div>
    </div>

    <!-- Amount Summary -->
    <div class="grid grid-cols-3 gap-3">
      <div class="rounded-xl border border-slate-200 p-3 text-center dark:border-slate-700">
        <p class="text-xs text-slate-500 dark:text-slate-400">Amount Due</p>
        <p class="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">TZS {{ amount.toLocaleString() }}</p>
      </div>
      <div class="rounded-xl border border-slate-200 p-3 text-center dark:border-slate-700">
        <p class="text-xs text-slate-500 dark:text-slate-400">Paid</p>
        <p class="mt-1 text-lg font-semibold text-green-600">TZS {{ amountPaid.toLocaleString() }}</p>
      </div>
      <div
        class="rounded-xl border p-3 text-center"
        :class="balance > 0 ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20' : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'"
      >
        <p class="text-xs" :class="balance > 0 ? 'text-amber-600' : 'text-green-600'">Balance</p>
        <p class="mt-1 text-lg font-semibold" :class="balance > 0 ? 'text-amber-700' : 'text-green-700'">TZS {{ balance.toLocaleString() }}</p>
      </div>
    </div>

    <!-- Payment Status -->
    <div v-if="isPaid" class="rounded-2xl border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-900/20">
      <i class="fa-solid fa-circle-check text-2xl text-green-500" />
      <p class="mt-2 text-sm font-medium text-green-800 dark:text-green-200">Payment Complete</p>
    </div>

    <!-- Payment Channels (when not paid) -->
    <div v-if="!isPaid && controlNumber">
      <h4 class="text-sm font-semibold text-slate-900 dark:text-slate-100">How to Pay</h4>
      <div class="mt-3 space-y-2">
        <div
          v-for="channel in paymentChannels"
          :key="channel.label"
          class="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800"
        >
          <i :class="channel.icon" class="mt-0.5 w-5 text-center text-sm text-fcc-brand" />
          <div>
            <p class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ channel.label }}</p>
            <p class="text-xs text-slate-600 dark:text-slate-300">{{ channel.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div v-if="controlNumber && !isPaid" class="flex flex-wrap gap-3">
      <el-button type="primary" :loading="verifying" @click="verifyPayment">
        <i class="fa-solid fa-rotate mr-2" />Verify Payment
      </el-button>
      <el-upload :auto-upload="false" :show-file-list="false" accept=".pdf,.jpg,.jpeg,.png" @change="handleProofUpload">
        <el-button plain>
          <i class="fa-solid fa-receipt mr-2" />Upload Payment Proof
        </el-button>
      </el-upload>
    </div>
  </div>
</template>
