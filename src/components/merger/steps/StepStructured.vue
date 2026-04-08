<script setup>
/**
 * Generic step renderer for text-heavy sections of FCC-8.
 * Receives stepId and stepDef props, looks up a static FIELD_MAP
 * to render the correct fields with minimal boilerplate.
 */
import { inject } from 'vue'

const props = defineProps({
  stepId: { type: String, required: true },
  stepDef: { type: Object, default: () => ({}) }
})

const get = inject('wizardGet')
const set = inject('wizardSet')

// ─── FIELD DEFINITIONS ───────────────────────────────────────────
// Each entry: { label, path, type: 'input'|'textarea'|'bool', wide?: boolean }
const FIELD_MAP = {
  background: [
    { label: 'Industry Sectors', path: 'backgroundInformation.industrySectors.description', type: 'textarea', wide: true },
    { label: 'Areas of Overlap', path: 'backgroundInformation.areasOfOverlap.description', type: 'textarea', wide: true },
    { label: 'Existing Relationships', path: 'backgroundInformation.existingRelationships.description', type: 'textarea', wide: true }
  ],
  competitors: [
    { label: 'Viable Alternatives Explanation', path: 'competitors.viableAlternativesExplanation', type: 'textarea', wide: true }
  ],
  concentration: [
    { label: 'Market Concentration Overview', path: 'marketConcentration.description', type: 'textarea', wide: true }
  ],
  constraints: [
    { label: 'Supplier Constraints', path: 'constraintsOnMarketPower.supplierConstraints.description', type: 'textarea', wide: true },
    { label: 'Supplier Switching Ability', path: 'constraintsOnMarketPower.supplierConstraints.supplierSwitchingAbility', type: 'textarea' },
    { label: 'Competitor Capacity to Increase Supply', path: 'constraintsOnMarketPower.supplierConstraints.competitorCapacityToIncreaseSupply', type: 'textarea' },
    { label: 'Competitor Constraints', path: 'constraintsOnMarketPower.competitorConstraints.description', type: 'textarea', wide: true },
    { label: 'Customer Switching Ease', path: 'constraintsOnMarketPower.competitorConstraints.customerSwitchingEase', type: 'textarea' },
    { label: 'Switching Costs', path: 'constraintsOnMarketPower.competitorConstraints.switchingCosts', type: 'textarea' },
    { label: 'Product Homogeneity / Differentiation', path: 'constraintsOnMarketPower.competitorConstraints.productHomogeneityOrDifferentiation', type: 'textarea' },
    { label: 'Brand Loyalty', path: 'constraintsOnMarketPower.competitorConstraints.brandLoyalty', type: 'textarea' },
    { label: 'Customer Constraints', path: 'constraintsOnMarketPower.customerConstraints.description', type: 'textarea', wide: true },
    { label: 'Countervailing Power', path: 'constraintsOnMarketPower.customerConstraints.countervailingPower', type: 'textarea' },
    { label: 'Extent of Constraint Post-Acquisition', path: 'constraintsOnMarketPower.customerConstraints.extentOfConstraintPostAcquisition', type: 'textarea' },
    { label: 'Other Constraints', path: 'constraintsOnMarketPower.otherConstraints.description', type: 'textarea', wide: true }
  ],
  imports: [
    { label: 'Import Levels Overview', path: 'imports.importLevels.description', type: 'textarea', wide: true },
    { label: 'Transport Costs', path: 'imports.importLevels.transportCosts', type: 'textarea' },
    { label: 'Data Source', path: 'imports.importLevels.dataSource', type: 'input' },
    { label: 'Import Barriers', path: 'imports.importBarriers.description', type: 'textarea', wide: true },
    { label: 'Requires Significant Investment', path: 'imports.importBarriers.requiresSignificantInvestment', type: 'bool' },
    { label: 'Import Facilities', path: 'imports.importFacilities.description', type: 'textarea', wide: true },
    { label: 'Import Pricing', path: 'imports.importPricing.description', type: 'textarea', wide: true },
    { label: 'Import Constraint Post-Acquisition', path: 'imports.importConstraintPostAcquisition.description', type: 'textarea', wide: true }
  ],
  exports: [
    { label: 'Export Levels Overview', path: 'exports.exportLevels.description', type: 'textarea', wide: true },
    { label: 'Transport Costs', path: 'exports.exportLevels.transportCosts', type: 'textarea' },
    { label: 'Data Source', path: 'exports.exportLevels.dataSource', type: 'input' },
    { label: 'Export Barriers', path: 'exports.exportBarriers.description', type: 'textarea', wide: true },
    { label: 'Export Pricing', path: 'exports.exportPricing.description', type: 'textarea', wide: true },
    { label: 'Supplier Export Ability', path: 'exports.supplierExportAbility.description', type: 'textarea', wide: true },
    { label: 'Can Suppliers Export Post-Acquisition', path: 'exports.supplierExportAbility.canSuppliersExportPostAcquisition', type: 'bool' },
    { label: 'Extent of Constraint on Merger Parties', path: 'exports.supplierExportAbility.extentOfConstraintOnMergerParties', type: 'textarea' }
  ],
  barriers: [
    { label: 'Natural Barriers', path: 'barriersToEntryAndExpansion.barriers.naturalBarriers.description', type: 'textarea', wide: true },
    { label: 'Strategic Barriers', path: 'barriersToEntryAndExpansion.barriers.strategicBarriers.description', type: 'textarea', wide: true },
    { label: 'Regulatory & Policy Barriers', path: 'barriersToEntryAndExpansion.barriers.regulatoryAndPolicyBarriers.description', type: 'textarea', wide: true },
    { label: 'Sunk Costs in Production Capacity', path: 'barriersToEntryAndExpansion.barriers.sunkCostsInProductionCapacity', type: 'textarea' },
    { label: 'Access to Shelf Space', path: 'barriersToEntryAndExpansion.barriers.accessToShelfSpace', type: 'textarea' },
    { label: 'Advertising & Promotion', path: 'barriersToEntryAndExpansion.barriers.advertisingAndPromotion', type: 'textarea' },
    { label: 'Regulatory Restrictions', path: 'barriersToEntryAndExpansion.barriers.regulatoryRestrictions', type: 'textarea' },
    { label: 'Requirements for Scarce Inputs', path: 'barriersToEntryAndExpansion.barriers.requirementsForScarceInputs', type: 'textarea' },
    { label: 'Brand Loyalty', path: 'barriersToEntryAndExpansion.barriers.brandLoyalty', type: 'textarea' },
    { label: 'Minimum Efficient Scale', path: 'barriersToEntryAndExpansion.barriers.minimumEfficientScale', type: 'textarea' },
    { label: 'Goodwill', path: 'barriersToEntryAndExpansion.barriers.goodwill', type: 'textarea' },
    { label: 'Access to Intellectual Property', path: 'barriersToEntryAndExpansion.barriers.accessToIntellectualProperty', type: 'textarea' },
    { label: 'Potential Response of Incumbents', path: 'barriersToEntryAndExpansion.barriers.potentialResponseOfIncumbents', type: 'textarea' },
    { label: 'Time for New Entrant to Establish', path: 'barriersToEntryAndExpansion.barriers.timeForNewEntrantToEstablish', type: 'textarea' },
    { label: 'Incentives for New Entry', path: 'barriersToEntryAndExpansion.barriers.incentivesForNewEntry', type: 'textarea' },
    { label: 'Disincentives for New Entry', path: 'barriersToEntryAndExpansion.barriers.disincentivesForNewEntry', type: 'textarea' }
  ],
  dynamics: [
    { label: 'Overview', path: 'dynamicCharacteristics.description', type: 'textarea', wide: true },
    { label: 'Growth', path: 'dynamicCharacteristics.growth', type: 'textarea' },
    { label: 'Levels of Innovation', path: 'dynamicCharacteristics.levelsOfInnovation', type: 'textarea' },
    { label: 'Technological Change', path: 'dynamicCharacteristics.technologicalChange', type: 'textarea' },
    { label: 'Product & Service Differentiation', path: 'dynamicCharacteristics.productAndServiceDifferentiation', type: 'textarea' }
  ],
  vigorous: [
    { label: 'Overview', path: 'vigorousAndEffectiveCompetitor.description', type: 'textarea', wide: true },
    { label: 'Is Target Vigorous & Effective?', path: 'vigorousAndEffectiveCompetitor.targetAsCompetitor.isVigorousAndEffective', type: 'bool' },
    { label: 'Extent', path: 'vigorousAndEffectiveCompetitor.targetAsCompetitor.extent', type: 'textarea' },
    { label: 'Reasons', path: 'vigorousAndEffectiveCompetitor.targetAsCompetitor.reasons', type: 'textarea' },
    { label: 'Current & Historical Pricing Behavior', path: 'vigorousAndEffectiveCompetitor.targetAsCompetitor.currentAndHistoricalPricingBehavior', type: 'textarea' },
    { label: 'Purchasing Behavior', path: 'vigorousAndEffectiveCompetitor.targetAsCompetitor.purchasingBehavior', type: 'textarea' },
    { label: 'Innovation Record', path: 'vigorousAndEffectiveCompetitor.targetAsCompetitor.innovationRecord', type: 'textarea' },
    { label: 'Growth Relative to Market', path: 'vigorousAndEffectiveCompetitor.targetAsCompetitor.growthRelativeToMarket', type: 'textarea' },
    { label: 'History of Independent Behavior', path: 'vigorousAndEffectiveCompetitor.targetAsCompetitor.historyOfIndependentBehavior', type: 'textarea' }
  ],
  vertical: [
    { label: 'Vertical Integration Overview', path: 'verticalIntegration.increasedVerticalIntegration.description', type: 'textarea', wide: true },
    { label: 'Would Result in Increased Vertical Integration?', path: 'verticalIntegration.increasedVerticalIntegration.wouldResultInIncreasedVerticalIntegration', type: 'bool' },
    { label: 'Foreclosure Risk Overview', path: 'verticalIntegration.foreclosureRisk.description', type: 'textarea', wide: true },
    { label: 'Would Limit Supply of Inputs?', path: 'verticalIntegration.foreclosureRisk.wouldLimitSupplyOfInputs', type: 'bool' },
    { label: 'Would Limit Access to Distribution?', path: 'verticalIntegration.foreclosureRisk.wouldLimitAccessToDistribution', type: 'bool' },
    { label: 'Downstream Rivals Impact', path: 'verticalIntegration.foreclosureRisk.downstreamRivalsImpact', type: 'textarea' },
    { label: 'Upstream Rivals Impact', path: 'verticalIntegration.foreclosureRisk.upstreamRivalsImpact', type: 'textarea' }
  ],
  prices: [
    { label: 'Pricing Levels', path: 'pricesAndProfitMargins.pricingLevels.description', type: 'textarea', wide: true },
    { label: 'Supply Costs', path: 'pricesAndProfitMargins.supplyCosts.description', type: 'textarea', wide: true },
    { label: 'Competitive Constraints on Pricing', path: 'pricesAndProfitMargins.competitiveConstraintsOnPricing.description', type: 'textarea', wide: true },
    { label: 'Coordinated Conduct', path: 'pricesAndProfitMargins.coordinatedConduct.description', type: 'textarea', wide: true },
    { label: 'Number of Participants', path: 'pricesAndProfitMargins.coordinatedConduct.numberOfParticipants', type: 'input' },
    { label: 'Transparency in Market', path: 'pricesAndProfitMargins.coordinatedConduct.transparencyInMarket', type: 'textarea' },
    { label: 'Homogeneity of Firms', path: 'pricesAndProfitMargins.coordinatedConduct.homogeneityOfFirms', type: 'textarea' },
    { label: 'Size & Frequency of Purchases', path: 'pricesAndProfitMargins.coordinatedConduct.sizeAndFrequencyOfPurchases', type: 'textarea' },
    { label: 'Multi-Market Presence', path: 'pricesAndProfitMargins.coordinatedConduct.multiMarketPresence', type: 'textarea' },
    { label: 'Profit Margin Impact', path: 'pricesAndProfitMargins.profitMarginImpact.description', type: 'textarea', wide: true },
    { label: 'Expected Change in Margins', path: 'pricesAndProfitMargins.profitMarginImpact.expectedChangeInProfitMargins', type: 'textarea' },
    { label: 'Expected Cause of Change', path: 'pricesAndProfitMargins.profitMarginImpact.expectedCauseOfChange', type: 'textarea' }
  ],
  related: [
    { label: 'Complementarities', path: 'relatedMarkets.complementarities.description', type: 'textarea', wide: true },
    { label: 'Bundling & Tying Overview', path: 'relatedMarkets.bundlingAndTying.description', type: 'textarea', wide: true },
    { label: 'Pure Bundling Exists?', path: 'relatedMarkets.bundlingAndTying.pureBundling.exists', type: 'bool' },
    { label: 'Pure Bundling Description', path: 'relatedMarkets.bundlingAndTying.pureBundling.description', type: 'textarea' },
    { label: 'Mixed Bundling Exists?', path: 'relatedMarkets.bundlingAndTying.mixedBundling.exists', type: 'bool' },
    { label: 'Mixed Bundling Description', path: 'relatedMarkets.bundlingAndTying.mixedBundling.description', type: 'textarea' },
    { label: 'Tying Exists?', path: 'relatedMarkets.bundlingAndTying.tying.exists', type: 'bool' },
    { label: 'Tying Description', path: 'relatedMarkets.bundlingAndTying.tying.description', type: 'textarea' },
    { label: 'Tying Product', path: 'relatedMarkets.bundlingAndTying.tying.tyingProduct', type: 'input' },
    { label: 'Tied Product', path: 'relatedMarkets.bundlingAndTying.tying.tiedProduct', type: 'input' },
    { label: 'Constraints on Bundling Foreclosure', path: 'relatedMarkets.constraintsOnBundlingForeclosure.description', type: 'textarea', wide: true }
  ],
  otherGrounds: [
    { label: 'Other Grounds for Clearance', path: 'otherGroundsForClearance.description', type: 'textarea', wide: true }
  ],
  counterfactual: [
    { label: 'Counterfactual Description', path: 'counterfactual.description', type: 'textarea', wide: true },
    { label: 'Reasons', path: 'counterfactual.reasons', type: 'textarea', wide: true }
  ],
  attachments: [
    // Attachments is a checklist-like step — render as description-only
    { label: 'Attachment Notes', path: 'acquisition.natureAndDetails.description', type: 'textarea', wide: true }
  ],
  undertaking: [
    { label: 'Company Name', path: 'undertaking.companyName', type: 'input' },
    { label: 'Company Address', path: 'undertaking.companyAddress', type: 'input', wide: true },
    { label: 'Acknowledges Public Inspection', path: 'undertaking.acknowledgesPublicInspection', type: 'bool' },
    { label: 'Further Info — Full Name', path: 'furtherInformation.fullName', type: 'input' },
    { label: 'Further Info — Postal Address', path: 'furtherInformation.postalAddress', type: 'input' },
    { label: 'Further Info — Telephone', path: 'furtherInformation.telephone', type: 'input' },
    { label: 'Further Info — Email', path: 'furtherInformation.email', type: 'input' },
    { label: 'Relationship to Applicant', path: 'furtherInformation.relationshipToApplicant', type: 'input' }
  ]
}

