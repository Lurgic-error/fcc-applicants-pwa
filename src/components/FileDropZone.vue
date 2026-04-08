<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  accept: { type: String, default: '.pdf,.doc,.docx,.jpg,.jpeg,.png' },
  maxSizeMb: { type: Number, default: 10 },
  multiple: { type: Boolean, default: false }
})

const emit = defineEmits(['files-selected'])
const isDragging = ref(false)
const fileInputRef = ref(null)

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
  return valid
}

function handleDrop(event) {
  isDragging.value = false
  const files = validateFiles(Array.from(event.dataTransfer?.files || []))
  if (files.length) emit('files-selected', props.multiple ? files : [files[0]])
}

function handleFileInput(event) {
  const files = validateFiles(Array.from(event.target?.files || []))
  if (files.length) emit('files-selected', props.multiple ? files : [files[0]])
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function openFilePicker() {
  fileInputRef.value?.click()
}
</script>

<template>
  <div
    class="relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-colors"
    :class="isDragging
      ? 'border-fcc-brand bg-fcc-brand/5 dark:bg-fcc-brand/10'
      : 'border-slate-300 hover:border-fcc-brand/50 dark:border-slate-600 dark:hover:border-fcc-brand/50'"
    @dragenter.prevent="isDragging = true"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
    @click="openFilePicker"
  >
    <input
      ref="fileInputRef"
      type="file"
      :accept="accept"
      :multiple="multiple"
      class="hidden"
      @change="handleFileInput"
    />
    <div class="flex flex-col items-center gap-2">
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <i class="fa-solid fa-cloud-arrow-up text-xl text-slate-400" />
      </div>
      <p class="text-sm font-medium text-slate-700 dark:text-slate-200">
        {{ isDragging ? 'Drop files here' : 'Drag & drop files or click to browse' }}
      </p>
      <p class="text-xs text-slate-500 dark:text-slate-400">
        Max {{ maxSizeMb }}MB per file
      </p>
    </div>
  </div>
</template>
