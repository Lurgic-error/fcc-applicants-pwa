<script setup>
import { inject } from 'vue'
import SmartFormGrid from '@/components/forms/SmartFormGrid.vue'

const form = inject('wizardForm')
</script>

<template>
  <div class="space-y-4">
    <div>
      <h2 class="text-lg font-semibold text-slate-800">Brand Owner</h2>
      <p class="mt-1 text-sm text-slate-500">
        Provide details about the registered owner of the trademark.
      </p>
    </div>

    <SmartFormGrid :max-cols="2">
      <el-form-item label="Owner Category" required>
        <el-select v-model="form.owner.ownerCategory" style="width: 100%">
          <el-option label="Corporate Owner" value="Corporate Owner" />
          <el-option label="Individual Owner" value="Individual Owner" />
        </el-select>
      </el-form-item>

      <el-form-item label="Full Legal Name" required>
        <el-input
          v-model="form.owner.fullName"
          placeholder="Full name of the trademark owner"
          clearable
        />
      </el-form-item>

      <el-form-item label="Business Address">
        <el-input
          v-model="form.owner.businessAddress"
          placeholder="Registered business or residential address"
          clearable
        />
      </el-form-item>

      <el-form-item label="Nationality / Jurisdiction">
        <el-input
          v-model="form.owner.nationalityOrJurisdiction"
          placeholder="Country of registration or citizenship"
          clearable
        />
      </el-form-item>
    </SmartFormGrid>
  </div>
</template>
