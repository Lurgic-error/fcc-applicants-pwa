<script setup>
import { inject } from 'vue'
import SmartFormGrid from '@/components/forms/SmartFormGrid.vue'
import { CONTRACT_TYPES, CONSIDERATION_FORMS } from '@/constants/mergerFcc8Config'

const get = inject('wizardGet')
const set = inject('wizardSet')
const form = inject('wizardForm')
</script>

<template>
  <div class="space-y-6">
    <!-- 3(a) Nature and Details -->
    <div>
      <h3 class="merger-subsection-title">3(a) — Nature and Details of the Acquisition</h3>

      <el-form-item label="Description">
        <el-input
          type="textarea"
          :rows="3"
          :model-value="get('acquisition.natureAndDetails.description')"
          @update:model-value="v => set('acquisition.natureAndDetails.description', v)"
          placeholder="Describe the nature and details of the proposed acquisition..."
        />
      </el-form-item>

      <SmartFormGrid :max-cols="2">
        <el-form-item label="Contract Type" required>
          <el-select
            :model-value="get('acquisition.natureAndDetails.contractType')"
            @update:model-value="v => set('acquisition.natureAndDetails.contractType', v)"
            class="w-full"
            placeholder="Select..."
          >
            <el-option v-for="o in CONTRACT_TYPES" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="Date of Contract">
          <el-date-picker
            :model-value="get('acquisition.natureAndDetails.dateOfContract')"
            @update:model-value="v => set('acquisition.natureAndDetails.dateOfContract', v)"
            type="date"
            placeholder="Select date"
            class="!w-full"
          />
        </el-form-item>

        <el-form-item label="Intended Consummation Date">
          <el-date-picker
            :model-value="get('acquisition.natureAndDetails.intendedConsummationDate')"
            @update:model-value="v => set('acquisition.natureAndDetails.intendedConsummationDate', v)"
            type="date"
            placeholder="Select date"
            class="!w-full"
          />
        </el-form-item>
      </SmartFormGrid>

      <!-- Consideration -->
      <h4 class="merger-field-group-title">Consideration</h4>
      <SmartFormGrid :max-cols="3">
        <el-form-item label="Amount">
          <el-input-number
            :model-value="get('acquisition.natureAndDetails.consideration.amount')"
            @update:model-value="v => set('acquisition.natureAndDetails.consideration.amount', v)"
            :min="0"
            class="!w-full"
          />
        </el-form-item>
        <el-form-item label="Currency">
          <el-input
            :model-value="get('acquisition.natureAndDetails.consideration.currency')"
            @update:model-value="v => set('acquisition.natureAndDetails.consideration.currency', v)"
            placeholder="TZS"
          />
        </el-form-item>
        <el-form-item label="Form of Consideration" required>
          <el-select
            :model-value="get('acquisition.natureAndDetails.consideration.form')"
            @update:model-value="v => set('acquisition.natureAndDetails.consideration.form', v)"
            class="w-full"
            placeholder="Select..."
          >
            <el-option v-for="o in CONSIDERATION_FORMS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
      </SmartFormGrid>

      <!-- Attachments checkboxes -->
      <SmartFormGrid :max-cols="2" class="mt-3">
        <el-checkbox
          :model-value="get('acquisition.natureAndDetails.contractCopyAttached')"
          @update:model-value="v => set('acquisition.natureAndDetails.contractCopyAttached', v)"
        >
          Copy of contract / arrangement attached
        </el-checkbox>
        <el-checkbox
          :model-value="get('acquisition.natureAndDetails.publicOfferDocumentAttached')"
          @update:model-value="v => set('acquisition.natureAndDetails.publicOfferDocumentAttached', v)"
        >
          Public offer document attached
        </el-checkbox>
      </SmartFormGrid>
    </div>

    <!-- 3(b) Commercial Rationale -->
    <div>
      <h3 class="merger-subsection-title">3(b) — Commercial Rationale</h3>
      <el-form-item label="Description">
        <el-input
          type="textarea"
          :rows="3"
          :model-value="get('acquisition.commercialRationale.description')"
          @update:model-value="v => set('acquisition.commercialRationale.description', v)"
          placeholder="Describe the commercial rationale for the acquisition..."
        />
      </el-form-item>
    </div>

    <!-- 3(c) Ancillary Arrangements -->
    <div>
      <h3 class="merger-subsection-title">3(c) — Ancillary Arrangements</h3>
      <el-checkbox
        :model-value="get('acquisition.ancillaryArrangements.involvesAncillaryArrangements')"
        @update:model-value="v => set('acquisition.ancillaryArrangements.involvesAncillaryArrangements', v)"
      >
        This acquisition involves ancillary restraints or arrangements
      </el-checkbox>
    </div>
  </div>
</template>

<style scoped>
.merger-subsection-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--fcc-text-primary, #0f172a);
  margin-bottom: 0.75rem;
}
.merger-field-group-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--fcc-text-secondary, #475569);
  margin: 0.875rem 0 0.5rem;
}
</style>