const fields = FIELD_MAP[props.stepId] || []
</script>

<template>
  <div class="space-y-6">
    <h3 class="merger-subsection-title">{{ stepDef.label || stepId }}</h3>
    <p v-if="stepDef.desc" class="merger-step-desc">{{ stepDef.desc }}</p>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <template v-for="field in fields" :key="field.path">
        <!-- Textarea -->
        <el-form-item
          v-if="field.type === 'textarea'"
          :label="field.label"
          :class="{ 'sm:col-span-2': field.wide }"
        >
          <el-input
            type="textarea"
            :rows="3"
            :model-value="get(field.path)"
            @update:model-value="v => set(field.path, v)"
          />
        </el-form-item>

        <!-- Boolean radio -->
        <el-form-item
          v-else-if="field.type === 'bool'"
          :label="field.label"
          :class="{ 'sm:col-span-2': field.wide }"
        >
          <el-radio-group
            :model-value="get(field.path)"
            @update:model-value="v => set(field.path, v)"
          >
            <el-radio :value="true">Yes</el-radio>
            <el-radio :value="false">No</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- Standard input -->
        <el-form-item
          v-else
          :label="field.label"
          :class="{ 'sm:col-span-2': field.wide }"
        >
          <el-input
            :model-value="get(field.path)"
            @update:model-value="v => set(field.path, v)"
          />
        </el-form-item>
      </template>
    </div>

    <div v-if="!fields.length" class="merger-empty-state">
      No fields configured for step "{{ stepId }}".
    </div>
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
.merger-empty-state {
  padding: 1rem;
  text-align: center;
  color: var(--fcc-text-muted, #64748b);
  font-size: 0.8125rem;
  border: 1px dashed var(--fcc-border, #dbe3ef);
  border-radius: var(--fcc-radius-md, 6px);
}
</style>
