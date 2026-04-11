<script setup>
import { inject, watch } from 'vue'
import CountrySelect from '@/components/forms/CountrySelect.vue'
import MergerAddressFields from '@/components/merger/MergerAddressFields.vue'
import MergerArrayManager from '@/components/merger/MergerArrayManager.vue'
import SmartFormGrid from '@/components/forms/SmartFormGrid.vue'
import { ENTITY_TYPES, ACQUISITION_TYPES, REL_BODY_TYPES, mk } from '@/constants/mergerFcc8Config'

const get = inject('wizardGet')
const set = inject('wizardSet')
const form = inject('wizardForm')

/* When target is not registered in Tanzania, enable the local-nexus step */
watch(
  () => form.targetFirm.isRegisteredInTanzania,
  (val) => {
    set('localNexus.isApplicable', val === false)
  }
)
</script>

<template>
  <div class="space-y-6">
    <!-- Target Type & Jurisdiction -->
    <div>
      <h3 class="merger-subsection-title">Section 2 — Target Firm</h3>
      <SmartFormGrid :max-cols="2">
        <el-form-item label="Target Type" required>
          <el-select
            :model-value="form.targetFirm.targetType"
            @update:model-value="v => set('targetFirm.targetType', v)"
            class="w-full"
            placeholder="Select..."
          >
            <el-option v-for="o in ENTITY_TYPES" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="Registered in Tanzania?" required>
          <el-radio-group
            :model-value="form.targetFirm.isRegisteredInTanzania"
            @update:model-value="v => set('targetFirm.isRegisteredInTanzania', v)"
          >
            <el-radio :value="true">Yes</el-radio>
            <el-radio :value="false">No</el-radio>
          </el-radio-group>
        </el-form-item>
      </SmartFormGrid>

      <div v-if="form.targetFirm.isRegisteredInTanzania === false" class="merger-warning-box">
        The target firm is not registered in Tanzania. You will need to complete the
        <strong>Local Nexus</strong> step to establish the Tanzanian connection.
      </div>
    </div>

    <!-- Body Corporate Details -->
    <template v-if="form.targetFirm.targetType === 'bodyCorporate'">
      <div>
        <h3 class="merger-subsection-title">Body Corporate Details</h3>
        <SmartFormGrid :max-cols="3">
          <el-form-item label="Company Name" required>
            <el-input
              :model-value="get('targetFirm.bodyCorporateDetails.name')"
              @update:model-value="v => set('targetFirm.bodyCorporateDetails.name', v)"
            />
          </el-form-item>
          <el-form-item label="Place of Incorporation" required>
            <el-input
              :model-value="get('targetFirm.bodyCorporateDetails.placeOfIncorporation')"
              @update:model-value="v => set('targetFirm.bodyCorporateDetails.placeOfIncorporation', v)"
            />
          </el-form-item>
          <el-form-item label="Shares / Assets to Acquire" required>
            <el-select
              :model-value="get('targetFirm.bodyCorporateDetails.sharesOrAssetsToBeAcquired.acquisitionType')"
              @update:model-value="v => set('targetFirm.bodyCorporateDetails.sharesOrAssetsToBeAcquired.acquisitionType', v)"
              class="w-full"
              placeholder="Select..."
            >
              <el-option v-for="o in ACQUISITION_TYPES" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </el-form-item>
        </SmartFormGrid>

        <h4 class="merger-field-group-title">Registered Office</h4>
        <MergerAddressFields path="targetFirm.bodyCorporateDetails.registeredOffice" />

        <el-form-item label="Business Description" class="mt-4">
          <el-input
            type="textarea"
            :rows="3"
            :model-value="get('targetFirm.bodyCorporateDetails.businessDescription.description')"
            @update:model-value="v => set('targetFirm.bodyCorporateDetails.businessDescription.description', v)"
            placeholder="Describe all businesses, products and services..."
          />
        </el-form-item>
      </div>

      <!-- Issued Capital Details -->
      <div>
        <h3 class="merger-subsection-title">Issued Capital Details</h3>
        <SmartFormGrid :max-cols="3">
          <el-form-item label="Total Amount">
            <el-input-number
              :model-value="get('targetFirm.issuedCapitalDetails.totalIssuedCapital.amount')"
              @update:model-value="v => set('targetFirm.issuedCapitalDetails.totalIssuedCapital.amount', v)"
              :min="0"
              class="!w-full"
            />
          </el-form-item>
          <el-form-item label="Currency">
            <el-input
              :model-value="get('targetFirm.issuedCapitalDetails.totalIssuedCapital.currency')"
              @update:model-value="v => set('targetFirm.issuedCapitalDetails.totalIssuedCapital.currency', v)"
              placeholder="TZS"
            />
          </el-form-item>
          <el-form-item label="Number of Shares">
            <el-input-number
              :model-value="get('targetFirm.issuedCapitalDetails.totalIssuedCapital.numberOfShares')"
              @update:model-value="v => set('targetFirm.issuedCapitalDetails.totalIssuedCapital.numberOfShares', v)"
              :min="0"
              class="!w-full"
            />
          </el-form-item>
        </SmartFormGrid>
      </div>
    </template>

    <!-- Individual Details -->
    <template v-if="form.targetFirm.targetType === 'individual'">
      <div>
        <h3 class="merger-subsection-title">Individual Details</h3>
        <SmartFormGrid :max-cols="2">
          <el-form-item label="Full Name" required>
            <el-input
              :model-value="get('targetFirm.individualDetails.fullName')"
              @update:model-value="v => set('targetFirm.individualDetails.fullName', v)"
            />
          </el-form-item>
          <el-form-item label="Nationality">
            <el-input
              :model-value="get('targetFirm.individualDetails.nationality')"
              @update:model-value="v => set('targetFirm.individualDetails.nationality', v)"
            />
          </el-form-item>
          <el-form-item label="Phone">
            <el-input
              :model-value="get('targetFirm.individualDetails.phone')"
              @update:model-value="v => set('targetFirm.individualDetails.phone', v)"
            />
          </el-form-item>
          <el-form-item label="Email">
            <el-input
              :model-value="get('targetFirm.individualDetails.email')"
              @update:model-value="v => set('targetFirm.individualDetails.email', v)"
              type="email"
            />
          </el-form-item>
        </SmartFormGrid>

        <h4 class="merger-field-group-title">Address</h4>
        <MergerAddressFields path="targetFirm.individualDetails.address" />

        <el-form-item label="Business Description" class="mt-4">
          <el-input
            type="textarea"
            :rows="3"
            :model-value="get('targetFirm.individualDetails.businessDescription.description')"
            @update:model-value="v => set('targetFirm.individualDetails.businessDescription.description', v)"
            placeholder="Describe all businesses, products and services..."
          />
        </el-form-item>

        <el-form-item label="Assets to be Acquired">
          <el-input
            type="textarea"
            :rows="2"
            :model-value="get('targetFirm.individualDetails.assetsToBeAcquired')"
            @update:model-value="v => set('targetFirm.individualDetails.assetsToBeAcquired', v)"
            placeholder="Describe assets to be acquired..."
          />
        </el-form-item>
      </div>
    </template>

    <!-- Ownership Structure -->
    <div>
      <h3 class="merger-subsection-title">Ownership Structure</h3>
      <MergerArrayManager path="targetFirm.ownershipStructure.shareholders" title="Shareholder" :factory="mk.shareholder">
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

    <!-- Related Bodies Corporate -->
    <div>
      <h3 class="merger-subsection-title">Related Bodies Corporate</h3>
      <MergerArrayManager path="targetFirm.relatedBodiesCorporate" title="Related Body" :factory="mk.relBody">
        <template #default="{ item, path: itemPath }">
          <SmartFormGrid :max-cols="2">
            <el-form-item label="Name" required>
              <el-input :model-value="item.name" @update:model-value="v => set(`${itemPath}.name`, v)" />
            </el-form-item>
            <el-form-item label="Relationship Type" required>
              <el-select :model-value="item.relationshipType" @update:model-value="v => set(`${itemPath}.relationshipType`, v)" class="w-full">
                <el-option v-for="o in REL_BODY_TYPES" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Place of Incorporation">
              <el-input :model-value="item.placeOfIncorporation" @update:model-value="v => set(`${itemPath}.placeOfIncorporation`, v)" />
            </el-form-item>
            <el-form-item label="Ownership %">
              <el-input-number
                :model-value="item.ownershipPercentage"
                @update:model-value="v => set(`${itemPath}.ownershipPercentage`, v)"
                :min="0" :max="100" class="!w-full"
              />
            </el-form-item>
            <el-form-item label="Principal Business" class="col-span-full">
              <el-input :model-value="item.principalBusiness" @update:model-value="v => set(`${itemPath}.principalBusiness`, v)" />
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
.merger-warning-box {
  padding: 0.625rem 0.875rem;
  background: color-mix(in srgb, var(--fcc-warning-500, #f59e0b) 8%, var(--fcc-bg-surface, #fff));
  border-left: 3px solid var(--fcc-warning-500, #f59e0b);
  border-radius: var(--fcc-radius-md, 6px);
  font-size: 0.8125rem;
  color: var(--fcc-text-secondary, #475569);
  line-height: 1.5;
  margin-top: 0.5rem;
}
</style>
