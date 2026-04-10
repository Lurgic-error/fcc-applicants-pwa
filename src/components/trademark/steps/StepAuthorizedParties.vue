<script setup>
import { inject } from 'vue'
import TableFormManager from '@/components/forms/TableFormManager.vue'

const form = inject('wizardForm')

const fields = [
  { key: 'fullName', label: 'Full Name', required: true },
  { key: 'role', label: 'Role', required: true, placeholder: 'e.g. Distributor, Importer' },
  { key: 'address', label: 'Address' },
  { key: 'country', label: 'Country' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
]

const columns = [
  { key: 'fullName', label: 'Full Name', minWidth: 150 },
  { key: 'role', label: 'Role', width: 120 },
  { key: 'country', label: 'Country', width: 100 },
  { key: 'email', label: 'Email', width: 160 }
]
</script>

<template>
  <div class="space-y-4">
    <div>
      <h3 class="wizard-step__title">Authorized Parties</h3>
      <p class="wizard-step__description">
        List parties authorized to use or deal in goods bearing this trademark (distributors,
        importers, licensees, etc.). This section is optional.
      </p>
    </div>

    <TableFormManager
      v-model="form.authorizedParties"
      :fields="fields"
      :columns="columns"
      add-label="Add Authorized Party"
      edit-label="Update Party"
      empty-text="No authorized parties added yet."
    />
  </div>
</template>
