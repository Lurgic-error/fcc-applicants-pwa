<script setup>
import { inject } from 'vue'
import TableFormManager from '@/components/forms/TableFormManager.vue'

const form = inject('wizardForm')

const fields = [
  { key: 'name', label: 'Manufacturer Name', required: true },
  { key: 'address', label: 'Address' },
  { key: 'country', label: 'Country' },
  { key: 'contactName', label: 'Contact Person Name' },
  { key: 'contactPhone', label: 'Contact Phone' },
  { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
]

const columns = [
  { key: 'name', label: 'Name', minWidth: 150 },
  { key: 'country', label: 'Country', width: 120 },
  { key: 'contactName', label: 'Contact Person', width: 140 }
]
</script>

<template>
  <div class="space-y-4">
    <div>
      <h2 class="text-lg font-semibold text-slate-800">Manufacturers</h2>
      <p class="mt-1 text-sm text-slate-500">
        List the manufacturers or production facilities associated with goods bearing this trademark.
        This section is optional.
      </p>
    </div>

    <TableFormManager
      v-model="form.manufacturers"
      :fields="fields"
      :columns="columns"
      add-label="Add Manufacturer"
      edit-label="Update Manufacturer"
      empty-text="No manufacturers added yet."
    />
  </div>
</template>
