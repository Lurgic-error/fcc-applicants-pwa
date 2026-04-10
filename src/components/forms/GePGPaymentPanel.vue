<script setup>
/**
 * GePGPaymentPanel — Shared GePG payment flow used across all service wizards.
 *
 * Flow:
 * 1. Applicant sees pre-filled payment details (amount from fee schedule, payer from profile)
 * 2. Applicant clicks "Generate Control Number" → emits generate-control-number → parent calls API
 * 3. Applicant pays externally (bank, mobile money) using the control number
 * 4. Applicant clicks "Verify Payment" → emits verify-payment → parent calls API
 * 5. Payment status: pending_control_number → control_number_issued → paid → verified
 */
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  expectedAmount: { type: Number, default: 0 },
  paymentRequired: { type: Boolean, default: true },
  readOnly: { type: Boolean, default: false },
  applicationId: { type: String, default: '' },
  payerName: { type: String, default: '' },
  payerEmail: { type: String, default: '' },
  payerPhone: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'generate-control-number', 'verify-payment'])

const generatingControlNumber = ref(false)
const verifyingPayment = ref(false)

function formatTzs(value = 0) {
  return `TZS ${Number(value || 0).toLocaleString('en-US')}`
}

const value = computed(() => ({
  status: props.modelValue?.status || 'pending_control_number',
  controlNumber: props.modelValue?.controlNumber || '',
  referenceNumber: props.modelValue?.referenceNumber || '',
  amountPaid: Number(props.modelValue?.amountPaid || 0),
  paidAt: props.modelValue?.paidAt || '',
  receiptNumber: props.modelValue?.receiptNumber || '',
}))

const outstandingAmount = computed(() =>
  Math.max(0, Number(props.expectedAmount || 0) - Number(value.value.amountPaid || 0))
)

const isPendingControlNumber = computed(() => value.value.status === 'pending_control_number')
const hasControlNumber = computed(() => !!value.value.controlNumber)
const isAwaitingPayment = computed(() => value.value.status === 'control_number_issued')
const isPaid = computed(() => value.value.status === 'paid' || value.value.status === 'verified')

function patch(field, nextValue) {
  emit('update:modelValue', { ...value.value, [field]: nextValue })
}

async function requestControlNumber() {
  generatingControlNumber.value = true
  try {
    emit('generate-control-number')
  } finally {
    generatingControlNumber.value = false
  }
}

async function requestVerification() {
  if (!value.value.controlNumber) {
    ElMessage.warning('No control number to verify.')
    return
  }
  verifyingPayment.value = true
  try {
    emit('verify-payment', value.value.controlNumber)
  } finally {
    verifyingPayment.value = false
  }
}
</script>

<template>
  <div class="space-y-5">
    <!-- Fee Summary -->
    <div class="payment-panel__summary">
      <article class="payment-panel__summary-card">
        <p class="payment-panel__summary-label">Expected Fee</p>
        <p class="payment-panel__summary-value">{{ formatTzs(expectedAmount) }}</p>
      </article>
      <article class="payment-panel__summary-card">
        <p class="payment-panel__summary-label">Amount Paid</p>
        <p class="payment-panel__summary-value payment-panel__summary-value--paid">{{ formatTzs(value.amountPaid) }}</p>
      </article>
      <article class="payment-panel__summary-card">
        <p class="payment-panel__summary-label">Outstanding</p>
        <p class="payment-panel__summary-value payment-panel__summary-value--outstanding">{{ formatTzs(outstandingAmount) }}</p>
      </article>
    </div>

    <!-- No payment required -->
    <el-alert
      v-if="!paymentRequired"
      title="This request type does not require statutory payment. You can continue with the declaration and submit."
      type="success"
      :closable="false"
      show-icon
    />

    <template v-if="paymentRequired">
      <!-- Status Indicator -->
      <div class="payment-panel__status">
        <div class="payment-panel__status-steps">
          <div class="payment-panel__status-step" :class="{ 'payment-panel__status-step--done': hasControlNumber || isPaid }">
            <span class="payment-panel__status-dot" />
            <span>Generate Control Number</span>
          </div>
          <div class="payment-panel__status-connector" :class="{ 'payment-panel__status-connector--done': hasControlNumber || isPaid }" />
          <div class="payment-panel__status-step" :class="{ 'payment-panel__status-step--active': isAwaitingPayment, 'payment-panel__status-step--done': isPaid }">
            <span class="payment-panel__status-dot" />
            <span>Pay via Bank / Mobile Money</span>
          </div>
          <div class="payment-panel__status-connector" :class="{ 'payment-panel__status-connector--done': isPaid }" />
          <div class="payment-panel__status-step" :class="{ 'payment-panel__status-step--active': value.status === 'paid', 'payment-panel__status-step--done': value.status === 'verified' }">
            <span class="payment-panel__status-dot" />
            <span>Verify Payment</span>
          </div>
        </div>
      </div>

      <!-- Step 1: Generate Control Number -->
      <div v-if="isPendingControlNumber && !hasControlNumber" class="payment-panel__action-card">
        <h4 class="payment-panel__action-title">Generate GePG Control Number</h4>
        <p class="payment-panel__action-desc">
          The system will submit your payment details to GePG and generate a control number.
          Use this number to pay at any bank or mobile money service.
        </p>

        <el-form label-position="top" class="mt-4">
          <SmartFormGrid :max-cols="2">
            <el-form-item label="Payer Name">
              <el-input :model-value="payerName" disabled />
            </el-form-item>
            <el-form-item label="Amount (TZS)">
              <el-input :model-value="formatTzs(expectedAmount)" disabled />
            </el-form-item>
            <el-form-item v-if="payerEmail" label="Email">
              <el-input :model-value="payerEmail" disabled />
            </el-form-item>
            <el-form-item v-if="payerPhone" label="Phone">
              <el-input :model-value="payerPhone" disabled />
            </el-form-item>
          </SmartFormGrid>
        </el-form>

        <div class="mt-4">
          <el-button
            type="primary"
            :loading="generatingControlNumber"
            :disabled="readOnly"
            @click="requestControlNumber"
          >
            Generate Control Number
          </el-button>
        </div>
      </div>

      <!-- Step 2: Control Number Issued — Pay Externally -->
      <div v-if="hasControlNumber && !isPaid" class="payment-panel__action-card">
        <h4 class="payment-panel__action-title">Pay Using Control Number</h4>
        <p class="payment-panel__action-desc">
          Use the control number below to make payment at any bank, mobile money agent, or online banking platform.
          After paying, click "Verify Payment" to confirm.
        </p>

        <div class="payment-panel__control-number">
          <span class="payment-panel__control-number-label">GePG Control Number</span>
          <span class="payment-panel__control-number-value">{{ value.controlNumber }}</span>
        </div>

        <div class="mt-4 flex gap-3">
          <el-button
            type="primary"
            :loading="verifyingPayment"
            :disabled="readOnly"
            @click="requestVerification"
          >
            Verify Payment
          </el-button>
        </div>
      </div>

      <!-- Step 3: Payment Confirmed -->
      <div v-if="isPaid" class="payment-panel__action-card payment-panel__action-card--success">
        <h4 class="payment-panel__action-title">Payment Confirmed</h4>
        <el-form label-position="top" class="mt-3">
          <SmartFormGrid :max-cols="3">
            <el-form-item label="GePG Control Number">
              <el-input :model-value="value.controlNumber" disabled />
            </el-form-item>
            <el-form-item label="Amount Paid (TZS)">
              <el-input :model-value="formatTzs(value.amountPaid)" disabled />
            </el-form-item>
            <el-form-item label="Payment Date">
              <el-input :model-value="value.paidAt" disabled />
            </el-form-item>
            <el-form-item v-if="value.referenceNumber" label="Reference Number">
              <el-input :model-value="value.referenceNumber" disabled />
            </el-form-item>
            <el-form-item v-if="value.receiptNumber" label="Receipt Number">
              <el-input :model-value="value.receiptNumber" disabled />
            </el-form-item>
          </SmartFormGrid>
        </el-form>
      </div>
    </template>
  </div>
