import {
  DEFAULT_APPLICATION_SERVICE_KEY,
  getApplicationServiceByKey
} from '@/constants/applicationCatalog'
import {
  getApplicationProcessStages,
  getApplicationServiceFields
} from '@/constants/applicationProcesses'
import {
  getCertificatePolicy,
  getServiceRule
} from '@/constants/applicationServiceRules'
import { TRADEMARK_REQUEST_TYPE_OPTIONS } from '@/constants/trademarkRecordation'

const SERVICE_EXPERIENCE_CONFIG = Object.freeze({
  'trademark-recordation': {
    bestFor: 'Rights holders and agents who need a new trademark recordation or a follow-up filing for an existing record.',
    decisionPoints: [
      'Use this when you need a new recordation, renewal, alteration, ownership change, name change, or agent update.',
      'Choose this only if you can identify the rights holder and provide the underlying title or registration evidence.'
    ],
    preparationChecklist: [
      'Current trademark registration certificate',
      'Evidence of title, assignment, or licensing rights',
      'Trademark representation, class details, and any change-specific evidence'
    ],
    goodToKnow: 'The same workspace supports follow-up filings, so applicants do not need a separate process for renewals or amendments.'
  },
  'merger-clearance': {
    bestFor: 'Businesses notifying a merger, acquisition, or joint venture that needs FCC competition clearance.',
    decisionPoints: [
      'Use this when the transaction structure, parties, and market rationale are already defined well enough for formal filing.',
      'Expect a longer review cycle than the other services because the workflow includes completeness review, analysis, and Commission determination.'
    ],
    preparationChecklist: [
      'Transaction structure, parties involved, and target-firm details',
      'Estimated turnover and transaction value in TZS',
      'Commercial rationale, market definition, and confidentiality basis where applicable'
    ],
    goodToKnow: 'Large or complex transactions can trigger a longer FCC review path, so the filing should be treated as a coordinated project rather than a quick form submission.'
  },
  'sfcc-registration': {
    bestFor: 'Applicants registering standard form consumer contracts for FCC screening and approval.',
    decisionPoints: [
      'Use this when the contract wording is stable enough for review and you already know the target market or customer segment.',
      'The fee is charged per contract, so group and count the contracts before you begin.'
    ],
    preparationChecklist: [
      'Contract category and the contract set you intend to file',
      'Target market or consumer segment covered by the contract',
      'Clear consumer-impact summary explaining rights, obligations, and risks'
    ],
    goodToKnow: 'Because the fee model is per contract, applicants benefit from preparing a complete contract inventory before they start the wizard.'
  },
  'legal-opinion': {
    bestFor: 'Applicants seeking a formal FCC opinion on a competition, consumer-protection, or procedural issue.',
    decisionPoints: [
      'Use this when the issue is already framed as a specific legal question rather than a general support request.',
      'The quality of the opinion request depends heavily on the supporting facts and the legal basis you provide up front.'
    ],
    preparationChecklist: [
      'A concise question summary and the legal issue category',
      'Supporting facts, chronology, and context for the request',
      'Any documents or references that help FCC evaluate the legal question'
    ],
    goodToKnow: 'This service returns an FCC opinion or decision notice rather than a downloadable certificate.'
  },
  exemption: {
    bestFor: 'Applicants seeking a statutory exemption under the competition or consumer-protection framework.',
    decisionPoints: [
      'Use this when you can identify the exemption type and the legal basis for the request before filing.',
      'The request should explain why the exemption is justified, not just describe the business activity.'
    ],
    preparationChecklist: [
      'Chosen exemption type and the legal basis supporting it',
      'Requested validity period and the reason it is appropriate',
      'Supporting documents that explain why the exemption should be granted'
    ],
    goodToKnow: 'This workflow ends in an FCC decision, so applicants should plan around decision tracking rather than certificate download.'
  }
})

function formatTzs(value = 0) {
  return `TZS ${Number(value || 0).toLocaleString()}`
}

function buildFeeLabel(serviceKey, rule) {
  if (rule.feeModel === 'trademark-request') {
    const fees = TRADEMARK_REQUEST_TYPE_OPTIONS.map((item) => Number(item.feeTzs || 0))
    const min = Math.min(...fees)
    const max = Math.max(...fees)
    return `${formatTzs(min)} to ${formatTzs(max)} depending on request type`
  }

  if (rule.feeModel === 'per-contract') {
    return `${formatTzs(rule.fees.perContract)} per contract submitted`
  }

  if (rule.feeModel === 'single-clearance') {
    return `${formatTzs(rule.fees.base)} base filing fee, with value-linked increments for larger deals`
  }

  if (rule.feeModel === 'fixed') {
    return `${formatTzs(rule.fees.base)} flat filing fee`
  }

  return `${formatTzs(rule.fees.base || 0)} estimated filing fee`
}

function buildOutcomeLabel(certificatePolicy = {}) {
  if (!certificatePolicy.available) {
    return 'FCC issues a decision or opinion notice instead of a certificate.'
  }

  if (certificatePolicy.validityMonths) {
    return `Approved applications receive a certificate with ${certificatePolicy.validityMonths}-month validity.`
  }

  return 'Approved applications receive a certificate with no fixed expiry shown in the portal.'
}

export function getApplicationServiceExperience(serviceKey = DEFAULT_APPLICATION_SERVICE_KEY) {
  const service = getApplicationServiceByKey(serviceKey)
  const config = SERVICE_EXPERIENCE_CONFIG[service.key] || SERVICE_EXPERIENCE_CONFIG[DEFAULT_APPLICATION_SERVICE_KEY]
  const rule = getServiceRule(service.key)
  const certificatePolicy = getCertificatePolicy(service.key)
  const stages = getApplicationProcessStages(service.key)
  const fields = getApplicationServiceFields(service.key)
  const requiredFieldCount = fields.filter((field) => field.required).length

  return {
    ...service,
    ...config,
    stageCount: stages.length,
    requiredFieldCount,
    workflowLabel: `${stages.length} workflow milestone${stages.length === 1 ? '' : 's'} from filing to outcome`,
    requiredFieldLabel: `${requiredFieldCount} guided form field${requiredFieldCount === 1 ? '' : 's'} require applicant input`,
    feeLabel: buildFeeLabel(service.key, rule),
    outcomeLabel: buildOutcomeLabel(certificatePolicy),
    outcomeChipLabel: certificatePolicy.available ? 'Certificate on approval' : 'Decision notice',
    certificatePolicy
  }
}
