<script setup>
import SmartFormGrid from '@/components/forms/SmartFormGrid.vue'

const props = defineProps({
  formData: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false },
  declarationText: {
    type: String,
    default: 'I hereby declare that the information provided in this application is true, complete, and accurate to the best of my knowledge. I understand that providing false or misleading information may result in the rejection of this application or other penalties as prescribed by law.'
  }
})

const emit = defineEmits(['update:formData'])

function update(key, value) {
  emit('update:formData', { ...props.formData, [key]: value })
}
</script>

<template>
  <div class="space-y-4">
    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
      <p class="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
        {{ declarationText }}
      </p>
    </div>

    <el-form-item required>
      <el-checkbox
        :model-value="formData.declarationAccepted || false"
        @update:model-value="update('declarationAccepted', $event)"
        :disabled="disabled"
        class="wizard-declaration-checkbox"
      >
        I accept this declaration
      </el-checkbox>
    </el-form-item>

    <SmartFormGrid :max-cols="2">
      <el-form-item label="Full Name">
        <el-input
          :model-value="formData.declarationName || ''"
          @update:model-value="update('declarationName', $event)"
          :disabled="disabled"
          placeholder="Your full legal name"
        />
      </el-form-item>
      <el-form-item label="Title / Position">
        <el-input
          :model-value="formData.declarationTitle || ''"
          @update:model-value="update('declarationTitle', $event)"
          :disabled="disabled"
          placeholder="e.g. Director, Manager"
        />
      </el-form-item>
    </SmartFormGrid>
  </div>
</template>