</template>

<script>
import SmartFormGrid from '@/components/forms/SmartFormGrid.vue'
export default { components: { SmartFormGrid } }
</script>

<style scoped>
.payment-panel__summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  background: var(--el-fill-color-lighter, #fafafa);
}

.payment-panel__summary-card {
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  background: var(--el-bg-color, #fff);
}

.payment-panel__summary-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.payment-panel__summary-value {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0.25rem 0 0;
}

.payment-panel__summary-value--paid { color: var(--el-color-success); }
.payment-panel__summary-value--outstanding { color: var(--el-color-warning); }

/* Status Pipeline */
.payment-panel__status {
  padding: 1rem;
  border-radius: 8px;
  background: var(--el-fill-color-lighter, #fafafa);
  border: 1px solid var(--el-border-color-extra-light, #f2f6fc);
}

.payment-panel__status-steps {
  display: flex;
  align-items: center;
  gap: 0;
}

.payment-panel__status-step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}

.payment-panel__status-step--active {
  color: var(--el-color-primary);
  font-weight: 700;
}

.payment-panel__status-step--done {
  color: var(--el-color-success);
}

.payment-panel__status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--el-fill-color, #ebeef5);
  flex-shrink: 0;
}

.payment-panel__status-step--active .payment-panel__status-dot {
  background: var(--el-color-primary);
  box-shadow: 0 0 0 3px var(--el-color-primary-light-7, #c6e2ff);
}

.payment-panel__status-step--done .payment-panel__status-dot {
  background: var(--el-color-success);
}

.payment-panel__status-connector {
  flex: 1;
  height: 2px;
  background: var(--el-fill-color, #ebeef5);
  margin: 0 0.5rem;
  min-width: 1.5rem;
}

.payment-panel__status-connector--done {
  background: var(--el-color-success);
}

/* Action Cards */
.payment-panel__action-card {
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  background: var(--el-bg-color, #fff);
}

.payment-panel__action-card--success {
  border-color: var(--el-color-success-light-5, #b3e19d);
  background: var(--el-color-success-light-9, #f0f9eb);
}

.payment-panel__action-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0 0 0.375rem;
}

.payment-panel__action-desc {
  font-size: 0.8125rem;
  color: var(--el-text-color-secondary);
  margin: 0;
  line-height: 1.5;
}

/* Control Number Display */
.payment-panel__control-number {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 8px;
  background: var(--el-color-primary-light-9, #ecf5ff);
  border: 1px dashed var(--el-color-primary-light-5, #a0cfff);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.payment-panel__control-number-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--el-color-primary);
}

.payment-panel__control-number-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--el-color-primary);
  letter-spacing: 0.1em;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

@media (max-width: 640px) {
  .payment-panel__summary { grid-template-columns: 1fr; }
  .payment-panel__status-steps { flex-direction: column; align-items: flex-start; }
  .payment-panel__status-connector { width: 2px; height: 1rem; min-width: 2px; margin: 0.25rem 0 0.25rem 4px; }
}
</style>
