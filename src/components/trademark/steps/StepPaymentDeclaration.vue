<script setup>
import { inject, computed } from 'vue'
import { ElMessage } from 'element-plus'
import TrademarkPaymentPanel from '@/components/trademark/TrademarkPaymentPanel.vue'
import SmartFormGrid from '@/components/forms/SmartFormGrid.vue'
import {
  getTrademarkFeeByRequestType,
  isTrademarkPaymentRequired,
  labelTrademarkRequestType
} from '@/constants/trademarkRecordation'
import {
  generateTrademarkControlNumber,
  verifyTrademarkPaymentByControlNumber
} from '@/services/applicantApi'

const form = inject('wizardForm')

const paymentRequired = computed(() => isTrademarkPaymentRequired(form.requestType))
const feeAmount = computed(() => getTrademarkFeeByRequestType(form.requestType))
const requestTypeLabel = computed(() => labelTrademarkRequestType(form.requestType))

// Pre-fill payer details from applicant identity
const payerName = computed(() => {
  if (form.applicantType === 'individual') return `${form.firstName} ${form.surname}`.trim()
  return form.companyName || ''
})
const payerEmail = computed(() => form.contactEmail || '')
const payerPhone = computed(() => form.phoneNumber || '')

async function handleGenerateControlNumber() {
  try {
    const result = await generateTrademarkControlNumber(form.applicationId || '')
    const payment = result?.trademarkRecordation?.payment || result?.payment || {}
    form.payment = {
      ...form.payment,
      status: 'control_number_issued',
      controlNumber: payment.controlNumber || form.payment.controlNumber,
    }
    ElMessage.success('Control number generated successfully')
  } catch (err) {
    ElMessage.error(err?.message || 'Failed to generate control number')
  }
}

async function handleVerifyPayment(controlNumber) {
  try {
    const result = await verifyTrademarkPaymentByControlNumber(controlNumber, {
      applicationId: form.applicationId || ''
    })
    const bill = result || {}
    form.payment = {
      ...form.payment,
      status: bill.status === 'PAID' || bill.paid ? 'paid' : form.payment.status,
      amountPaid: Number(bill.amountPaid || bill.paidAmount || form.payment.amountPaid || 0),
      paidAt: bill.paidAt || bill.paymentDate || form.payment.paidAt || '',
      receiptNumber: bill.receiptNumber || bill.payReceipt || form.payment.receiptNumber || '',
      referenceNumber: bill.referenceNumber || bill.paymentRef || form.payment.referenceNumber || '',
    }
    if (form.payment.status === 'paid') {
      ElMessage.success('Payment verified successfully')
    } else {
      ElMessage.info('Payment not yet received. Please try again after paying.')
    }
  } catch (err) {
    ElMessage.error(err?.message || 'Failed to verify payment')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h3 class="wizard-step__title">Payment & Declaration</h3>
      <p class="wizard-step__description">
        Pay the statutory fee via GePG (Government e-Payment Gateway): generate a control number,
        pay at any bank or mobile money service, then verify the payment here. Once confirmed,
        sign the declaration and submit.
      </p>
    </div>

    <!-- Payment section -->
    <section class="space-y-3">
      <h3 class="wizard-step__section-title">Payment</h3>

      <template v-if="paymentRequired">
        <TrademarkPaymentPanel
          v-model="form.payment"
          :expected-amount="feeAmount"
          :payment-required="true"
          :payer-name="payerName"
          :payer-email="payerEmail"
          :payer-phone="payerPhone"
          @generate-control-number="handleGenerateControlNumber"
          @verify-payment="handleVerifyPayment"
        />
      </template>

      <template v-else>
        <div class="wizard-step__info wizard-step__success">
          No payment required for <strong>{{ requestTypeLabel }}</strong> requests.
        </div>
      </template>
    </section>

    <!-- Declaration section -->
    <section class="space-y-4">
      <h3 class="wizard-step__section-title">Declaration</h3>

      <div class="wizard-step__declaration-box">
        <el-checkbox v-model="form.declarationAccepted" size="large">
          I declare that the information provided in this application is true, complete, and accurate
          to the best of my knowledge. I understand that any false declaration may result in
          rejection or revocation of the recordation.
        </el-checkbox>
      </div>

      <el-form label-position="top">
        <SmartFormGrid :max-cols="3">
          <el-form-item label="Full Name (Declarant)" required>
            <el-input
              v-model="form.declarationName"
              placeholder="Name of signatory"
              clearable
            />
          </el-form-item>

          <el-form-item label="Title / Position">
            <el-input
              v-model="form.declarationTitle"
              placeholder="e.g. Director, Legal Counsel"
              clearable
            />
          </el-form-item>

          <el-form-item label="Declaration Date">
            <el-date-picker
              v-model="form.declarationDate"
              type="date"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="Additional Notes" class="col-span-full" full-width>
            <el-input
              v-model="form.notes"
              type="textarea"
              :rows="3"
              placeholder="Any additional information or remarks"
            />
          </el-form-item>
        </SmartFormGrid>
      </el-form>
    </section>
  </div>
</template>

<style scoped>
.wizard-step__declaration-box {
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  background: var(--el-fill-color-lighter, #fafafa);
}
</style>
