<script setup>
import { computed } from 'vue'
import CountrySelect from '@/components/forms/CountrySelect.vue'
import SmartFormGrid from '@/components/forms/SmartFormGrid.vue'

const props = defineProps({
  formData: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:formData'])

const isFirm = computed(() => (props.formData.applicantType || 'firm') === 'firm')

function update(key, value) {
  emit('update:formData', { ...props.formData, [key]: value })
}
</script>

<template>
  <div class="space-y-4">
    <el-form-item label="Applicant Type">
      <el-segmented
        :model-value="formData.applicantType || 'firm'"
        :options="[{ label: 'Firm', value: 'firm' }, { label: 'Individual', value: 'individual' }]"
        @change="update('applicantType', $event)"
      />
    </el-form-item>

    <SmartFormGrid :max-cols="2">
      <template v-if="isFirm">
        <el-form-item label="Company Name" required>
          <el-input :model-value="formData.companyName" @update:model-value="update('companyName', $event)" :disabled="disabled" />
        </el-form-item>
        <el-form-item label="Registration Number" required>
          <el-input :model-value="formData.registrationNumber" @update:model-value="update('registrationNumber', $event)" :disabled="disabled" />
        </el-form-item>
        <el-form-item label="Country of Incorporation">
          <CountrySelect :model-value="formData.countryOfIncorporation || 'Tanzania'" @update:model-value="update('countryOfIncorporation', $event)" :disabled="disabled" placeholder="Select country of incorporation" />
        </el-form-item>
        <el-form-item label="Contact Person Name" required>
          <el-input :model-value="formData.contactPersonName" @update:model-value="update('contactPersonName', $event)" :disabled="disabled" />
        </el-form-item>
        <el-form-item label="Contact Person Email" required>
          <el-input :model-value="formData.contactPersonEmail" @update:model-value="update('contactPersonEmail', $event)" :disabled="disabled" />
        </el-form-item>
        <el-form-item label="Contact Person Phone" required>
          <el-input :model-value="formData.contactPersonPhone" @update:model-value="update('contactPersonPhone', $event)" :disabled="disabled" />
        </el-form-item>
      </template>

      <template v-else>
        <el-form-item label="First Name" required>
          <el-input :model-value="formData.firstName" @update:model-value="update('firstName', $event)" :disabled="disabled" />
        </el-form-item>
        <el-form-item label="Surname" required>
          <el-input :model-value="formData.surname" @update:model-value="update('surname', $event)" :disabled="disabled" />
        </el-form-item>
        <el-form-item label="National ID / Passport">
          <el-input :model-value="formData.nationalId" @update:model-value="update('nationalId', $event)" :disabled="disabled" />
        </el-form-item>
        <el-form-item label="Country of Residence">
          <CountrySelect :model-value="formData.countryOfResidence || 'Tanzania'" @update:model-value="update('countryOfResidence', $event)" :disabled="disabled" placeholder="Select country of residence" />
        </el-form-item>
      </template>

      <el-form-item label="Email" required>
        <el-input :model-value="formData.contactEmail" @update:model-value="update('contactEmail', $event)" :disabled="disabled" />
      </el-form-item>
      <el-form-item label="Phone Number" required>
        <el-input :model-value="formData.phoneNumber" @update:model-value="update('phoneNumber', $event)" :disabled="disabled" />
      </el-form-item>
      <el-form-item label="Postal Address">
        <el-input :model-value="formData.postalAddress" @update:model-value="update('postalAddress', $event)" :disabled="disabled" />
      </el-form-item>
      <el-form-item label="Physical Address">
        <el-input :model-value="formData.physicalAddress" @update:model-value="update('physicalAddress', $event)" :disabled="disabled" />
      </el-form-item>
      <el-form-item label="Business Description" class="col-span-full" full-width>
        <el-input type="textarea" :rows="3" :model-value="formData.businessDescription" @update:model-value="update('businessDescription', $event)" :disabled="disabled" />
      </el-form-item>
    </SmartFormGrid>
  </div>
</template>
