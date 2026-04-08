<script setup>
import { inject } from 'vue'
import MergerArrayManager from '@/components/merger/MergerArrayManager.vue'
import { mk } from '@/constants/mergerFcc8Config'

const get = inject('wizardGet')
const set = inject('wizardSet')
const form = inject('wizardForm')

const MARKET_TYPES = [
  { value: 'supply', label: 'Supply' },
  { value: 'acquisition', label: 'Acquisition' }
]

/**
 * Helper: parse a comma-separated string into an array of trimmed non-empty strings.
 * Used for tag-like array fields (products, areas, etc.)
 */
function csvToArray(val) {
  return val
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

function arrayToCsv(arr) {
  return (arr || []).join(', ')
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h3 class="merger-subsection-title">Section 5 — Market Definition</h3>
      <el-form-item label="Overall Description">
        <el-input
          type="textarea"
          :rows="3"
          :model-value="get('marketDefinition.description')"
          @update:model-value="v => set('marketDefinition.description', v)"
          placeholder="Describe the relevant markets affected by this merger..."
        />
      </el-form-item>
    </div>

    <MergerArrayManager path="marketDefinition.relevantMarkets" title="Relevant Market" :factory="mk.relevantMarket">
      <template #default="{ item, path: itemPath }">
        <div class="space-y-4">
          <!-- Market identity -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <el-form-item label="Market Name" required>
              <el-input
                :model-value="item.marketName"
                @update:model-value="v => set(`${itemPath}.marketName`, v)"
              />
            </el-form-item>
            <el-form-item label="Market Type" required>
              <el-select
                :model-value="item.marketType"
                @update:model-value="v => set(`${itemPath}.marketType`, v)"
                class="w-full"
                placeholder="Select..."
              >
                <el-option v-for="o in MARKET_TYPES" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
          </div>

          <!-- Product Dimension -->
          <div class="merger-dimension">
            <h4 class="merger-field-group-title">Product Dimension</h4>
            <el-form-item label="Description">
              <el-input
                type="textarea"
                :rows="2"
                :model-value="item.productDimension.description"
                @update:model-value="v => set(`${itemPath}.productDimension.description`, v)"
              />
            </el-form-item>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <el-form-item label="Products (comma-separated)">
                <el-input
                  :model-value="arrayToCsv(item.productDimension.products)"
                  @update:model-value="v => set(`${itemPath}.productDimension.products`, csvToArray(v))"
                  placeholder="e.g. Cement, Steel, Glass"
                />
              </el-form-item>
              <el-form-item label="Substitute Sources (comma-separated)">
                <el-input
                  :model-value="arrayToCsv(item.productDimension.substituteSources)"
                  @update:model-value="v => set(`${itemPath}.productDimension.substituteSources`, csvToArray(v))"
                  placeholder="e.g. Imports, Local competitors"
                />
              </el-form-item>
            </div>
            <el-form-item label="Demand-Side Substitutability">
              <el-input
                type="textarea"
                :rows="2"
                :model-value="item.productDimension.demandSideSubstitutability"
                @update:model-value="v => set(`${itemPath}.productDimension.demandSideSubstitutability`, v)"
              />
            </el-form-item>
            <el-form-item label="Supply-Side Substitutability">
              <el-input
                type="textarea"
                :rows="2"
                :model-value="item.productDimension.supplySideSubstitutability"
                @update:model-value="v => set(`${itemPath}.productDimension.supplySideSubstitutability`, v)"
              />
            </el-form-item>
          </div>

          <!-- Geographic Dimension -->
          <div class="merger-dimension">
            <h4 class="merger-field-group-title">Geographic Dimension</h4>
            <el-form-item label="Description">
              <el-input
                type="textarea"
                :rows="2"
                :model-value="item.geographicDimension.description"
                @update:model-value="v => set(`${itemPath}.geographicDimension.description`, v)"
              />
            </el-form-item>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <el-form-item label="Areas (comma-separated)">
                <el-input
                  :model-value="arrayToCsv(item.geographicDimension.areas)"
                  @update:model-value="v => set(`${itemPath}.geographicDimension.areas`, csvToArray(v))"
                  placeholder="e.g. Dar es Salaam, Arusha, Mwanza"
                />
              </el-form-item>
              <el-form-item label="Customer Access Areas (comma-separated)">
                <el-input
                  :model-value="arrayToCsv(item.geographicDimension.customerAccessAreas)"
                  @update:model-value="v => set(`${itemPath}.geographicDimension.customerAccessAreas`, csvToArray(v))"
                  placeholder="e.g. East Africa, SADC"
                />
              </el-form-item>
            </div>
          </div>

          <!-- Functional Dimension -->
          <div class="merger-dimension">
            <h4 class="merger-field-group-title">Functional Dimension</h4>
            <el-form-item label="Description">
              <el-input
                type="textarea"
                :rows="2"
                :model-value="item.functionalDimension.description"
                @update:model-value="v => set(`${itemPath}.functionalDimension.description`, v)"
              />
            </el-form-item>
            <el-form-item label="Vertical Stages (comma-separated)">
              <el-input
                :model-value="arrayToCsv(item.functionalDimension.verticalStages)"
                @update:model-value="v => set(`${itemPath}.functionalDimension.verticalStages`, csvToArray(v))"
                placeholder="e.g. Manufacturing, Distribution, Retail"
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
.merger-dimension {
  padding: 0.75rem;
  border: 1px solid var(--fcc-border, #dbe3ef);
  border-radius: var(--fcc-radius-md, 6px);
  background: var(--fcc-bg-surface-muted, #f8fafc);
}
</style>
