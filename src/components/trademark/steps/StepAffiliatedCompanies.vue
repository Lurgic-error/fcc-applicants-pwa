<script setup>
import { inject } from 'vue'
import TableFormManager from '@/components/forms/TableFormManager.vue'

const form = inject('wizardForm')

const fields = [
  { key: 'companyName', label: 'Company Name', required: true },
  { key: 'relationship', label: 'Relationship', required: true, placeholder: 'e.g. Subsidiary, Licensee' },
  { key: 'country', label: 'Country' },
  { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
]

const columns = [
  { key: 'companyName', label: 'Company Name', minWidth: 150 },
  { key: 'relationship', label: 'Relationship', width: 140 },
  { key: 'country', label: 'Country', width: 120 }
]
</script>

<template>
  <div class="space-y-4">
    <div>
      <h2 class="text-lg font-semibold text-slate-800">Affiliated Companies</h2>
      <p class="mt-1 text-sm text-slate-500">
        List any companies affiliated with the trademark owner (subsidiaries, licensees, etc.).
        This section is optional.
      </p>
    </div>

    <TableFormManager
      v-model="form.affiliatedCompanies"
      :fields="fields"
      :columns="columns"
      add-label="Add Affiliated Company"
      edit-label="Update Company"
      empty-text="No affiliated companies added yet."
    />
  </div>
</template>
