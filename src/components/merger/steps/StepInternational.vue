<script setup>
import { inject } from 'vue'
import MergerArrayManager from '@/components/merger/MergerArrayManager.vue'
import SmartFormGrid from '@/components/forms/SmartFormGrid.vue'
import { NOTIFICATION_STATUSES, JURISDICTION_OUTCOMES, mk } from '@/constants/mergerFcc8Config'

const get = inject('wizardGet')
const set = inject('wizardSet')
const form = inject('wizardForm')
</script>

<template>
  <div class="space-y-6">
    <h3 class="merger-subsection-title">Section 21 — International Dimensions</h3>

    <!-- Foreign Parent in Tanzania -->
    <div class="merger-bool-section">
      <el-form-item label="Does the foreign parent operate in Tanzania?">
        <el-radio-group
          :model-value="get('international.internationalDimensions.foreignParentInTanzania.applicable')"
          @update:model-value="v => set('international.internationalDimensions.foreignParentInTanzania.applicable', v)"
        >
          <el-radio :value="true">Yes</el-radio>
          <el-radio :value="false">No</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item
        v-if="form.international?.internationalDimensions?.foreignParentInTanzania?.applicable === true"
        label="Details"
      >
        <el-input
          type="textarea"
          :rows="3"
          :model-value="get('international.internationalDimensions.foreignParentInTanzania.details')"
          @update:model-value="v => set('international.internationalDimensions.foreignParentInTanzania.details', v)"
          placeholder="Describe the foreign parent's operations in Tanzania..."
        />
      </el-form-item>
    </div>

    <!-- Tanzanian Affected by Overseas Conduct -->
    <div class="merger-bool-section">
      <el-form-item label="Are Tanzanian markets affected by overseas conduct?">
        <el-radio-group
          :model-value="get('international.internationalDimensions.tanzanianAffectedByOverseasConduct.applicable')"
          @update:model-value="v => set('international.internationalDimensions.tanzanianAffectedByOverseasConduct.applicable', v)"
        >
          <el-radio :value="true">Yes</el-radio>
          <el-radio :value="false">No</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item
        v-if="form.international?.internationalDimensions?.tanzanianAffectedByOverseasConduct?.applicable === true"
        label="Details"
      >
        <el-input
          type="textarea"
          :rows="3"
          :model-value="get('international.internationalDimensions.tanzanianAffectedByOverseasConduct.details')"
          @update:model-value="v => set('international.internationalDimensions.tanzanianAffectedByOverseasConduct.details', v)"
          placeholder="Describe how Tanzanian markets are affected..."
        />
      </el-form-item>
    </div>

    <!-- Cross-Border Conduct -->
    <div class="merger-bool-section">
      <el-form-item label="Does the merger involve cross-border conduct?">
        <el-radio-group
          :model-value="get('international.internationalDimensions.crossBorderConduct.applicable')"
          @update:model-value="v => set('international.internationalDimensions.crossBorderConduct.applicable', v)"
        >
          <el-radio :value="true">Yes</el-radio>
          <el-radio :value="false">No</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item
        v-if="form.international?.internationalDimensions?.crossBorderConduct?.applicable === true"
        label="Details"
      >
        <el-input
          type="textarea"
          :rows="3"
          :model-value="get('international.internationalDimensions.crossBorderConduct.details')"
          @update:model-value="v => set('international.internationalDimensions.crossBorderConduct.details', v)"
          placeholder="Describe the cross-border conduct..."
        />
      </el-form-item>
    </div>

    <!-- Other Jurisdiction Notifications -->
    <div>
      <h3 class="merger-subsection-title">Other Jurisdiction Notifications</h3>
      <MergerArrayManager path="international.otherJurisdictionNotifications" title="Notification" :factory="mk.jurisdictionNotif">
        <template #default="{ item, path: itemPath }">
          <div class="space-y-4">
            <SmartFormGrid :max-cols="2">
              <el-form-item label="Jurisdiction" required>
                <el-input
                  :model-value="item.jurisdiction"
                  @update:model-value="v => set(`${itemPath}.jurisdiction`, v)"
                  placeholder="e.g. Kenya, South Africa, EU"
                />
              </el-form-item>
              <el-form-item label="Competition Authority" required>
                <el-input
                  :model-value="item.competitionAuthority"
                  @update:model-value="v => set(`${itemPath}.competitionAuthority`, v)"
                  placeholder="e.g. CAK, CCSA"
                />
              </el-form-item>
              <el-form-item label="Notification Status" required>
                <el-select
                  :model-value="item.notificationStatus"
                  @update:model-value="v => set(`${itemPath}.notificationStatus`, v)"
                  class="w-full"
                  placeholder="Select..."
                >
                  <el-option v-for="o in NOTIFICATION_STATUSES" :key="o.value" :label="o.label" :value="o.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="Notification Date">
                <el-date-picker
                  :model-value="item.notificationDate"
                  @update:model-value="v => set(`${itemPath}.notificationDate`, v)"
                  type="date"
                  placeholder="Select date"
                  class="!w-full"
                />
              </el-form-item>
              <el-form-item label="Reference Number">
                <el-input
                  :model-value="item.referenceNumber"
                  @update:model-value="v => set(`${itemPath}.referenceNumber`, v)"
                />
              </el-form-item>
              <el-form-item label="Outcome">
                <el-select
                  :model-value="item.outcome"
                  @update:model-value="v => set(`${itemPath}.outcome`, v)"
                  class="w-full"
                  placeholder="Select..."
                >
                  <el-option v-for="o in JURISDICTION_OUTCOMES" :key="o.value" :label="o.label" :value="o.value" />
                </el-select>
              </el-form-item>
            </SmartFormGrid>
          </div>
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
.merger-bool-section {
  padding: 0.75rem;
  border: 1px solid var(--fcc-border, #dbe3ef);
  border-radius: var(--fcc-radius-md, 6px);
  background: var(--fcc-bg-surface-muted, #f8fafc);
}
</style>
