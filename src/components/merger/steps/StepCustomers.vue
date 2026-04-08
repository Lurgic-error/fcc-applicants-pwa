<script setup>
import { inject } from 'vue'
import MergerArrayManager from '@/components/merger/MergerArrayManager.vue'
import { SIZES, SUPPLIES_TO_OPTIONS, mk } from '@/constants/mergerFcc8Config'

const get = inject('wizardGet')
const set = inject('wizardSet')
const form = inject('wizardForm')
</script>

<template>
  <div class="space-y-6">
    <h3 class="merger-subsection-title">Section 8 — Customers</h3>

    <MergerArrayManager path="customers.customers" title="Customer" :factory="mk.customer">
      <template #default="{ item, path: itemPath }">
        <div class="space-y-4">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <el-form-item label="Customer Name" required>
              <el-input
                :model-value="item.name"
                @update:model-value="v => set(`${itemPath}.name`, v)"
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
            <el-form-item label="Customer Of" required>
              <el-select
                :model-value="item.customerOf"
                @update:model-value="v => set(`${itemPath}.customerOf`, v)"
                class="w-full"
                placeholder="Select..."
              >
                <el-option v-for="o in SUPPLIES_TO_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
          </div>

          <el-form-item label="Goods and Services Purchased">
            <el-input
              type="textarea"
              :rows="2"
              :model-value="item.goodsAndServicesPurchased"
              @update:model-value="v => set(`${itemPath}.goodsAndServicesPurchased`, v)"
              placeholder="Describe the goods and services purchased..."
            />
          </el-form-item>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <el-form-item label="Value of Purchases">
              <el-input-number
                :model-value="item.valueOfPurchases"
                @update:model-value="v => set(`${itemPath}.valueOfPurchases`, v)"
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
          </div>

          <!-- Contact Details -->
          <h4 class="merger-field-group-title">Contact Details</h4>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </div>
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
