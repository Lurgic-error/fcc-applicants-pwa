<script setup>
/**
 * Reusable address sub-form for FCC-8 merger wizard.
 * Renders street, city, region, postalCode, country fields in a responsive grid.
 */
const props = defineProps({
  path: { type: String, required: true }
})

const get = inject('wizardGet')
const set = inject('wizardSet')

import { inject } from 'vue'
</script>

<template>
  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
    <el-form-item label="Street">
      <el-input :model-value="get(`${path}.street`)" @update:model-value="v => set(`${path}.street`, v)" placeholder="Street address" />
    </el-form-item>
    <el-form-item label="City">
      <el-input :model-value="get(`${path}.city`)" @update:model-value="v => set(`${path}.city`, v)" placeholder="City" />
    </el-form-item>
    <el-form-item label="Region">
      <el-input :model-value="get(`${path}.region`)" @update:model-value="v => set(`${path}.region`, v)" placeholder="Region" />
    </el-form-item>
    <el-form-item label="Postal Code">
      <el-input :model-value="get(`${path}.postalCode`)" @update:model-value="v => set(`${path}.postalCode`, v)" placeholder="Postal code" />
    </el-form-item>
    <el-form-item label="Country">
      <el-input :model-value="get(`${path}.country`)" @update:model-value="v => set(`${path}.country`, v)" placeholder="Country" />
    </el-form-item>
  </div>
</template>
