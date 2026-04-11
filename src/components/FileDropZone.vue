<script setup>
import { ref, nextTick, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'

const props = defineProps({
  accept: { type: String, default: '.pdf,.doc,.docx,.jpg,.jpeg,.png' },
  maxSizeMb: { type: Number, default: 10 },
  multiple: { type: Boolean, default: false }
})

const emit = defineEmits(['files-selected'])
const uploadRef = ref(null)
let emitTimer = null

function validateFiles(files) {
  const maxBytes = props.maxSizeMb * 1024 * 1024
  const valid = []
  for (const file of files) {
    if (file.size > maxBytes) {
      ElMessage.warning(`"${file.name}" exceeds ${props.maxSizeMb}MB limit.`)
      continue
    }
    valid.push(file)
  }
  return props.multiple ? valid : valid.slice(0, 1)
}

function clearSelection() {
  nextTick(() => uploadRef.value?.clearFiles())
}

function handleChange(_, uploadFiles) {
  const files = validateFiles(uploadFiles.map((file) => file.raw).filter(Boolean))
  if (emitTimer) clearTimeout(emitTimer)
  emitTimer = setTimeout(() => {
    if (files.length) {
      emit('files-selected', files)
    }
    clearSelection()
  }, 0)
}

function handleExceed() {
  if (!props.multiple) {
    ElMessage.warning('Only one file can be selected here.')
  }
}

onBeforeUnmount(() => {
  if (emitTimer) clearTimeout(emitTimer)
})
</script>

<template>
  <el-upload
    ref="uploadRef"
    class="file-drop-zone wizard-upload"
    drag
    :accept="accept"
    :multiple="multiple"
    :limit="multiple ? 99 : 1"
    :auto-upload="false"
    :show-file-list="false"
    :on-change="handleChange"
    :on-exceed="handleExceed"
  >
    <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
    <div class="el-upload__text">Drop files here or <em>click to upload</em></div>
    <template #tip>
      <div class="el-upload__tip">Max {{ maxSizeMb }}MB per file</div>
    </template>
  </el-upload>
</template>

<style scoped>
.file-drop-zone {
  width: 100%;
}

.file-drop-zone :deep(.el-upload),
.file-drop-zone :deep(.el-upload-dragger) {
  width: 100%;
}

.file-drop-zone :deep(.el-upload-dragger) {
  min-height: 176px;
}
</style>
