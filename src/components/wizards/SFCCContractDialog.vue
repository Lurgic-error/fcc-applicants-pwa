<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  contract: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'save'])

function blankForm() {
  return {
    purpose: '',
    title: '',
    description: '',
    partiesInvolved: '',
    effectiveDate: ''
  }
}

const form = reactive(blankForm())

watch(
  () => props.visible,
  (open) => {
    if (open) {
      if (props.contract) {
        Object.assign(form, {
          purpose: props.contract.purpose || '',
          title: props.contract.title || '',
          description: props.contract.description || '',
          partiesInvolved: props.contract.partiesInvolved || '',
          effectiveDate: props.contract.effectiveDate || ''
        })
      } else {
        Object.assign(form, blankForm())
      }
    }
  },
  { immediate: true }
)

function close() {
  emit('update:visible', false)
}

function save() {
  const contractData = {
    contractId: props.contract?.contractId || `SFCC-C-${Date.now()}`,
    purpose: form.purpose,
    title: form.title,
    description: form.description,
    partiesInvolved: form.partiesInvolved,
    effectiveDate: form.effectiveDate
  }
  emit('save', contractData)
  close()
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="contract ? 'Edit Contract' : 'Add Contract'"
    width="600px"
    @update:model-value="emit('update:visible', $event)"
    @close="close"
  >
    <el-form :model="form" label-position="top">
      <el-form-item label="Purpose" prop="purpose">
        <el-select v-model="form.purpose" placeholder="Select purpose">
          <el-option label="First Registration" value="First Registration" />
          <el-option label="Renewal" value="Renewal" />
          <el-option label="Amendment" value="Amendment" />
          <el-option label="Variation" value="Variation" />
        </el-select>
      </el-form-item>

      <el-form-item label="Contract Title" prop="title" required>
        <el-input v-model="form.title" placeholder="e.g. Standard Consumer Purchase Agreement" />
      </el-form-item>

      <el-form-item label="Contract Description" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="Brief description of the contract's scope and purpose"
        />
      </el-form-item>

      <el-form-item label="Parties Involved" prop="partiesInvolved">
        <el-input
          v-model="form.partiesInvolved"
          placeholder="e.g. Company Ltd and Consumer"
        />
      </el-form-item>

      <el-form-item label="Effective Date" prop="effectiveDate">
        <el-date-picker
          v-model="form.effectiveDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="Select effective date"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="close">Cancel</el-button>
      <el-button type="primary" :disabled="!form.title" @click="save">Save Contract</el-button>
    </template>
  </el-dialog>
</template>
