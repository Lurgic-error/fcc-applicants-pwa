<script setup>
import { computed } from 'vue'
import { getFieldHelp } from '@/constants/fieldHelpText'

const props = defineProps({
  field: { type: Object, required: true },
  modelValue: { type: [String, Number, Boolean, Object, Array, null], default: null },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const value = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const helpText = computed(() => props.field.helpText || getFieldHelp(props.field.key) || null)
const isRequired = computed(() => props.field.required)
const spanClass = computed(() => {
  if (props.field.span === 'half') return ''
  if (props.field.span === 'third') return ''
  return 'md:col-span-2'
})
</script>

<template>
  <el-form-item :class="spanClass" :required="isRequired">
    <template #label>
      {{ field.label }}
      <el-tooltip v-if="helpText" :content="helpText" placement="top" :show-after="300">
        <i class="fa-solid fa-circle-question ml-1 text-xs text-slate-400 cursor-help" />
      </el-tooltip>
    </template>

    <!-- Text -->
    <el-input
      v-if="field.type === 'text' || field.type === 'email' || field.type === 'phone'"
      v-model="value"
      :placeholder="field.placeholder || `Enter ${field.label.toLowerCase()}`"
      :disabled="disabled"
      :type="field.type === 'email' ? 'email' : 'text'"
    />

    <!-- Textarea -->
    <el-input
      v-else-if="field.type === 'textarea'"
      v-model="value"
      type="textarea"
      :rows="4"
      :placeholder="field.placeholder || `Enter ${field.label.toLowerCase()}`"
      :disabled="disabled"
    />

    <!-- Number -->
    <el-input-number
      v-else-if="field.type === 'number'"
      v-model="value"
      :placeholder="field.placeholder"
      :disabled="disabled"
      :controls="false"
      class="w-full"
    />

    <!-- Currency -->
    <el-input-number
      v-else-if="field.type === 'currency'"
      v-model="value"
      :placeholder="field.placeholder || '0'"
      :disabled="disabled"
      :controls="false"
      :precision="2"
      class="w-full"
    >
      <template #prefix>TZS</template>
    </el-input-number>

    <!-- Select -->
    <el-select
      v-else-if="field.type === 'select'"
      v-model="value"
      :placeholder="field.placeholder || `Select ${field.label.toLowerCase()}`"
      :disabled="disabled"
      class="w-full"
    >
      <el-option
        v-for="opt in (field.options || [])"
        :key="typeof opt === 'object' ? opt.value : opt"
        :label="typeof opt === 'object' ? opt.label : String(opt).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())"
        :value="typeof opt === 'object' ? opt.value : opt"
      />
    </el-select>

    <!-- Date -->
    <el-date-picker
      v-else-if="field.type === 'date'"
      v-model="value"
      type="date"
      :placeholder="field.placeholder || 'Select date'"
      :disabled="disabled"
      class="w-full"
      value-format="YYYY-MM-DD"
    />

    <!-- Boolean -->
    <el-switch
      v-else-if="field.type === 'boolean'"
      v-model="value"
      :disabled="disabled"
    />

    <!-- File -->
    <el-upload
      v-else-if="field.type === 'file'"
      :auto-upload="false"
      :disabled="disabled"
    >
      <el-button plain :disabled="disabled">
        <i class="fa-solid fa-upload mr-2" />Upload
      </el-button>
    </el-upload>

    <!-- Fallback -->
    <el-input v-else v-model="value" :disabled="disabled" />
  </el-form-item>
</template>
