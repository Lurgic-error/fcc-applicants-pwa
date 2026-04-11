<script setup>
import { inject } from 'vue'
import CountrySelect from '@/components/forms/CountrySelect.vue'
import MergerAddressFields from '@/components/merger/MergerAddressFields.vue'
import SmartFormGrid from '@/components/forms/SmartFormGrid.vue'
import { APPLICANT_TYPES, APPLICANT_ROLES } from '@/constants/mergerFcc8Config'

const get = inject('wizardGet')
const set = inject('wizardSet')
const form = inject('wizardForm')
</script>

<template>
  <div class="space-y-6">
    <!-- Identity -->
    <div>
      <h3 class="merger-subsection-title">Identity</h3>
      <SmartFormGrid :max-cols="2">
        <el-form-item label="Applicant Type" required>
          <el-select :model-value="form.applicant.applicantType" @update:model-value="v => set('applicant.applicantType', v)" class="w-full" placeholder="Select...">
            <el-option v-for="o in APPLICANT_TYPES" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="Applicant Role" required>
          <el-select :model-value="form.applicant.applicantRole" @update:model-value="v => set('applicant.applicantRole', v)" class="w-full" placeholder="Select...">
            <el-option v-for="o in APPLICANT_ROLES" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.applicant.applicantRole === 'representative'" label="Acts on behalf of" required>
          <el-select :model-value="form.applicant.actsOnBehalfOf" @update:model-value="v => set('applicant.actsOnBehalfOf', v)" class="w-full">
            <el-option label="Acquiring Side" value="acquiringSide" />
            <el-option label="Target Side" value="targetSide" />
          </el-select>
        </el-form-item>
      </SmartFormGrid>
    </div>

    <!-- Individual Details -->
    <div v-if="form.applicant.applicantType === 'individual'">
      <h3 class="merger-subsection-title">Individual Details</h3>
      <SmartFormGrid :max-cols="2">
        <el-form-item label="Full Name" required>
          <el-input :model-value="get('applicant.individualDetails.fullName')" @update:model-value="v => set('applicant.individualDetails.fullName', v)" />
        </el-form-item>
        <el-form-item label="National ID">
          <el-input :model-value="get('applicant.individualDetails.nationalId')" @update:model-value="v => set('applicant.individualDetails.nationalId', v)" />
        </el-form-item>
        <el-form-item label="Nationality">
          <CountrySelect :model-value="get('applicant.individualDetails.nationality')" @update:model-value="v => set('applicant.individualDetails.nationality', v)" placeholder="Select nationality" />
        </el-form-item>
        <el-form-item label="Occupation">
          <el-input :model-value="get('applicant.individualDetails.occupation')" @update:model-value="v => set('applicant.individualDetails.occupation', v)" />
        </el-form-item>
        <el-form-item label="Phone">
          <el-input :model-value="get('applicant.individualDetails.phone')" @update:model-value="v => set('applicant.individualDetails.phone', v)" />
        </el-form-item>
        <el-form-item label="Email">
          <el-input :model-value="get('applicant.individualDetails.email')" @update:model-value="v => set('applicant.individualDetails.email', v)" type="email" />
        </el-form-item>
      </SmartFormGrid>
      <h4 class="merger-field-group-title">Physical Address</h4>
      <MergerAddressFields path="applicant.individualDetails.physicalAddress" />
    </div>

    <!-- Company / Law Firm Details -->
    <div v-if="form.applicant.applicantType === 'company' || form.applicant.applicantType === 'lawFirm'">
      <h3 class="merger-subsection-title">{{ form.applicant.applicantType === 'lawFirm' ? 'Law Firm' : 'Company' }} Details</h3>
      <SmartFormGrid :max-cols="2">
        <el-form-item label="Name" required>
          <el-input :model-value="get('applicant.companyDetails.companyName')" @update:model-value="v => set('applicant.companyDetails.companyName', v)" />
        </el-form-item>
        <el-form-item label="Registration No.">
          <el-input :model-value="get('applicant.companyDetails.registrationNumber')" @update:model-value="v => set('applicant.companyDetails.registrationNumber', v)" />
        </el-form-item>
        <el-form-item label="Place of Incorporation">
          <el-input :model-value="get('applicant.companyDetails.placeOfIncorporation')" @update:model-value="v => set('applicant.companyDetails.placeOfIncorporation', v)" />
        </el-form-item>
      </SmartFormGrid>
      <h4 class="merger-field-group-title">Registered Office</h4>
      <MergerAddressFields path="applicant.companyDetails.registeredOffice" />
      <h4 class="merger-field-group-title">Contact Person</h4>
      <SmartFormGrid :max-cols="2">
        <el-form-item label="Full Name">
          <el-input :model-value="get('applicant.companyDetails.contactPerson.fullName')" @update:model-value="v => set('applicant.companyDetails.contactPerson.fullName', v)" />
        </el-form-item>
        <el-form-item label="Position">
          <el-input :model-value="get('applicant.companyDetails.contactPerson.position')" @update:model-value="v => set('applicant.companyDetails.contactPerson.position', v)" />
        </el-form-item>
        <el-form-item label="Phone">
          <el-input :model-value="get('applicant.companyDetails.contactPerson.phone')" @update:model-value="v => set('applicant.companyDetails.contactPerson.phone', v)" />
        </el-form-item>
        <el-form-item label="Email">
          <el-input :model-value="get('applicant.companyDetails.contactPerson.email')" @update:model-value="v => set('applicant.companyDetails.contactPerson.email', v)" type="email" />
        </el-form-item>
      </SmartFormGrid>
    </div>

    <!-- Tanzania Service Address -->
    <div>
      <h3 class="merger-subsection-title">Tanzania Service Address <span class="merger-ref">1(d)</span></h3>
      <MergerAddressFields path="applicant.tanzaniaServiceAddress" />
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
.merger-ref {
  font-size: 0.625rem;
  color: var(--fcc-text-muted, #64748b);
  font-weight: 500;
}
</style>
