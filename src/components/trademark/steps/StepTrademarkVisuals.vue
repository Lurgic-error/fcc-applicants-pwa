<script setup>
import { inject } from 'vue'
import TableFormManager from '@/components/forms/TableFormManager.vue'

const form = inject('wizardForm')

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
      <h2 class="text-lg font-semibold text-slate-800">Trademark Visuals</h2>
      <p class="mt-1 text-sm text-slate-500">
        Describe the visual representations of the trademark (word marks, device marks, combined marks).
      </p>
    </div>

    <div class="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
      Upload visual image files in the Documents step.
    </div>

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
