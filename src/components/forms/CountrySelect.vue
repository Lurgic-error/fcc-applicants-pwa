<script setup>
/**
 * CountrySelect — reusable country dropdown backed by countryList.js.
 * Drop-in replacement for <el-input> on any country field.
 */
import { COUNTRIES } from '@/constants/countryList'

defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Select country' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <el-select
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    filterable
    :placeholder="placeholder"
    :disabled="disabled"
    style="width: 100%"
  >
    <el-option
      v-for="country in COUNTRIES"
      :key="country"
      :label="country"
      :value="country"
    />
  </el-select>
</template>
