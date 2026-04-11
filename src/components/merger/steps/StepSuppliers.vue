<script setup>
import { inject } from 'vue'
import MergerArrayManager from '@/components/merger/MergerArrayManager.vue'
import SmartFormGrid from '@/components/forms/SmartFormGrid.vue'
import { SIZES, SUPPLIES_TO_OPTIONS, mk } from '@/constants/mergerFcc8Config'

const get = inject('wizardGet')
const set = inject('wizardSet')
const form = inject('wizardForm')
</script>

<template>
  <div class="space-y-6">
    <h3 class="merger-subsection-title">Section 6 — Suppliers for Inputs</h3>

    <MergerArrayManager path="suppliersForInputs.suppliers" title="Supplier" :factory="mk.supplier">
      <template #default="{ item, path: itemPath }">
        <div class="space-y-4">
          <SmartFormGrid :max-cols="2">
            <el-form-item label="Supplier Name" required>
              <el-input
                :model-value="item.name"
                @update:model-value="v => set(`${itemPath}.name`, v)"
              />
            </el-form-item>
            <el-form-item label="Location">
              <el-input
                :model-value="item.location"
                @update:model-value="v => set(`${itemPath}.location`, v)"
              />
            </el-form-item>
            <el-form-item label="Size" required>
              <el-select
                :model-value="item.size"
                @update:model-value="v => set(`${itemPath}.size`, v)"
                class="w-full"
                placeholder="Select..."
              >
                <el-option v-for="o in SIZES" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Supplies To" required>
              <el-select
                :model-value="item.suppliesTo"
                @update:model-value="v => set(`${itemPath}.suppliesTo`, v)"
                class="w-full"
                placeholder="Select..."
              >
                <el-option v-for="o in SUPPLIES_TO_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
          </SmartFormGrid>

          <el-form-item label="Goods and Services Supplied">
            <el-input
              type="textarea"
              :rows="2"
              :model-value="item.goodsAndServicesSupplied"
              @update:model-value="v => set(`${itemPath}.goodsAndServicesSupplied`, v)"
              placeholder="Describe the goods and services supplied..."
            />
          </el-form-item>

          <SmartFormGrid :max-cols="2">
            <el-form-item label="Estimated Value">
              <el-input-number
                :model-value="item.estimatedValue"
                @update:model-value="v => set(`${itemPath}.estimatedValue`, v)"
                :min="0"
                class="!w-full"
              />
            </el-form-item>
            <el-form-item label="Currency">
              <el-input
                :model-value="item.currency"
                @update:model-value="v => set(`${itemPath}.currency`, v)"
                placeholder="TZS"
              />
            </el-form-item>
          </SmartFormGrid>

          <!-- Contact Details -->
          <h4 class="merger-field-group-title">Contact Details</h4>
          <SmartFormGrid :max-cols="2">
            <el-form-item label="Contact Person">
              <el-input
                :model-value="item.contactDetails.contactPerson"
                @update:model-value="v => set(`${itemPath}.contactDetails.contactPerson`, v)"
              />
            </el-form-item>
            <el-form-item label="Phone">
              <el-input
                :model-value="item.contactDetails.phone"
                @update:model-value="v => set(`${itemPath}.contactDetails.phone`, v)"
              />
            </el-form-item>
            <el-form-item label="Email">
              <el-input
                :model-value="item.contactDetails.email"
                @update:model-value="v => set(`${itemPath}.contactDetails.email`, v)"
                type="email"
              />
            </el-form-item>
            <el-form-item label="Address">
              <el-input
                :model-value="item.contactDetails.address"
                @update:model-value="v => set(`${itemPath}.contactDetails.address`, v)"
              />
            </el-form-item>
          </SmartFormGrid>
        </div>
      </template>
    </MergerArrayManager>
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
