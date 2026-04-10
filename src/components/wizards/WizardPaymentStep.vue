<script setup>
/**
 * WizardPaymentStep — Reusable payment step for all application wizards.
 *
 * Wraps GePGPaymentPanel and handles the API calls for generating a
 * GePG control number and verifying payment status. Works for all services.
 */
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import GePGPaymentPanel from '@/components/forms/GePGPaymentPanel.vue'
import { calculateServiceFees } from '@/constants/applicationServiceRules'
import {
  previewServiceFee,
  generateTrademarkControlNumber,
  verifyTrademarkPaymentByControlNumber
} from '@/services/applicantApi'

const props = defineProps({
  serviceKey: { type: String, required: true },
  applicationId: { type: String, default: '' },
  formData: { type: Object, default: () => ({}) },
  payment: { type: Object, default: () => ({}) },
  payerName: { type: String, default: '' },
  payerEmail: { type: String, default: '' },
  payerPhone: { type: String, default: '' },
})

const emit = defineEmits(['update:payment'])

const loading = ref(false)
const serverFee = ref(null)

const localFee = computed(() => calculateServiceFees(props.serviceKey, props.formData))

const fee = computed(() => {
  if (serverFee.value?.total) return serverFee.value
  return localFee.value
})

const feeTotal = computed(() => Number(fee.value?.total || fee.value?.amount || 0))

// Normalised payment object forwarded to GePGPaymentPanel
const paymentModel = computed({
  get() {
    return {
      status: props.payment?.status || 'pending_control_number',
      controlNumber: props.payment?.controlNumber || '',
      referenceNumber: props.payment?.referenceNumber || '',
      amountPaid: Number(props.payment?.amountPaid || 0),
      paidAt: props.payment?.paidAt || '',
      receiptNumber: props.payment?.receiptNumber || '',
    }
  },
  set(val) {
    emit('update:payment', val)
  }
})

async function fetchServerFee() {
  if (!props.serviceKey) return
  loading.value = true
  try {
    const result = await previewServiceFee({
      serviceKey: props.serviceKey,
      feeContext: props.formData
    })
    if (result && !result.error) {
      serverFee.value = result
    }
  } catch {
    // Fall back to local calculation
  } finally {
    loading.value = false
  }
}

async function handleGenerateControlNumber() {
  if (!props.applicationId) {
    ElMessage.warning('Please submit the application first before generating a control number.')
    return
  }
  try {
    const result = await generateTrademarkControlNumber(props.applicationId)
    const payment = result?.payment || result?.trademarkRecordation?.payment || {}
    emit('update:payment', {
      ...paymentModel.value,
      controlNumber: payment.controlNumber || result?.controlNumber || '',
      amountDue: payment.amountDue || feeTotal.value,
      amountPaid: payment.amountPaid || 0,
      status: 'control_number_issued'
    })
    ElMessage.success('Control number generated successfully.')
  } catch (err) {
    ElMessage.error(err?.message || 'Failed to generate control number. Please try again.')
  }
}

async function handleVerifyPayment(controlNumber) {
  if (!controlNumber) return
  try {
    const result = await verifyTrademarkPaymentByControlNumber(controlNumber, {
      applicationId: props.applicationId
    })
    const bill = result?.bill || result || {}
    const paid = Number(bill.amountPaid || bill.paidAmount || 0)
    emit('update:payment', {
      ...paymentModel.value,
      amountPaid: paid,
      paidAt: bill.paidAt || '',
      referenceNumber: bill.referenceNumber || '',
      receiptNumber: bill.receiptNumber || '',
      status: paid >= feeTotal.value ? 'paid' : 'pending_payment',
    })
    if (paid >= feeTotal.value) {
      ElMessage.success('Payment confirmed!')
    } else if (paid > 0) {
      ElMessage.warning(`Partial payment received: TZS ${paid.toLocaleString()}`)
    } else {
      ElMessage.info('Payment not yet received. Please check again later.')
    }
  } catch (err) {
    ElMessage.error(err?.message || 'Failed to verify payment.')
  }
}

onMounted(fetchServerFee)
</script>

<template>
  <div class="space-y-4">
    <p v-if="loading" class="text-xs text-slate-500">
      <i class="fa-solid fa-spinner fa-spin mr-1" /> Fetching latest fee schedule...
    </p>

    <GePGPaymentPanel
      v-model="paymentModel"
      :expected-amount="feeTotal"
      :payment-required="true"
      :application-id="applicationId"
      :payer-name="payerName"
      :payer-email="payerEmail"
      :payer-phone="payerPhone"
      @generate-control-number="handleGenerateControlNumber"
      @verify-payment="handleVerifyPayment"
    />
  </div>
</template>
