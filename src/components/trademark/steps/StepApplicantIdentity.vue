<script setup>
import { inject } from 'vue'
import SmartFormGrid from '@/components/forms/SmartFormGrid.vue'

const form = inject('wizardForm')
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-lg font-semibold text-slate-800">Applicant Identity</h2>
      <p class="mt-1 text-sm text-slate-500">
        Provide details about the party submitting this request.
      </p>
    </div>

    <el-form label-position="top">
      <!-- Role & Type -->
      <SmartFormGrid :max-cols="2">
        <el-form-item label="Applicant Role">
          <el-radio-group v-model="form.applicantRole">
            <el-radio value="brand_owner">Brand Owner</el-radio>
            <el-radio value="agent">Agent / Representative</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="Applicant Type">
          <el-select v-model="form.applicantType" style="width: 100%">
            <el-option label="Company / Firm" value="firm" />
            <el-option label="Individual" value="individual" />
          </el-select>
        </el-form-item>
      </SmartFormGrid>

      <!-- Firm fields -->
      <template v-if="form.applicantType === 'firm'">
        <SmartFormGrid :max-cols="3">
          <el-form-item label="Company Name" required>
            <el-input v-model="form.companyName" placeholder="Registered company name" clearable />
          </el-form-item>
          <el-form-item label="Registration Number">
            <el-input v-model="form.registrationNumber" placeholder="Company registration number" clearable />
          </el-form-item>
          <el-form-item label="Country of Incorporation">
            <el-input v-model="form.countryOfIncorporation" placeholder="Country" clearable />
          </el-form-item>
        </SmartFormGrid>
      </template>

      <!-- Individual fields -->
      <template v-else>
        <SmartFormGrid :max-cols="3">
          <el-form-item label="First Name" required>
            <el-input v-model="form.firstName" placeholder="First name" clearable />
          </el-form-item>
          <el-form-item label="Surname" required>
            <el-input v-model="form.surname" placeholder="Surname / family name" clearable />
          </el-form-item>
          <el-form-item label="National ID / Passport No.">
            <el-input v-model="form.nationalId" placeholder="ID or passport number" clearable />
          </el-form-item>
          <el-form-item label="Nationality / Country of Residence">
            <el-input v-model="form.countryOfResidence" placeholder="Country" clearable />
          </el-form-item>
        </SmartFormGrid>
      </template>

      <!-- Common contact fields -->
      <SmartFormGrid :max-cols="3">
        <el-form-item label="Contact Email" required>
          <el-input v-model="form.contactEmail" type="email" placeholder="contact@example.com" clearable />
        </el-form-item>
        <el-form-item label="Phone Number">
          <el-input v-model="form.phoneNumber" placeholder="+255 xxx xxx xxx" clearable />
        </el-form-item>
        <el-form-item label="Postal Address">
          <el-input v-model="form.postalAddress" placeholder="P.O. Box / postal address" clearable />
        </el-form-item>
        <el-form-item label="Physical Address">
          <el-input v-model="form.physicalAddress" placeholder="Street / building address" clearable />
        </el-form-item>
        <el-form-item label="Business Description" class="col-span-full" full-width>
          <el-input
            v-model="form.businessDescription"
            type="textarea"
            :rows="3"
            placeholder="Brief description of the business or applicant's activities"
          />
        </el-form-item>
      </SmartFormGrid>

      <!-- Agent section (only when applicantRole === 'agent') -->
      <template v-if="form.applicantRole === 'agent'">
        <div class="rounded-xl border border-sky-200 bg-sky-50 p-4">
          <p class="text-sm font-semibold text-sky-800">Agent / Representative Details</p>
          <p class="mt-1 text-xs text-sky-700">
            You are submitting on behalf of a brand owner. The brand owner's details will be captured in the next step.
          </p>
        </div>

        <SmartFormGrid :max-cols="3">
          <el-form-item label="Agent Name" required>
            <el-input v-model="form.agentName" placeholder="Full name of agent" clearable />
          </el-form-item>
          <el-form-item label="Agent Firm">
            <el-input v-model="form.agentFirm" placeholder="Law firm or company name" clearable />
          </el-form-item>
          <el-form-item label="Agent Email">
            <el-input v-model="form.agentEmail" type="email" placeholder="agent@lawfirm.com" clearable />
          </el-form-item>
          <el-form-item label="Agent Phone">
            <el-input v-model="form.agentPhone" placeholder="+255 xxx xxx xxx" clearable />
          </el-form-item>
          <el-form-item label="Power of Attorney Number">
            <el-input v-model="form.powerOfAttorneyNumber" placeholder="POA reference number" clearable />
          </el-form-item>
        </SmartFormGrid>
      </template>
    </el-form>
  </div>
</template>
