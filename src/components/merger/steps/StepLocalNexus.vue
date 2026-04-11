<script setup>
import { inject } from 'vue'
import CountrySelect from '@/components/forms/CountrySelect.vue'
import MergerAddressFields from '@/components/merger/MergerAddressFields.vue'
import MergerArrayManager from '@/components/merger/MergerArrayManager.vue'
import SmartFormGrid from '@/components/forms/SmartFormGrid.vue'
import { LOCAL_NEXUS_RELATIONSHIPS, mk } from '@/constants/mergerFcc8Config'

const get = inject('wizardGet')
const set = inject('wizardSet')
const form = inject('wizardForm')
</script>

<template>
  <div class="space-y-6">
    <div class="merger-info-box">
      This step captures the Tanzanian subsidiary, branch, or affiliate through which the foreign
      target firm has a local nexus. It is required because the target firm is not registered in Tanzania.
    </div>

    <!-- Company Identity -->
    <div>
      <h3 class="merger-subsection-title">Local Nexus Entity</h3>
      <SmartFormGrid :max-cols="2">
        <el-form-item label="Company Name" required>
          <el-input
            :model-value="get('localNexus.companyName')"
            @update:model-value="v => set('localNexus.companyName', v)"
          />
        </el-form-item>
        <el-form-item label="Registration Number">
          <el-input
            :model-value="get('localNexus.registrationNumber')"
            @update:model-value="v => set('localNexus.registrationNumber', v)"
          />
        </el-form-item>
        <el-form-item label="TIN Number">
          <el-input
            :model-value="get('localNexus.tinNumber')"
            @update:model-value="v => set('localNexus.tinNumber', v)"
          />
        </el-form-item>
        <el-form-item label="Date of Registration">
          <el-date-picker
            :model-value="get('localNexus.dateOfRegistration')"
            @update:model-value="v => set('localNexus.dateOfRegistration', v)"
            type="date"
            placeholder="Select date"
            class="!w-full"
          />
        </el-form-item>
        <el-form-item label="Relationship to Target" required>
          <el-select
            :model-value="get('localNexus.relationshipToTarget')"
            @update:model-value="v => set('localNexus.relationshipToTarget', v)"
            class="w-full"
            placeholder="Select..."
          >
            <el-option v-for="o in LOCAL_NEXUS_RELATIONSHIPS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="Ownership by Target (%)">
          <el-input-number
            :model-value="get('localNexus.ownershipByTarget')"
            @update:model-value="v => set('localNexus.ownershipByTarget', v)"
            :min="0" :max="100" class="!w-full"
          />
        </el-form-item>
      </SmartFormGrid>
    </div>

    <!-- Registered Office -->
    <div>
      <h4 class="merger-field-group-title">Registered Office</h4>
      <MergerAddressFields path="localNexus.registeredOffice" />
    </div>

    <!-- Descriptions -->
    <div>
      <el-form-item label="Relationship Description">
        <el-input
          type="textarea"
          :rows="3"
          :model-value="get('localNexus.relationshipDescription')"
          @update:model-value="v => set('localNexus.relationshipDescription', v)"
          placeholder="Describe the relationship between this entity and the target firm..."
        />
      </el-form-item>
      <el-form-item label="Business Description">
        <el-input
          type="textarea"
          :rows="3"
          :model-value="get('localNexus.businessDescription.description')"
          @update:model-value="v => set('localNexus.businessDescription.description', v)"
          placeholder="Describe the business activities of this entity in Tanzania..."
        />
      </el-form-item>
      <el-form-item label="Impact of Merger">
        <el-input
          type="textarea"
          :rows="3"
          :model-value="get('localNexus.impactOfMerger')"
          @update:model-value="v => set('localNexus.impactOfMerger', v)"
          placeholder="Describe how the proposed merger will impact this entity..."
        />
      </el-form-item>
    </div>

    <!-- Ownership Structure -->
    <div>
      <h3 class="merger-subsection-title">Ownership Structure</h3>
      <MergerArrayManager path="localNexus.ownershipStructure.shareholders" title="Shareholder" :factory="mk.shareholder">
        <template #default="{ item, path: itemPath }">
          <SmartFormGrid :max-cols="4">
            <el-form-item label="Name">
              <el-input :model-value="item.name" @update:model-value="v => set(`${itemPath}.name`, v)" />
            </el-form-item>
            <el-form-item label="Shareholding %">
              <el-input-number
                :model-value="item.shareholdingPercentage"
                @update:model-value="v => set(`${itemPath}.shareholdingPercentage`, v)"
                :min="0" :max="100" class="!w-full"
              />
            </el-form-item>
            <el-form-item label="Share Type">
              <el-input :model-value="item.shareType" @update:model-value="v => set(`${itemPath}.shareType`, v)" placeholder="Ordinary" />
            </el-form-item>
            <el-form-item label="Nationality">
              <CountrySelect :model-value="item.nationality" @update:model-value="v => set(`${itemPath}.nationality`, v)" placeholder="Select nationality" />
            </el-form-item>
          </SmartFormGrid>
        </template>
      </MergerArrayManager>
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
.merger-info-box {
  padding: 0.625rem 0.875rem;
  background: color-mix(in srgb, var(--fcc-secondary-500, #0ea5e9) 4%, var(--fcc-bg-surface, #fff));
  border-left: 3px solid var(--fcc-secondary-500, #0ea5e9);
  border-radius: var(--fcc-radius-md, 6px);
  font-size: 0.8125rem;
  color: var(--fcc-text-secondary, #475569);
  line-height: 1.5;
}
</style>
