<script setup>
/**
 * Generic array CRUD panel for FCC-8 merger wizard.
 * Renders a list of items with add/remove and delegates item rendering to a slot.
 */
import { computed, inject } from 'vue'

const props = defineProps({
  path: { type: String, required: true },
  title: { type: String, default: 'Item' },
  factory: { type: Function, required: true },
  minItems: { type: Number, default: 0 }
})

const get = inject('wizardGet')
const set = inject('wizardSet')

const items = computed(() => get(props.path) || [])

function add() {
  set(props.path, [...items.value, props.factory()])
}

function remove(index) {
  if (items.value.length <= props.minItems) return
  set(props.path, items.value.filter((_, i) => i !== index))
}
</script>

<template>
  <div class="merger-array">
    <div v-for="(item, index) in items" :key="index" class="merger-array__card">
      <div class="merger-array__card-head">
        <span class="merger-array__card-title">{{ title }} #{{ index + 1 }}</span>
        <el-button v-if="items.length > minItems" type="danger" text size="small" @click="remove(index)">Remove</el-button>
      </div>
      <div class="merger-array__card-body">
        <slot :item="item" :index="index" :path="`${path}.${index}`" />
      </div>
    </div>

    <button type="button" class="merger-array__add" @click="add">
      + Add {{ title }}
    </button>
  </div>
</template>

<style scoped>
.merger-array__card {
  border: 1px solid var(--fcc-border, #dbe3ef);
  border-radius: var(--fcc-radius-card, 10px);
  background: var(--fcc-bg-surface, #fff);
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.merger-array__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.875rem;
  background: var(--fcc-bg-surface-muted, #f8fafc);
  border-bottom: 1px solid var(--fcc-border, #dbe3ef);
}

.merger-array__card-title {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--fcc-text-secondary, #475569);
}

.merger-array__card-body {
  padding: 1rem;
}

.merger-array__add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  width: 100%;
  padding: 0.625rem;
  border: 1.5px dashed var(--fcc-secondary-500, #0ea5e9);
  border-radius: var(--fcc-radius-base, 8px);
  background: color-mix(in srgb, var(--fcc-secondary-500, #0ea5e9) 4%, var(--fcc-bg-surface, #fff));
  color: var(--fcc-secondary-500, #0ea5e9);
  font-family: var(--fcc-font-body, inherit);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.merger-array__add:hover {
  background: color-mix(in srgb, var(--fcc-secondary-500, #0ea5e9) 8%, var(--fcc-bg-surface, #fff));
}
</style>
