<script setup>
import { computed } from 'vue'
import { formatTzs } from '@/constants/trademarkRecordation'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  expectedAmount: {
    type: Number,
    default: 0
  },
  paymentRequired: {
    type: Boolean,
    default: true
  },
  controlNumberReadonly: {
    type: Boolean,
    default: false
  },
  readOnly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const value = computed(() => ({
  status: props.modelValue?.status || 'pending_control_number',
  controlNumber: props.modelValue?.controlNumber || '',
  referenceNumber: props.modelValue?.referenceNumber || '',
  amountPaid: Number(props.modelValue?.amountPaid || 0),
  paidAt: props.modelValue?.paidAt || '',
  receiptNumber: props.modelValue?.receiptNumber || ''
}))

const outstandingAmount = computed(() =>
  Math.max(0, Number(props.expectedAmount || 0) - Number(value.value.amountPaid || 0))
)

function patch(field, nextValue) {
  emit('update:modelValue', {
    ...value.value,
    [field]: nextValue
  })
}
</script>

<template>
  <div class="space-y-4">
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

    <el-alert
      v-if="!paymentRequired"
      title="This request type does not require statutory payment. You can continue with declaration and submission."
      type="success"
      :closable="false"
      show-icon
    />

    <el-form label-position="top">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <el-form-item class="mb-0" label="Payment Status">
          <el-select :model-value="value.status" :disabled="readOnly" @update:model-value="patch('status', $event)">
            <el-option label="Pending Control Number" value="pending_control_number" />
            <el-option label="Control Number Issued" value="control_number_issued" />
            <el-option label="Paid" value="paid" />
            <el-option label="Verified" value="verified" />
          </el-select>
        </el-form-item>

        <el-form-item class="mb-0" label="GePG Control Number">
          <el-input
            :model-value="value.controlNumber"
            placeholder="Generated via GePG"
            :readonly="controlNumberReadonly"
            @update:model-value="patch('controlNumber', $event)"
          />
        </el-form-item>

        <el-form-item class="mb-0" label="Payment Reference Number">
          <el-input
            :model-value="value.referenceNumber"
            placeholder="Bank / mobile money reference"
            :disabled="readOnly"
            @update:model-value="patch('referenceNumber', $event)"
          />
        </el-form-item>

        <el-form-item class="mb-0" label="Amount Paid (TZS)">
          <el-input-number
            :model-value="value.amountPaid"
            :min="0"
            controls-position="right"
            :disabled="readOnly"
            @update:model-value="patch('amountPaid', $event)"
          />
        </el-form-item>

        <el-form-item class="mb-0" label="Payment Date">
          <el-date-picker
            :model-value="value.paidAt"
            type="date"
            value-format="YYYY-MM-DD"
            :disabled="readOnly"
            @update:model-value="patch('paidAt', $event)"
          />
        </el-form-item>

        <el-form-item class="mb-0" label="Receipt Number">
          <el-input
            :model-value="value.receiptNumber"
            :disabled="readOnly"
            @update:model-value="patch('receiptNumber', $event)"
          />
        </el-form-item>
      </div>
    </el-form>
  </div>
</template>

<style scoped>
.payment-panel__summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  background: var(--el-fill-color-lighter, #fafafa);
}

.payment-panel__summary-card {
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  background: var(--el-bg-color, #fff);
}

.payment-panel__summary-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--el-text-color-secondary, #909399);
  margin: 0;
}

.payment-panel__summary-value {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--el-text-color-primary, #303133);
  margin: 0.25rem 0 0;
}

.payment-panel__summary-value--paid {
  color: var(--el-color-success, #67c23a);
}

.payment-panel__summary-value--outstanding {
  color: var(--el-color-warning, #e6a23c);
}
</style>
