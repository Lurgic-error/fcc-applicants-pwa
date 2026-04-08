<script setup>
import { inject, computed } from 'vue'

const form = inject('wizardForm')

/* Derived display values */
const applicantName = computed(() => {
  const a = form.applicant
  if (a.applicantType === 'individual') return a.individualDetails?.fullName || '—'
  return a.companyDetails?.companyName || '—'
})

const acquiringFirmNames = computed(() => {
  return (form.acquiringFirms || []).map((f, i) => {
    if (f.acquiringFirmType === 'bodyCorporate') return f.bodyCorporateDetails?.companyName || `Firm #${i + 1}`
    if (f.acquiringFirmType === 'individual') return f.individualDetails?.fullName || `Firm #${i + 1}`
    return `Firm #${i + 1}`
  }).join(', ') || '—'
})

const targetFirmName = computed(() => {
  const t = form.targetFirm
  if (t.targetType === 'bodyCorporate') return t.bodyCorporateDetails?.name || '—'
  if (t.targetType === 'individual') return t.individualDetails?.fullName || '—'
  return '—'
})

const isRegisteredInTZ = computed(() => {
  const val = form.targetFirm?.isRegisteredInTanzania
  if (val === true) return 'Yes'
  if (val === false) return 'No'
  return '—'
})

const localNexusName = computed(() => {
  if (!form.localNexus?.isApplicable) return null
  return form.localNexus?.companyName || '—'
})

const contractType = computed(() => {
  return form.acquisition?.natureAndDetails?.contractType || '—'
})

const consummationDate = computed(() => {
  return form.acquisition?.natureAndDetails?.intendedConsummationDate || '—'
})

const considerationAmount = computed(() => {
  const c = form.acquisition?.natureAndDetails?.consideration
  if (!c?.amount) return '—'
  return `${c.currency || ''} ${Number(c.amount).toLocaleString()}`.trim()
})
</script>

<template>
  <div class="space-y-6">
    <h3 class="merger-subsection-title">Review &amp; Submit</h3>
    <p class="merger-step-desc">
      Please review the key details of your merger notification below before submitting.
    </p>

    <dl class="review-list">
      <div class="review-item">
        <dt>Applicant</dt>
        <dd>{{ applicantName }}</dd>
      </div>
      <div class="review-item">
        <dt>Acquiring Firm(s)</dt>
        <dd>{{ acquiringFirmNames }}</dd>
      </div>
      <div class="review-item">
        <dt>Target Firm</dt>
        <dd>{{ targetFirmName }}</dd>
      </div>
      <div class="review-item">
        <dt>Registered in Tanzania</dt>
        <dd>{{ isRegisteredInTZ }}</dd>
      </div>
      <div v-if="localNexusName" class="review-item">
        <dt>Local Nexus Entity</dt>
        <dd>{{ localNexusName }}</dd>
      </div>
      <div class="review-item">
        <dt>Contract Type</dt>
        <dd>{{ contractType }}</dd>
      </div>
      <div class="review-item">
        <dt>Intended Consummation Date</dt>
        <dd>{{ consummationDate }}</dd>
      </div>
      <div class="review-item">
        <dt>Consideration</dt>
        <dd>{{ considerationAmount }}</dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.merger-subsection-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--fcc-text-primary, #0f172a);
  margin-bottom: 0.75rem;
}
.merger-step-desc {
  font-size: 0.8125rem;
  color: var(--fcc-text-secondary, #475569);
  line-height: 1.5;
  margin-bottom: 0.5rem;
}
.review-list {
  border: 1px solid var(--fcc-border, #dbe3ef);
  border-radius: var(--fcc-radius-card, 10px);
  overflow: hidden;
}
.review-item {
  display: flex;
  border-bottom: 1px solid var(--fcc-border, #dbe3ef);
  font-size: 0.8125rem;
}
.review-item:last-child {
  border-bottom: none;
}
.review-item dt {
  flex: 0 0 40%;
  padding: 0.625rem 0.875rem;
  font-weight: 600;
  color: var(--fcc-text-secondary, #475569);
  background: var(--fcc-bg-surface-muted, #f8fafc);
  border-right: 1px solid var(--fcc-border, #dbe3ef);
}
.review-item dd {
  flex: 1;
  padding: 0.625rem 0.875rem;
  color: var(--fcc-text-primary, #0f172a);
  margin: 0;
}
</style>
