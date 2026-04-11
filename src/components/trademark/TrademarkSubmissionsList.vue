<script setup>
import { computed } from 'vue'

const props = defineProps({
  trademarks: {
    type: Array,
    default: () => []
  },
  requestTypes: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['edit', 'remove', 'add'])

function getFeeForTrademark(trademark) {
  if (!trademark) return 0
  const rt = props.requestTypes.find((r) => r.key === trademark.requestType)
  if (rt) return Number(rt.feeTzs || 0)
  // Fall back to first requestType fee if no per-trademark requestType set
  return 0
}

// Completeness: checks which sub-objects have meaningful data
function computeCompleteness(trademark) {
  if (!trademark) return 0
  const checks = [
    Boolean(String(trademark.trademarkName || '').trim()),
    Boolean(String(trademark.classOfGoods || '').trim()),
    Boolean(String(trademark.owner?.fullName || '').trim()),
    Boolean(Array.isArray(trademark.manufacturers) && trademark.manufacturers.length),
    Boolean(Array.isArray(trademark.authorizedParties) && trademark.authorizedParties.length),
    Boolean(Array.isArray(trademark.affiliatedCompanies) && trademark.affiliatedCompanies.length),
    Boolean(Array.isArray(trademark.visuals) && trademark.visuals.length),
    Boolean(Array.isArray(trademark.attachments) && trademark.attachments.length)
  ]
  const filled = checks.filter(Boolean).length
  return Math.round((filled / checks.length) * 100)
}

function completenessBarWidth(trademark) {
  return `${computeCompleteness(trademark)}%`
}

function completenessColor(trademark) {
  const pct = computeCompleteness(trademark)
  if (pct >= 80) return '#67c23a'
  if (pct >= 50) return '#e6a23c'
  return '#f56c6c'
}

const totalFee = computed(() =>
  props.trademarks.reduce((sum, tm) => sum + getFeeForTrademark(tm), 0)
)
</script>

<template>
  <div class="tm-list">
    <div v-if="!trademarks.length" class="tm-list__empty">
      <p>No trademarks added yet. Click "+ Add Trademark" to begin.</p>
    </div>

    <div
      v-for="(trademark, index) in trademarks"
      :key="trademark.submissionId || index"
      class="tm-list__card"
    >
      <div class="tm-list__card-left">
        <div class="tm-list__index-badge">{{ index + 1 }}</div>
      </div>

      <div class="tm-list__card-body">
        <div class="tm-list__card-row tm-list__card-row--title">
          <span class="tm-list__name">{{ trademark.trademarkName || 'Untitled Trademark' }}</span>
          <div class="tm-list__actions">
            <el-button type="primary" plain @click="emit('edit', index)">Edit</el-button>
            <el-button type="danger" plain @click="emit('remove', index)">Remove</el-button>
          </div>
        </div>

        <div class="tm-list__meta">
          <span v-if="trademark.requestType" class="tm-list__meta-item">
            {{ requestTypes.find((r) => r.key === trademark.requestType)?.shortLabel || trademark.requestType }}
          </span>
          <span v-if="trademark.classOfGoods" class="tm-list__meta-item">
            Class {{ trademark.classOfGoods }}
          </span>
        </div>

        <div v-if="trademark.owner?.fullName" class="tm-list__owner">
          Owner: {{ trademark.owner.fullName }}
        </div>

        <div class="tm-list__completeness">
          <div class="tm-list__completeness-label">
            Sections: {{ Math.round(computeCompleteness(trademark) / 12.5) }}/8
            &nbsp;
            <span class="tm-list__completeness-pct">{{ computeCompleteness(trademark) }}%</span>
          </div>
          <div class="tm-list__completeness-bar-track">
            <div
              class="tm-list__completeness-bar-fill"
              :style="{ width: completenessBarWidth(trademark), background: completenessColor(trademark) }"
            />
          </div>
        </div>

        <div class="tm-list__fee">
          Fee: {{ Number(getFeeForTrademark(trademark)).toLocaleString() }} TZS
        </div>
      </div>
    </div>

    <!-- Total row -->
    <div v-if="trademarks.length" class="tm-list__total">
      <span class="tm-list__total-label">Total Fee</span>
      <span class="tm-list__total-amount">{{ Number(totalFee).toLocaleString() }} TZS</span>
    </div>

    <div class="tm-list__add-row">
      <el-button type="primary" @click="emit('add')">
        + Add Trademark
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.tm-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tm-list__empty {
  padding: 24px;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
}

.tm-list__card {
  display: flex;
  gap: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  padding: 14px;
  background: #fff;
}

.tm-list__card-left {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  padding-top: 2px;
}

.tm-list__index-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tm-list__card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tm-list__card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.tm-list__name {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.tm-list__actions {
  display: flex;
  gap: 6px;
}

.tm-list__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tm-list__meta-item {
  font-size: 12px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 4px;
  padding: 1px 7px;
}

.tm-list__owner {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.tm-list__completeness {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.tm-list__completeness-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.tm-list__completeness-pct {
  font-weight: 600;
}

.tm-list__completeness-bar-track {
  height: 6px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  overflow: hidden;
  width: 180px;
  max-width: 100%;
}

.tm-list__completeness-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.tm-list__fee {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.tm-list__total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--el-border-color);
  padding-top: 12px;
  font-size: 14px;
}

.tm-list__total-label {
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.tm-list__total-amount {
  font-weight: 700;
  font-size: 15px;
  color: var(--el-text-color-primary);
}

.tm-list__add-row {
  display: flex;
  justify-content: flex-start;
}
</style>
