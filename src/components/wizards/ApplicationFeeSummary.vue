<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  currency: {
    type: String,
    default: 'TZS'
  },
  vatPercent: {
    type: Number,
    default: 0
  }
})

const subtotal = computed(() =>
  props.items.reduce((sum, item) => sum + Number(item.amount || 0), 0)
)

const vatAmount = computed(() =>
  subtotal.value * (props.vatPercent / 100)
)

const total = computed(() =>
  subtotal.value + vatAmount.value
)

function fmt(value) {
  return Number(value || 0).toLocaleString()
}
</script>

<template>
  <div class="fee-summary">
    <div class="fee-summary__header">
      <span class="fee-summary__title">Fee Breakdown</span>
    </div>

    <table class="fee-summary__table">
      <thead>
        <tr>
          <th class="fee-summary__th fee-summary__th--item">Item</th>
          <th class="fee-summary__th fee-summary__th--amount">Amount ({{ currency }})</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in items" :key="index" class="fee-summary__row">
          <td class="fee-summary__td">
            <div class="fee-summary__label">{{ item.label }}</div>
            <div v-if="item.description" class="fee-summary__description">{{ item.description }}</div>
          </td>
          <td class="fee-summary__td fee-summary__td--amount">
            {{ fmt(item.amount) }}
          </td>
        </tr>
        <tr v-if="!items.length">
          <td colspan="2" class="fee-summary__empty">No fee items added yet.</td>
        </tr>
      </tbody>
    </table>

    <div class="fee-summary__divider" />

    <div class="fee-summary__totals">
      <div class="fee-summary__total-row">
        <span>Subtotal</span>
        <span>{{ fmt(subtotal) }}</span>
      </div>
      <div v-if="vatPercent > 0" class="fee-summary__total-row">
        <span>VAT ({{ vatPercent }}%)</span>
        <span>{{ fmt(vatAmount) }}</span>
      </div>
      <div class="fee-summary__total-row fee-summary__total-row--grand">
        <span>Total</span>
        <span>{{ fmt(total) }}</span>
      </div>
    </div>

    <div class="fee-summary__currency-label">{{ currency }}</div>
  </div>
</template>

<style scoped>
.fee-summary {
  border: 1px solid var(--fcc-border);
  border-radius: var(--fcc-radius-lg, 8px);
  padding: 16px;
  background: var(--fcc-bg-surface);
}

.fee-summary__header {
  margin-bottom: 12px;
}

.fee-summary__title {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--fcc-text-muted);
}

.fee-summary__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.fee-summary__th {
  text-align: left;
  padding: 6px 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--fcc-text-muted);
  border-bottom: 1px solid var(--fcc-border-light);
}

.fee-summary__th--amount,
.fee-summary__td--amount {
  text-align: right;
  white-space: nowrap;
}

.fee-summary__td {
  padding: 8px 8px;
  vertical-align: top;
}

.fee-summary__label {
  font-weight: 500;
  color: var(--fcc-text-primary);
}

.fee-summary__description {
  font-size: 12px;
  color: var(--fcc-text-muted);
  margin-top: 2px;
}

.fee-summary__empty {
  padding: 16px 8px;
  color: var(--fcc-text-muted);
  font-style: italic;
  text-align: center;
}

.fee-summary__divider {
  border-top: 1px solid var(--fcc-border);
  margin: 8px 0;
}

.fee-summary__totals {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
}

.fee-summary__total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 8px;
  color: var(--fcc-text-primary);
}

.fee-summary__total-row--grand {
  font-weight: 700;
  font-size: 15px;
  padding-top: 4px;
  border-top: 1px solid var(--fcc-border-light);
  margin-top: 4px;
}

.fee-summary__currency-label {
  text-align: right;
  font-size: 11px;
  color: var(--fcc-text-muted);
  margin-top: 8px;
}
</style>
