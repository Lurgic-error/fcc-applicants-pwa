<script setup>
import { inject, computed } from 'vue'
import TrademarkPaymentPanel from '@/components/trademark/TrademarkPaymentPanel.vue'
import SmartFormGrid from '@/components/forms/SmartFormGrid.vue'
import {
  getTrademarkFeeByRequestType,
  isTrademarkPaymentRequired,
  labelTrademarkRequestType
} from '@/constants/trademarkRecordation'

const form = inject('wizardForm')

const paymentRequired = computed(() => isTrademarkPaymentRequired(form.requestType))
const feeAmount = computed(() => getTrademarkFeeByRequestType(form.requestType))
const requestTypeLabel = computed(() => labelTrademarkRequestType(form.requestType))
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
