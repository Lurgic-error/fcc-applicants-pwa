<script setup>
import { inject } from 'vue'
import SmartFormGrid from '@/components/forms/SmartFormGrid.vue'

const form = inject('wizardForm')
</script>

<template>
  <div class="space-y-4">
    <div>
      <h2 class="text-lg font-semibold text-slate-800">Trademark Details</h2>
      <p class="mt-1 text-sm text-slate-500">
        Provide registration and classification information for the trademark.
      </p>
    </div>

    <el-form label-position="top">
      <SmartFormGrid :max-cols="3">
        <el-form-item label="Trademark Name" required>
          <el-input
            v-model="form.trademark.trademarkName"
            placeholder="Name as registered"
            clearable
          />
        </el-form-item>

        <el-form-item label="Class of Goods / Services">
          <el-input
            v-model="form.trademark.classOfGoods"
            placeholder="e.g. Class 25 — Clothing"
            clearable
          />
        </el-form-item>

        <el-form-item label="Representation Type">
          <el-select v-model="form.trademark.representationType" style="width: 100%">
            <el-option label="Word Mark" value="Word Mark" />
            <el-option label="Device Mark" value="Device Mark" />
            <el-option label="Combined Mark" value="Combined Mark" />
          </el-select>
        </el-form-item>

        <el-form-item label="Country of Origin">
          <el-input
            v-model="form.trademark.countryOfOrigin"
            placeholder="Country where trademark is registered"
            clearable
          />
        </el-form-item>

        <el-form-item label="Registration Reference">
          <el-input
            v-model="form.trademark.registrationReference"
            placeholder="Trademark office reference"
            clearable
          />
        </el-form-item>

        <el-form-item label="Registration Certificate Number">
          <el-input
            v-model="form.trademark.registrationCertificateNumber"
            placeholder="Certificate number"
            clearable
          />
        </el-form-item>

        <el-form-item label="Notes" class="col-span-full" full-width>
          <el-input
            v-model="form.trademark.notes"
            type="textarea"
            :rows="3"
            placeholder="Additional notes about the trademark registration"
          />
        </el-form-item>
      </SmartFormGrid>
    </el-form>
  </div>
</template>
