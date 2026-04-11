<script setup>
/**
 * StepMergerFees — Rule 68(2) Merger Fee Calculator
 *
 * Auto-calculates the applicable merger notification fee based on
 * the higher of combined annual turnover or combined asset value.
 */
import { inject, computed } from 'vue'
import { MERGER_FEE_TIERS, calculateMergerFee } from '@/constants/mergerFcc8Config'
import { formatNumber, parseNumber } from '@/utils/numberFormat'

const get = inject('wizardGet')
const set = inject('wizardSet')
const form = inject('wizardForm')

const acqTurnover = computed(() => Number(form.mergerFeesDeclaration?.acquiringFirmFinancials?.turnover) || 0)
const acqAssets = computed(() => Number(form.mergerFeesDeclaration?.acquiringFirmFinancials?.assets) || 0)
const tgtTurnover = computed(() => Number(form.mergerFeesDeclaration?.targetFirmFinancials?.turnover) || 0)
const tgtAssets = computed(() => Number(form.mergerFeesDeclaration?.targetFirmFinancials?.assets) || 0)

const combinedTurnover = computed(() => acqTurnover.value + tgtTurnover.value)
const combinedAssets = computed(() => acqAssets.value + tgtAssets.value)
const higherValue = computed(() => Math.max(combinedTurnover.value, combinedAssets.value))
const higherLabel = computed(() => combinedTurnover.value >= combinedAssets.value ? 'Combined Turnover' : 'Combined Assets')

const feeResult = computed(() => calculateMergerFee(higherValue.value))

const acqName = computed(() =>
  form.acquiringFirms?.[0]?.bodyCorporateDetails?.companyName ||
  form.acquiringFirms?.[0]?.individualDetails?.fullName || ''
)
const tgtName = computed(() =>
  form.targetFirm?.bodyCorporateDetails?.name ||
  form.targetFirm?.individualDetails?.fullName || ''
)

function fmtTZS(v) {
  return v ? `TZS ${Number(v).toLocaleString()}` : 'TZS 0'
}
</script>

