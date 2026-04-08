<script setup>
import { computed } from 'vue'
import { TRADEMARK_DOCUMENT_OPTIONS } from '@/constants/trademarkRecordation'
import FileDropZone from '@/components/FileDropZone.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  requiredDocuments: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const rows = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : []))
const requiredByKey = computed(() => {
  const next = {}
  for (const item of props.requiredDocuments || []) {
    next[item.key] = item.label
  }
  return next
})

const coveredDocumentKeys = computed(() => {
  const next = new Set()
  for (const row of rows.value) {
    if (row?.documentType) {
      next.add(row.documentType)
    }
  }
  return next
})

function updateRows(nextRows) {
  emit('update:modelValue', nextRows)
}

function addRow() {
  updateRows([
    ...rows.value,
    {
      attachmentId: `TM-ATT-${rows.value.length + 1}`,
      documentType: '',
      fileName: '',
      referenceNumber: '',
      issuedBy: '',
      issuedDate: '',
      notes: ''
    }
  ])
}

function removeRow(index) {
  const next = [...rows.value]
  next.splice(index, 1)
  updateRows(next)
}

function handleFilesDropped(files) {
  const currentRows = rows.value || []
  const newRows = files.map((file, i) => ({
    attachmentId: `TM-ATT-${currentRows.length + i + 1}`,
    documentType: '',
    fileName: file.name,
    fileSize: file.size,
    referenceNumber: '',
    issuedBy: '',
    issuedDate: '',
    notes: ''
  }))
  updateRows([...currentRows, ...newRows])
}

function updateRow(index, field, value) {
  const next = [...rows.value]
  next[index] = {
    ...next[index],
    [field]: value
  }
  updateRows(next)
}
</script>

<template>
  <div class="space-y-4">
    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-600">Required Documents</h3>
      <div class="mt-3 flex flex-wrap gap-2">
        <el-tag
          v-for="item in requiredDocuments"
          :key="item.key"
          :type="coveredDocumentKeys.has(item.key) ? 'success' : 'warning'"
          effect="light"
        >
          {{ item.label }}
        </el-tag>
      </div>
    </div>

    <FileDropZone
      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
      :multiple="true"
      class="mb-4"
      @files-selected="handleFilesDropped"
    />

    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-600">Attached Documents</h3>
      <el-button size="small" type="primary" plain @click="addRow">Add Document Row</el-button>
    </div>

    <div
      v-for="(row, index) in rows"
      :key="row.attachmentId || index"
      class="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2"
    >
      <el-form-item class="mb-0" :label="`Document Type #${index + 1}`">
        <el-select
          :model-value="row.documentType"
          filterable
          placeholder="Select document type"
          @update:model-value="updateRow(index, 'documentType', $event)"
        >
          <el-option
            v-for="option in TRADEMARK_DOCUMENT_OPTIONS"
            :key="option.key"
            :label="option.label"
            :value="option.key"
          />
        </el-select>
      </el-form-item>

      <el-form-item class="mb-0" label="File Name / Reference">
        <el-input
          :model-value="row.fileName"
          placeholder="e.g. registration-certificate.pdf"
          @update:model-value="updateRow(index, 'fileName', $event)"
        />
      </el-form-item>

      <el-form-item class="mb-0" label="Document Reference No.">
        <el-input
          :model-value="row.referenceNumber"
          placeholder="Optional reference"
          @update:model-value="updateRow(index, 'referenceNumber', $event)"
        />
      </el-form-item>

      <el-form-item class="mb-0" label="Issued By">
        <el-input
          :model-value="row.issuedBy"
          placeholder="Authority / issuer"
          @update:model-value="updateRow(index, 'issuedBy', $event)"
        />
      </el-form-item>

      <el-form-item class="mb-0" label="Issued Date">
        <el-date-picker
          :model-value="row.issuedDate"
          type="date"
          value-format="YYYY-MM-DD"
          @update:model-value="updateRow(index, 'issuedDate', $event)"
        />
      </el-form-item>

      <el-form-item class="mb-0" label="Notes">
        <el-input
          :model-value="row.notes"
          type="textarea"
          :rows="2"
          @update:model-value="updateRow(index, 'notes', $event)"
        />
      </el-form-item>

      <div class="md:col-span-2">
        <el-button size="small" type="danger" plain @click="removeRow(index)">Remove Row</el-button>
      </div>
    </div>

    <p
      v-if="requiredDocuments.length && !requiredDocuments.every((item) => coveredDocumentKeys.has(item.key))"
      class="text-xs text-amber-700"
    >
      Missing items can be uploaded later if unavailable at draft stage.
    </p>
  </div>
</template>
