<script setup>
import { inject } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import TableFormManager from '@/components/forms/TableFormManager.vue'

const form = inject('wizardForm')

if (!form.visualFiles) {
  form.visualFiles = []
}

const fields = [
  {
    key: 'visualType',
    label: 'Visual Type',
    type: 'select',
    required: true,
    options: ['Word Mark', 'Device Mark', 'Combined Mark']
  },
  { key: 'description', label: 'Description', required: true },
  { key: 'colorClaim', label: 'Color Claim', placeholder: 'e.g. Red and white' },
  { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
]

const columns = [
  { key: 'visualType', label: 'Visual Type', width: 130 },
  { key: 'description', label: 'Description', minWidth: 180 },
  { key: 'colorClaim', label: 'Color Claim', width: 140 }
]
</script>

<template>
  <div class="space-y-4">
    <div>
        Describe the visual representations of the trademark (word marks, device marks, combined marks).
    </div>

    <el-form-item label="Upload Trademark Visual Images">
      <el-upload
        v-model:file-list="form.visualFiles"
        class="wizard-upload"
        accept=".jpg,.jpeg,.png,.svg,.pdf,.tiff,.tif"
        :auto-upload="false"
        multiple
        drag
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">Drop visual images here or <em>click to upload</em></div>
        <template #tip>
          <div class="el-upload__tip">JPG, PNG, SVG, PDF, TIFF files accepted</div>
        </template>
      </el-upload>
    </el-form-item>

    <TableFormManager
      v-model="form.visuals"
      :fields="fields"
      :columns="columns"
      add-label="Add Visual"
      edit-label="Update Visual"
      empty-text="No visuals added yet."
    />
  </div>
</template>
