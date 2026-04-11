<script setup>
import { computed } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { getFieldHelp } from '@/constants/fieldHelpText'
import { formatNumber, parseNumber } from '@/utils/numberFormat'

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
const isFullWidth = computed(() =>
  props.field.fullWidth ||
  props.field.span === 'full' ||
  props.field.type === 'textarea' ||
  props.field.type === 'file'
)
const spanClass = computed(() => (isFullWidth.value ? 'col-span-full' : ''))

function handleFileChange(_, uploadFiles) {
  value.value = uploadFiles.map((file) => file.raw || file).filter(Boolean)
}
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
    <el-input
      v-else-if="field.type === 'number'"
      :model-value="formatNumber(value)"
      @update:model-value="v => { value = parseNumber(v) }"
      :placeholder="field.placeholder || '0'"
      :disabled="disabled"
    />

    <!-- Currency -->
    <el-input
      v-else-if="field.type === 'currency'"
      :model-value="formatNumber(value)"
      @update:model-value="v => { value = parseNumber(v) }"
      :placeholder="field.placeholder || '0'"
      :disabled="disabled"
    >
      <template #prefix>TZS</template>
    </el-input>

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
      class="wizard-upload"
      :auto-upload="false"
      :disabled="disabled"
      :multiple="field.multiple !== false"
      :accept="field.accept || undefined"
      :show-file-list="false"
      drag
      @change="handleFileChange"
    >
      <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
      <div class="el-upload__text">Drop files here or <em>click to upload</em></div>
      <template #tip>
        <div class="el-upload__tip">Upload supporting documents</div>
      </template>
    </el-upload>

    <!-- Fallback -->
    <el-input v-else v-model="value" :disabled="disabled" />
  </el-form-item>
</template>
