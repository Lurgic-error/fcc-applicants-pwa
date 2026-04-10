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
      <h3 class="wizard-step__title">Affiliated Companies</h3>
      <p class="wizard-step__description">
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