<template>
  <div class="space-y-6">
    <div class="merger-info-box">
      <strong>Rule 68(2)</strong> — Made under Rule 3 of the Second Schedule of the Fair Competition Act, 2003 and Rule 68(2)(a)–(c) of Competition Rules, 2018. Fees are calculated from the combined total annual turnover or assets (whichever is higher) from the last audited accounts.
    </div>

    <!-- A. Names -->
    <div>
      <h3 class="merger-subsection-title">A. Names of the Merging Parties</h3>
      <div class="names-table">
        <div class="names-row">
          <span class="names-label">Acquiring Firm</span>
          <span class="names-value">{{ acqName || 'Set in Acquiring Firm(s) step' }}</span>
        </div>
        <div class="names-row">
          <span class="names-label">Target Firm</span>
          <span class="names-value">{{ tgtName || 'Set in Target Firm step' }}</span>
        </div>
      </div>
    </div>

    <!-- B. Financial Position -->
    <div>
      <h3 class="merger-subsection-title">B. Financial Position (TZS)</h3>
      <p class="merger-hint">Enter figures from the last audited annual financial statements.</p>
      <div class="fin-grid">
        <div class="fin-col">
          <h4 class="fin-col-title">Acquiring Firm</h4>
          <el-form-item label="(i) Turnover">
            <el-input
              :model-value="formatNumber(acqTurnover)"
              @update:model-value="v => set('mergerFeesDeclaration.acquiringFirmFinancials.turnover', parseNumber(v))"
              placeholder="0"
            />
          </el-form-item>
          <el-form-item label="(ii) Assets">
            <el-input
              :model-value="formatNumber(acqAssets)"
              @update:model-value="v => set('mergerFeesDeclaration.acquiringFirmFinancials.assets', parseNumber(v))"
              placeholder="0"
            />
          </el-form-item>
        </div>
        <div class="fin-col">
          <h4 class="fin-col-title">Target Firm</h4>
          <el-form-item label="(iii) Turnover">
            <el-input
              :model-value="formatNumber(tgtTurnover)"
              @update:model-value="v => set('mergerFeesDeclaration.targetFirmFinancials.turnover', parseNumber(v))"
              placeholder="0"
            />
          </el-form-item>
          <el-form-item label="(iv) Assets">
            <el-input
              :model-value="formatNumber(tgtAssets)"
              @update:model-value="v => set('mergerFeesDeclaration.targetFirmFinancials.assets', parseNumber(v))"
              placeholder="0"
            />
          </el-form-item>
        </div>
      </div>
    </div>

    <!-- C. Combined Values -->
    <div>
      <h3 class="merger-subsection-title">C. Combined Values</h3>
      <div class="combined-grid">
        <div class="combined-item">
          <span class="combined-label">(v) Combined Turnover</span>
          <span class="combined-value">{{ fmtTZS(combinedTurnover) }}</span>
        </div>
        <div class="combined-item">
          <span class="combined-label">(vi) Combined Assets</span>
          <span class="combined-value">{{ fmtTZS(combinedAssets) }}</span>
        </div>
        <div class="combined-item combined-item--highlight">
          <span class="combined-label">Higher Value ({{ higherLabel }})</span>
          <span class="combined-value combined-value--primary">{{ fmtTZS(higherValue) }}</span>
        </div>
      </div>
    </div>

    <!-- Fee Tiers -->
    <div>
      <h3 class="merger-subsection-title">Applicable Fee — Rule 68(2)</h3>
      <div class="fee-tiers">
        <div
          v-for="tier in MERGER_FEE_TIERS"
          :key="tier.rule"
          class="fee-tier"
          :class="{ 'fee-tier--active': feeResult?.rule === tier.rule }"
        >
          <div class="fee-tier__range">{{ tier.label }}</div>
          <div class="fee-tier__rule">{{ tier.rule }}</div>
          <div class="fee-tier__amount">{{ fmtTZS(tier.fee) }}</div>
        </div>
      </div>
    </div>

    <!-- Result -->
    <div v-if="feeResult" class="fee-result">
      <div class="fee-result__label">Applicable Filing Fee</div>
      <div class="fee-result__sub">Based on {{ higherLabel }}: {{ fmtTZS(higherValue) }} — {{ feeResult.rule }}</div>
      <div class="fee-result__amount">{{ fmtTZS(feeResult.fee) }}</div>
    </div>
    <div v-else-if="higherValue > 0" class="merger-warn-box">
      Combined value of {{ fmtTZS(higherValue) }} is below the minimum threshold of TZS 3.5 billion.
    </div>
    <div v-else class="merger-info-box">
      Enter the financial figures above. The filing fee will be automatically calculated.
    </div>

    <!-- D. Signatory -->
    <div>
      <h3 class="merger-subsection-title">D. Signatory</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem">
        <el-form-item label="Full Name">
          <el-input
            :model-value="form.mergerFeesDeclaration?.signatory?.fullName"
            @update:model-value="v => set('mergerFeesDeclaration.signatory.fullName', v)"
          />
        </el-form-item>
        <el-form-item label="Date">
          <el-date-picker
            :model-value="form.mergerFeesDeclaration?.signatory?.date"
            @update:model-value="v => set('mergerFeesDeclaration.signatory.date', v)"
            type="date" value-format="YYYY-MM-DD" style="width: 100%"
          />
        </el-form-item>
      </div>
    </div>
  </div>
</template>

<style scoped>
.merger-subsection-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--fcc-text-primary, #0f172a);
  margin-bottom: 0.5rem;
}

