<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  mode: {
    type: String,
    default: 'edit'
  }
})

const emit = defineEmits(['update:modelValue'])

const data = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

function update(field, value) {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}

function updateNested(parentField, field, value) {
  const parent = props.modelValue[parentField] || {}
  emit('update:modelValue', {
    ...props.modelValue,
    [parentField]: { ...parent, [field]: value }
  })
}

const isView = computed(() => props.mode === 'view')
const isIndividual = computed(() => props.modelValue?.type === 'individual')
const isCompany = computed(() => props.modelValue?.type === 'company')
</script>

<template>
  <div class="applicant-info-step">
    <!-- Applicant type toggle -->
    <div class="mb-4">
      <el-form-item label="Applicant Type">
        <el-radio-group
          :model-value="modelValue.type"
          :disabled="isView"
          @update:model-value="update('type', $event)"
        >
          <el-radio label="individual" value="individual">Individual</el-radio>
          <el-radio label="company" value="company">Company</el-radio>
        </el-radio-group>
      </el-form-item>
    </div>

    <!-- Individual fields -->
    <template v-if="isIndividual">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="First Name" prop="applicant.firstName">
            <div v-if="isView" class="view-value">{{ modelValue.firstName || '—' }}</div>
            <el-input
              v-else
              :model-value="modelValue.firstName"
              placeholder="First name"
              @update:model-value="update('firstName', $event)"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Surname" prop="applicant.surname">
            <div v-if="isView" class="view-value">{{ modelValue.surname || '—' }}</div>
            <el-input
              v-else
              :model-value="modelValue.surname"
              placeholder="Surname"
              @update:model-value="update('surname', $event)"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Email" prop="applicant.email">
            <div v-if="isView" class="view-value">{{ modelValue.email || '—' }}</div>
            <el-input
              v-else
              :model-value="modelValue.email"
              type="email"
              placeholder="Email address"
              @update:model-value="update('email', $event)"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Phone Number" prop="applicant.phoneNumber">
            <div v-if="isView" class="view-value">{{ modelValue.phoneNumber || '—' }}</div>
            <el-input
              v-else
              :model-value="modelValue.phoneNumber"
              placeholder="Phone number"
              @update:model-value="update('phoneNumber', $event)"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Nationality" prop="applicant.nationality">
            <div v-if="isView" class="view-value">{{ modelValue.nationality || '—' }}</div>
            <el-input
              v-else
              :model-value="modelValue.nationality"
              placeholder="Nationality"
              @update:model-value="update('nationality', $event)"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="National ID / Passport" prop="applicant.nationalId">
            <div v-if="isView" class="view-value">{{ modelValue.nationalId || '—' }}</div>
            <el-input
              v-else
              :model-value="modelValue.nationalId"
              placeholder="National ID or passport number"
              @update:model-value="update('nationalId', $event)"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item label="Date of Birth" prop="applicant.dateOfBirth">
            <div v-if="isView" class="view-value">{{ modelValue.dateOfBirth || '—' }}</div>
            <el-date-picker
              v-else
              :model-value="modelValue.dateOfBirth"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="Date of birth"
              @update:model-value="update('dateOfBirth', $event)"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Postal Address" prop="applicant.postalAddress">
            <div v-if="isView" class="view-value">{{ modelValue.postalAddress || '—' }}</div>
            <el-input
              v-else
              :model-value="modelValue.postalAddress"
              placeholder="Postal address"
              @update:model-value="update('postalAddress', $event)"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Physical Address" prop="applicant.physicalAddress">
            <div v-if="isView" class="view-value">{{ modelValue.physicalAddress || '—' }}</div>
            <el-input
              v-else
              :model-value="modelValue.physicalAddress"
              placeholder="Physical address"
              @update:model-value="update('physicalAddress', $event)"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </template>

    <!-- Company fields -->
    <template v-if="isCompany">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Company Name" prop="applicant.companyName">
            <div v-if="isView" class="view-value">{{ modelValue.companyName || '—' }}</div>
            <el-input
              v-else
              :model-value="modelValue.companyName"
              placeholder="Registered company name"
              @update:model-value="update('companyName', $event)"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Registration Number" prop="applicant.registrationNumber">
            <div v-if="isView" class="view-value">{{ modelValue.registrationNumber || '—' }}</div>
            <el-input
              v-else
              :model-value="modelValue.registrationNumber"
              placeholder="Company registration number"
              @update:model-value="update('registrationNumber', $event)"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Country of Incorporation" prop="applicant.countryOfIncorporation">
            <div v-if="isView" class="view-value">{{ modelValue.countryOfIncorporation || '—' }}</div>
            <el-input
              v-else
              :model-value="modelValue.countryOfIncorporation"
              placeholder="Country of incorporation"
              @update:model-value="update('countryOfIncorporation', $event)"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Business Description" prop="applicant.businessDescription">
            <div v-if="isView" class="view-value">{{ modelValue.businessDescription || '—' }}</div>
            <el-input
              v-else
              :model-value="modelValue.businessDescription"
              placeholder="Brief description of business"
              @update:model-value="update('businessDescription', $event)"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- Contact Person sub-section -->
      <div class="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p class="mb-3 text-sm font-semibold text-slate-600">Contact Person</p>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Name" prop="applicant.contactPerson.name">
              <div v-if="isView" class="view-value">{{ modelValue.contactPerson?.name || '—' }}</div>
              <el-input
                v-else
                :model-value="modelValue.contactPerson?.name"
                placeholder="Contact person name"
                @update:model-value="updateNested('contactPerson', 'name', $event)"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Designation" prop="applicant.contactPerson.designation">
              <div v-if="isView" class="view-value">{{ modelValue.contactPerson?.designation || '—' }}</div>
              <el-input
                v-else
                :model-value="modelValue.contactPerson?.designation"
                placeholder="e.g. CEO, Director"
                @update:model-value="updateNested('contactPerson', 'designation', $event)"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Email" prop="applicant.contactPerson.email">
              <div v-if="isView" class="view-value">{{ modelValue.contactPerson?.email || '—' }}</div>
              <el-input
                v-else
                :model-value="modelValue.contactPerson?.email"
                type="email"
                placeholder="Contact person email"
                @update:model-value="updateNested('contactPerson', 'email', $event)"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Phone" prop="applicant.contactPerson.phone">
              <div v-if="isView" class="view-value">{{ modelValue.contactPerson?.phone || '—' }}</div>
              <el-input
                v-else
                :model-value="modelValue.contactPerson?.phone"
                placeholder="Contact person phone"
                @update:model-value="updateNested('contactPerson', 'phone', $event)"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Postal Address" prop="applicant.postalAddress">
            <div v-if="isView" class="view-value">{{ modelValue.postalAddress || '—' }}</div>
            <el-input
              v-else
              :model-value="modelValue.postalAddress"
              placeholder="Postal address"
              @update:model-value="update('postalAddress', $event)"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Physical Address" prop="applicant.physicalAddress">
            <div v-if="isView" class="view-value">{{ modelValue.physicalAddress || '—' }}</div>
            <el-input
              v-else
              :model-value="modelValue.physicalAddress"
              placeholder="Physical address"
              @update:model-value="update('physicalAddress', $event)"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<style scoped>
.view-value {
  padding: 4px 0;
  color: var(--el-text-color-primary);
  min-height: 24px;
}
</style>
