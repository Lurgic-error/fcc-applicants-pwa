<script setup>
/**
 * TableFormManager — Reusable table + form for multi-item arrays.
 *
 * Renders a SmartFormGrid form at the top for adding/editing items,
 * and an el-table below listing all current items with delete actions.
 */
import { ref, computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import SmartFormGrid from '@/components/forms/SmartFormGrid.vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  fields: { type: Array, required: true },
  columns: { type: Array, required: true },
  addLabel: { type: String, default: 'Add Item' },
  editLabel: { type: String, default: 'Update Item' },
  emptyText: { type: String, default: 'No items added yet.' },
  maxCols: { type: Number, default: 3 }
})

const emit = defineEmits(['update:modelValue'])

// ── Form state ──────────────────────────────────────────────────────────────

function buildEmptyForm() {
  const obj = {}
  for (const f of props.fields) {
    obj[f.key] = f.default !== undefined ? f.default : ''
  }
  return obj
}

const form = ref(buildEmptyForm())
const editingIndex = ref(null) // null = add mode, number = edit mode
const formErrors = ref({})

const isEditing = computed(() => editingIndex.value !== null)
const submitLabel = computed(() => (isEditing.value ? props.editLabel : props.addLabel))

// ── Validation ──────────────────────────────────────────────────────────────

function validate() {
  const errors = {}
  for (const f of props.fields) {
    if (f.required) {
      const val = form.value[f.key]
      if (val === null || val === undefined || val === '') {
        errors[f.key] = `${f.label} is required`
      }
    }
  }
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

// ── Add / Edit ──────────────────────────────────────────────────────────────

function handleSubmit() {
  if (!validate()) return
  const updated = [...props.modelValue]
  const entry = { ...form.value }
  if (isEditing.value) {
    updated[editingIndex.value] = entry
  } else {
    updated.push(entry)
  }
  emit('update:modelValue', updated)
  resetForm()
}

function handleRowClick(row, column) {
  // Ignore clicks on the actions column
  if (column?.label === 'Actions') return
  const idx = props.modelValue.indexOf(row)
  if (idx === -1) return
  editingIndex.value = idx
  form.value = { ...row }
  formErrors.value = {}
}

function cancelEdit() {
  resetForm()
}

function resetForm() {
  form.value = buildEmptyForm()
  editingIndex.value = null
  formErrors.value = {}
}

// ── Delete ──────────────────────────────────────────────────────────────────

async function handleDelete(index) {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to remove this item?',
      'Remove Item',
      { type: 'warning', confirmButtonText: 'Remove', cancelButtonText: 'Cancel' }
    )
    const updated = props.modelValue.filter((_, i) => i !== index)
    emit('update:modelValue', updated)
    // If we were editing this row, reset
    if (editingIndex.value === index) resetForm()
  } catch {
    // User cancelled
  }
}

// ── Field render helpers ────────────────────────────────────────────────────

function isFullWidth(field) {
  return field.fullWidth || field.type === 'textarea'
}
</script>

<template>
  <div class="tfm">
    <!-- ── Form card ─────────────────────────────────────────────────────── -->
    <div class="tfm__form-card">
      <SmartFormGrid :max-cols="maxCols">
        <template v-for="field in fields" :key="field.key">
          <el-form-item
            :label="field.label"
            :class="{ 'col-span-full': isFullWidth(field) }"
            :required="field.required"
          >
            <template #error>
              <span v-if="formErrors[field.key]" class="tfm__field-error">
                {{ formErrors[field.key] }}
              </span>
            </template>

            <!-- text (default) -->
            <el-input
              v-if="!field.type || field.type === 'text'"
              v-model="form[field.key]"
              :placeholder="field.placeholder || field.label"
              :class="{ 'is-error': formErrors[field.key] }"
              clearable
            />

            <!-- textarea -->
            <el-input
              v-else-if="field.type === 'textarea'"
              v-model="form[field.key]"
              type="textarea"
              :rows="3"
              :placeholder="field.placeholder || field.label"
              :class="{ 'is-error': formErrors[field.key] }"
            />

            <!-- select -->
            <el-select
              v-else-if="field.type === 'select'"
              v-model="form[field.key]"
              :placeholder="field.placeholder || `Select ${field.label}`"
              :class="{ 'is-error': formErrors[field.key] }"
              style="width: 100%"
              clearable
            >
              <el-option
                v-for="opt in field.options"
                :key="opt.value ?? opt"
                :label="opt.label ?? opt"
                :value="opt.value ?? opt"
              />
            </el-select>

            <!-- number -->
            <el-input-number
              v-else-if="field.type === 'number'"
              v-model="form[field.key]"
              :placeholder="field.placeholder || field.label"
              :class="{ 'is-error': formErrors[field.key] }"
              style="width: 100%"
              controls-position="right"
            />

            <!-- date -->
            <el-date-picker
              v-else-if="field.type === 'date'"
              v-model="form[field.key]"
              type="date"
              :placeholder="field.placeholder || `Select ${field.label}`"
              :class="{ 'is-error': formErrors[field.key] }"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </template>
      </SmartFormGrid>

      <!-- Form actions -->
      <div class="tfm__form-actions">
        <el-button type="primary" @click="handleSubmit">{{ submitLabel }}</el-button>
        <a v-if="isEditing" class="tfm__cancel-link" @click.prevent="cancelEdit">Cancel</a>
      </div>
    </div>

    <!-- ── Table ──────────────────────────────────────────────────────────── -->
    <el-table
      :data="modelValue"
      class="tfm__table"
      :empty-text="emptyText"
      row-class-name="tfm__row"
      @row-click="handleRowClick"
    >
      <el-table-column
        v-for="col in columns"
        :key="col.key"
        :prop="col.key"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth"
      >
        <template v-if="col.formatter" #default="{ row }">
          {{ col.formatter(row[col.key], row) }}
        </template>
      </el-table-column>

      <el-table-column label="Actions" width="80" align="center">
        <template #default="{ $index }">
          <el-button
            type="danger"
            link
            size="small"
            @click.stop="handleDelete($index)"
          >
            Remove
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
/* ── Form card ───────────────────────────────────────────────────────────── */
.tfm__form-card {
  background: var(--fcc-bg-surface-muted, #f8fafc);
  border: 1px solid var(--fcc-border-light, #e5eaf3);
  border-radius: var(--fcc-radius-lg, 8px);
  padding: 1rem 1rem 0.75rem;
  margin-bottom: 1rem;
}

/* ── Form actions row ────────────────────────────────────────────────────── */
.tfm__form-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.tfm__cancel-link {
  font-size: 0.8125rem;
  color: var(--fcc-text-muted, #64748b);
  cursor: pointer;
  text-decoration: underline;
  user-select: none;
}

.tfm__cancel-link:hover {
  color: var(--fcc-text-secondary, #475569);
}

/* ── Field error ─────────────────────────────────────────────────────────── */
.tfm__field-error {
  font-size: 0.6875rem;
  color: var(--el-color-danger, #f56c6c);
}

/* ── Table ───────────────────────────────────────────────────────────────── */
.tfm__table {
  border-radius: var(--fcc-radius-md, 6px);
  overflow: hidden;
  border: 1px solid var(--fcc-border-light, #e5eaf3);
}

:deep(.tfm__row) {
  cursor: pointer;
}
</style>
