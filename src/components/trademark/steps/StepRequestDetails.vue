<script setup>
import { inject, computed } from 'vue'
import SmartFormGrid from '@/components/forms/SmartFormGrid.vue'

const form = inject('wizardForm')

const requestType = computed(() => form.requestType)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-lg font-semibold text-slate-800">Request Details</h2>
      <p class="mt-1 text-sm text-slate-500">
        Provide additional information specific to your selected request type.
      </p>
    </div>

    <el-form label-position="top">
      <!-- new_recordation -->
      <template v-if="requestType === 'new_recordation'">
        <SmartFormGrid :max-cols="2">
          <el-form-item label="Places of Manufacture of Goods" class="col-span-full" full-width>
            <el-input
              v-model="form.goodsManufacturePlaces"
              type="textarea"
              :rows="3"
              placeholder="List the countries or locations where the goods are manufactured"
            />
          </el-form-item>
          <el-form-item label="Licensed Users" class="col-span-full" full-width>
            <el-input
              v-model="form.licensedUsers"
              type="textarea"
              :rows="3"
              placeholder="Describe any parties licensed to use the trademark"
            />
          </el-form-item>
        </SmartFormGrid>
      </template>

      <!-- alteration -->
      <template v-else-if="requestType === 'alteration'">
        <SmartFormGrid :max-cols="2">
          <el-form-item label="Current Recordation Number" required>
            <el-input
              v-model="form.currentRecordationNumber"
              placeholder="FCC recordation reference"
              clearable
            />
          </el-form-item>
          <el-form-item label="Alteration Details" class="col-span-full" full-width>
            <el-input
              v-model="form.alterationDetails"
              type="textarea"
              :rows="4"
              placeholder="Describe the changes to be made to the recordation"
            />
          </el-form-item>
        </SmartFormGrid>
      </template>

      <!-- ownership_change -->
      <template v-else-if="requestType === 'ownership_change'">
        <SmartFormGrid :max-cols="2">
          <el-form-item label="Previous Owner Name" required>
            <el-input v-model="form.previousOwnerName" placeholder="Current registered owner" clearable />
          </el-form-item>
          <el-form-item label="New Owner Name" required>
            <el-input v-model="form.newOwnerName" placeholder="New trademark owner" clearable />
          </el-form-item>
          <el-form-item label="Transfer Reason" class="col-span-full" full-width>
            <el-input
              v-model="form.transferReason"
              type="textarea"
              :rows="3"
              placeholder="Reason for the ownership transfer (e.g. sale, merger, succession)"
            />
          </el-form-item>
          <el-form-item label="Summary of Rights Transferred" class="col-span-full" full-width>
            <el-input
              v-model="form.transferRightsSummary"
              type="textarea"
              :rows="3"
              placeholder="Describe the rights being transferred with the trademark"
            />
          </el-form-item>
        </SmartFormGrid>
      </template>

      <!-- name_change -->
      <template v-else-if="requestType === 'name_change'">
        <SmartFormGrid :max-cols="2">
          <el-form-item label="Previous Legal Name" required>
            <el-input v-model="form.previousLegalName" placeholder="Current registered legal name" clearable />
          </el-form-item>
          <el-form-item label="New Legal Name" required>
            <el-input v-model="form.newLegalName" placeholder="Updated legal name" clearable />
          </el-form-item>
          <el-form-item label="Reason for Name Change" class="col-span-full" full-width>
            <el-input
              v-model="form.nameChangeReason"
              type="textarea"
              :rows="3"
              placeholder="Explain the reason for the legal name change"
            />
          </el-form-item>
        </SmartFormGrid>
      </template>

      <!-- renewal -->
      <template v-else-if="requestType === 'renewal'">
        <SmartFormGrid :max-cols="2">
          <el-form-item label="Current Recordation Number" required>
            <el-input
              v-model="form.currentRecordationNumber"
              placeholder="FCC recordation reference to renew"
              clearable
            />
          </el-form-item>
          <el-form-item label="Renewal Term (Years)">
            <el-input-number
              v-model="form.renewalTermYears"
              :min="1"
              :max="10"
              controls-position="right"
              style="width: 100%"
            />
          </el-form-item>
        </SmartFormGrid>
      </template>

      <!-- agent_appointment -->
      <template v-else-if="requestType === 'agent_appointment'">
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

      <!-- discontinuation -->
      <template v-else-if="requestType === 'discontinuation'">
        <SmartFormGrid :max-cols="2">
          <el-form-item label="Current Recordation Number" required>
            <el-input
              v-model="form.currentRecordationNumber"
              placeholder="FCC recordation reference to discontinue"
              clearable
            />
          </el-form-item>
          <el-form-item label="Reason for Discontinuation" class="col-span-full" full-width>
            <el-input
              v-model="form.notes"
              type="textarea"
              :rows="4"
              placeholder="Explain the reason for discontinuing this recordation"
            />
          </el-form-item>
        </SmartFormGrid>
      </template>
    </el-form>
  </div>
</template>