.merger-hint {
  font-size: 0.75rem;
  color: var(--fcc-text-muted, #64748b);
  margin-bottom: 0.75rem;
}

.merger-info-box {
  padding: 0.625rem 0.875rem;
  background: color-mix(in srgb, var(--fcc-secondary-500, #0ea5e9) 4%, var(--fcc-bg-surface, #fff));
  border-left: 3px solid var(--fcc-secondary-500, #0ea5e9);
  border-radius: var(--fcc-radius-md, 6px);
  font-size: 0.8125rem;
  color: var(--fcc-text-secondary, #475569);
  line-height: 1.5;
}

.merger-warn-box {
  padding: 0.625rem 0.875rem;
  background: #fffbeb;
  border-left: 3px solid #f59e0b;
  border-radius: var(--fcc-radius-md, 6px);
  font-size: 0.8125rem;
  color: #92400e;
  line-height: 1.5;
}

/* Names table */
.names-table {
  border: 1px solid var(--fcc-border, #dbe3ef);
  border-radius: var(--fcc-radius-lg, 8px);
  overflow: hidden;
}

.names-row {
  display: flex;
  padding: 0.6rem 1rem;
  font-size: 0.8125rem;
}

.names-row + .names-row {
  border-top: 1px solid var(--fcc-border, #dbe3ef);
}

.names-label {
  width: 140px;
  flex-shrink: 0;
  font-weight: 600;
  color: var(--fcc-text-secondary);
}

.names-value {
  color: var(--fcc-text-primary);
}

/* Financials grid */
.fin-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.fin-col-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--fcc-text-muted);
  margin-bottom: 0.75rem;
}

/* Combined values */
.combined-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.75rem;
}

.combined-item {
  padding: 0.75rem;
  border: 1px solid var(--fcc-border, #dbe3ef);
  border-radius: var(--fcc-radius-lg, 8px);
  text-align: center;
}

.combined-item--highlight {
  border-color: var(--fcc-primary-400);
  background: color-mix(in srgb, var(--fcc-primary-500) 4%, var(--fcc-bg-surface));
}

.combined-label {
  display: block;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--fcc-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 0.25rem;
}

.combined-value {
  font-family: var(--fcc-font-mono, monospace);
  font-size: 0.875rem;
  font-weight: 700;
}

.combined-value--primary {
  color: var(--fcc-primary-700);
}

/* Fee tiers */
.fee-tiers {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.fee-tier {
  border: 1.5px solid var(--fcc-border, #dbe3ef);
  border-radius: var(--fcc-radius-lg, 8px);
  padding: 0.875rem;
  text-align: center;
  transition: all 0.2s;
}

.fee-tier--active {
  border-color: var(--fcc-primary-600);
  background: color-mix(in srgb, var(--fcc-primary-500) 5%, var(--fcc-bg-surface));
  box-shadow: 0 0 0 1px var(--fcc-primary-600);
}

.fee-tier__range {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--fcc-text-primary);
}

.fee-tier--active .fee-tier__range {
  color: var(--fcc-primary-700);
}

.fee-tier__rule {
  font-size: 0.6875rem;
  color: var(--fcc-text-muted);
  margin: 0.125rem 0 0.5rem;
}

.fee-tier__amount {
  font-family: var(--fcc-font-heading, 'Outfit', sans-serif);
  font-size: 1rem;
  font-weight: 800;
  color: var(--fcc-text-primary);
}

.fee-tier--active .fee-tier__amount {
  color: var(--fcc-primary-700);
}

/* Fee result banner */
.fee-result {
  padding: 1rem 1.25rem;
  background: color-mix(in srgb, var(--fcc-success) 5%, var(--fcc-bg-surface));
  border: 1.5px solid var(--fcc-success);
  border-radius: var(--fcc-radius-lg, 8px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.fee-result__label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--fcc-success);
}

.fee-result__sub {
  font-size: 0.6875rem;
  color: var(--fcc-text-muted);
  width: 100%;
}

.fee-result__amount {
  font-family: var(--fcc-font-heading, 'Outfit', sans-serif);
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--fcc-success);
}

@media (max-width: 767px) {
  .fin-grid,
  .combined-grid,
  .fee-tiers {
    grid-template-columns: 1fr;
  }
}
</style>
