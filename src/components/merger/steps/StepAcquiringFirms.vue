<script setup>
import { inject } from 'vue'
import CountrySelect from '@/components/forms/CountrySelect.vue'
import MergerAddressFields from '@/components/merger/MergerAddressFields.vue'
import MergerArrayManager from '@/components/merger/MergerArrayManager.vue'
import SmartFormGrid from '@/components/forms/SmartFormGrid.vue'
import { ENTITY_TYPES, ACQUISITION_TYPES, REL_BODY_TYPES, mk } from '@/constants/mergerFcc8Config'

const get = inject('wizardGet')
const set = inject('wizardSet')
const form = inject('wizardForm')

function addFirm() {
  set('acquiringFirms', [...form.acquiringFirms, mk.acquiringFirm()])
}

function removeFirm(index) {
  if (form.acquiringFirms.length <= 1) return
  set('acquiringFirms', form.acquiringFirms.filter((_, i) => i !== index))
}
</script>

<template>
  <div class="space-y-4">
    <div class="merger-info-box">
      Multiple acquiring firms supported. Each firm's acquisition details, ownership structure, and related bodies are captured independently.
    </div>

    <div v-for="(firm, i) in form.acquiringFirms" :key="i" class="merger-firm-card">
      <div class="merger-firm-card__head">
        <span class="merger-firm-card__title">Acquiring Firm #{{ i + 1 }}</span>
        <el-button v-if="form.acquiringFirms.length > 1" type="danger" text @click="removeFirm(i)">Remove</el-button>
      </div>
      <div class="merger-firm-card__body space-y-5">
        <!-- Type & Acquisition -->
        <SmartFormGrid :max-cols="2">
          <el-form-item label="Entity Type" required>
            <el-select :model-value="firm.acquiringFirmType" @update:model-value="v => set(`acquiringFirms.${i}.acquiringFirmType`, v)" class="w-full" placeholder="Select...">
              <el-option v-for="o in ENTITY_TYPES" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="Acquisition Type" required>
            <el-select :model-value="firm.acquisitionDetails.acquisitionType" @update:model-value="v => set(`acquiringFirms.${i}.acquisitionDetails.acquisitionType`, v)" class="w-full">
              <el-option v-for="o in ACQUISITION_TYPES" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </el-form-item>
        </SmartFormGrid>

        <!-- Body Corporate -->
        <template v-if="firm.acquiringFirmType === 'bodyCorporate'">
          <SmartFormGrid :max-cols="3">
            <el-form-item label="Company Name" required>
              <el-input :model-value="firm.bodyCorporateDetails.companyName" @update:model-value="v => set(`acquiringFirms.${i}.bodyCorporateDetails.companyName`, v)" />
            </el-form-item>
            <el-form-item label="Registration No.">
              <el-input :model-value="firm.bodyCorporateDetails.registrationNumber" @update:model-value="v => set(`acquiringFirms.${i}.bodyCorporateDetails.registrationNumber`, v)" />
            </el-form-item>
            <el-form-item label="Place of Incorporation" required>
              <el-input :model-value="firm.bodyCorporateDetails.placeOfIncorporation" @update:model-value="v => set(`acquiringFirms.${i}.bodyCorporateDetails.placeOfIncorporation`, v)" />
            </el-form-item>
          </SmartFormGrid>
          <MergerAddressFields :path="`acquiringFirms.${i}.bodyCorporateDetails.registeredOffice`" />
        </template>

        <!-- Individual -->
        <template v-if="firm.acquiringFirmType === 'individual'">
          <SmartFormGrid :max-cols="3">
            <el-form-item label="Full Name" required>
              <el-input :model-value="firm.individualDetails.fullName" @update:model-value="v => set(`acquiringFirms.${i}.individualDetails.fullName`, v)" />
            </el-form-item>
            <el-form-item label="National ID">
              <el-input :model-value="firm.individualDetails.nationalId" @update:model-value="v => set(`acquiringFirms.${i}.individualDetails.nationalId`, v)" />
            </el-form-item>
            <el-form-item label="Nationality">
              <CountrySelect :model-value="firm.individualDetails.nationality" @update:model-value="v => set(`acquiringFirms.${i}.individualDetails.nationality`, v)" placeholder="Select nationality" />
            </el-form-item>
            <el-form-item label="Phone">
              <el-input :model-value="firm.individualDetails.phone" @update:model-value="v => set(`acquiringFirms.${i}.individualDetails.phone`, v)" />
            </el-form-item>
            <el-form-item label="Email">
              <el-input :model-value="firm.individualDetails.email" @update:model-value="v => set(`acquiringFirms.${i}.individualDetails.email`, v)" type="email" />
            </el-form-item>
          </SmartFormGrid>
        </template>

        <!-- Shares detail -->
        <template v-if="firm.acquisitionDetails.acquisitionType === 'shares' || firm.acquisitionDetails.acquisitionType === 'sharesAndAssets'">
          <SmartFormGrid :max-cols="4">
            <el-form-item label="No. of Shares">
              <el-input-number :model-value="firm.acquisitionDetails.shares.numberOfShares" @update:model-value="v => set(`acquiringFirms.${i}.acquisitionDetails.shares.numberOfShares`, v)" :min="0" class="!w-full" />
            </el-form-item>
            <el-form-item label="Share Type">
              <el-input :model-value="firm.acquisitionDetails.shares.shareType" @update:model-value="v => set(`acquiringFirms.${i}.acquisitionDetails.shares.shareType`, v)" placeholder="Ordinary" />
            </el-form-item>
            <el-form-item label="% of Issued Capital">
              <el-input-number :model-value="firm.acquisitionDetails.shares.percentageOfIssuedCapital" @update:model-value="v => set(`acquiringFirms.${i}.acquisitionDetails.shares.percentageOfIssuedCapital`, v)" :min="0" :max="100" class="!w-full" />
            </el-form-item>
            <el-form-item label="Description">
              <el-input :model-value="firm.acquisitionDetails.shares.description" @update:model-value="v => set(`acquiringFirms.${i}.acquisitionDetails.shares.description`, v)" />
            </el-form-item>
          </SmartFormGrid>
        </template>

        <!-- Business Description -->
        <el-form-item label="Business Description">
          <el-input type="textarea" :rows="3" :model-value="firm.businessDescription.description" @update:model-value="v => set(`acquiringFirms.${i}.businessDescription.description`, v)" placeholder="Describe all businesses, products and services..." />
        </el-form-item>

        <!-- Shareholders -->
        <MergerArrayManager :path="`acquiringFirms.${i}.ownershipStructure.shareholders`" title="Shareholder" :factory="mk.shareholder">
          <template #default="{ item, path: itemPath }">
            <SmartFormGrid :max-cols="4">
              <el-form-item label="Name">
                <el-input :model-value="item.name" @update:model-value="v => set(`${itemPath}.name`, v)" />
              </el-form-item>
              <el-form-item label="Shareholding %">
                <el-input-number :model-value="item.shareholdingPercentage" @update:model-value="v => set(`${itemPath}.shareholdingPercentage`, v)" :min="0" :max="100" class="!w-full" />
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

        <!-- Related Bodies Corporate -->
        <MergerArrayManager :path="`acquiringFirms.${i}.relatedBodiesCorporate`" title="Related Body" :factory="mk.relBody">
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
                <el-input-number :model-value="item.ownershipPercentage" @update:model-value="v => set(`${itemPath}.ownershipPercentage`, v)" :min="0" :max="100" class="!w-full" />
              </el-form-item>
              <el-form-item label="Principal Business" class="col-span-full">
                <el-input :model-value="item.principalBusiness" @update:model-value="v => set(`${itemPath}.principalBusiness`, v)" />
              </el-form-item>
            </SmartFormGrid>
          </template>
        </MergerArrayManager>

        <!-- Tanzania Service Address -->
        <div>
          <h4 class="merger-field-group-title">Tanzania Service Address <span class="merger-ref">1(d)</span></h4>
          <MergerAddressFields :path="`acquiringFirms.${i}.tanzaniaServiceAddress`" />
        </div>

        <!-- Beneficial Owner -->
        <div>
          <el-checkbox :model-value="firm.beneficialOwner.hasBeneficialOwner" @update:model-value="v => set(`acquiringFirms.${i}.beneficialOwner.hasBeneficialOwner`, v)">
            1(e) — Shares/assets held for benefit of another person
          </el-checkbox>
          <SmartFormGrid v-if="firm.beneficialOwner.hasBeneficialOwner" :max-cols="2" class="mt-3">
            <el-form-item label="Beneficial Owner Name">
              <el-input :model-value="firm.beneficialOwner.name" @update:model-value="v => set(`acquiringFirms.${i}.beneficialOwner.name`, v)" />
            </el-form-item>
            <el-form-item label="Relationship to Acquiring Firm">
              <el-input :model-value="firm.beneficialOwner.relationshipToAcquiringFirm" @update:model-value="v => set(`acquiringFirms.${i}.beneficialOwner.relationshipToAcquiringFirm`, v)" />
            </el-form-item>
          </SmartFormGrid>
        </div>
      </div>
    </div>

    <button type="button" class="merger-add-firm" @click="addFirm">+ Add Acquiring Firm</button>
  </div>
