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
      <h2 class="text-lg font-semibold text-slate-800">Payment & Declaration</h2>
      <p class="mt-1 text-sm text-slate-500">
        Complete payment details and sign the declaration to submit your request.
      </p>
    </div>

    <!-- Payment section -->
    <section class="space-y-3">
      <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-600">Payment</h3>

      <template v-if="paymentRequired">
        <TrademarkPaymentPanel
          v-model="form.payment"
          :expected-amount="feeAmount"
          :payment-required="true"
        />
      </template>

      <template v-else>
        <div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          No payment required for <strong>{{ requestTypeLabel }}</strong> requests.
        </div>
      </template>
    </section>

    <!-- Declaration section -->
    <section class="space-y-4">
      <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-600">Declaration</h3>

      <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <el-checkbox v-model="form.declarationAccepted" size="large">
          I declare that the information provided in this application is true, complete, and accurate
          to the best of my knowledge. I understand that any false declaration may result in
          rejection or revocation of the recordation.
        </el-checkbox>
      </div>

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
    </section>
  </div>
</template>