</template>

<style scoped>
.merger-info-box {
  padding: 0.625rem 0.875rem;
  background: color-mix(in srgb, var(--fcc-secondary-500, #0ea5e9) 4%, var(--fcc-bg-surface, #fff));
  border-left: 3px solid var(--fcc-secondary-500, #0ea5e9);
  border-radius: var(--fcc-radius-md, 6px);
  font-size: 0.8125rem;
  color: var(--fcc-text-secondary, #475569);
  line-height: 1.5;
}
.merger-firm-card {
  border: 1px solid var(--fcc-border, #dbe3ef);
  border-radius: var(--fcc-radius-card, 10px);
  overflow: hidden;
  margin-bottom: 0.75rem;
}
.merger-firm-card__head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.5rem 1rem;
  background: var(--fcc-bg-surface-muted, #f8fafc);
  border-bottom: 1px solid var(--fcc-border, #dbe3ef);
}
.merger-firm-card__title { font-size: 0.8125rem; font-weight: 700; color: var(--fcc-text-secondary, #475569); }
.merger-firm-card__body { padding: 1rem; }
.merger-field-group-title { font-size: 0.8125rem; font-weight: 600; color: var(--fcc-text-secondary, #475569); margin: 0.875rem 0 0.5rem; }
.merger-ref { font-size: 0.625rem; color: var(--fcc-text-muted, #64748b); font-weight: 500; }
.merger-add-firm {
  display: flex; align-items: center; justify-content: center; gap: 0.375rem;
  width: 100%; padding: 0.625rem;
  border: 1.5px dashed var(--fcc-secondary-500, #0ea5e9);
  border-radius: var(--fcc-radius-base, 8px);
  background: color-mix(in srgb, var(--fcc-secondary-500, #0ea5e9) 4%, var(--fcc-bg-surface, #fff));
  color: var(--fcc-secondary-500, #0ea5e9);
  font-family: var(--fcc-font-body, inherit); font-size: 0.8125rem; font-weight: 600; cursor: pointer;
}
.merger-add-firm:hover { background: color-mix(in srgb, var(--fcc-secondary-500, #0ea5e9) 8%, var(--fcc-bg-surface, #fff)); }
</style>
