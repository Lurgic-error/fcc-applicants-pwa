import { DEFAULT_APPLICATION_SERVICE_KEY } from '@/constants/applicationCatalog'

const COMMON_STAGES = Object.freeze([
  { key: 'application_submitted', title: 'Application Submitted', actor: 'Applicant' },
  { key: 'assigned_for_screening', title: 'Assigned For Screening', actor: 'FCC Officer' },
  { key: 'screening_in_progress', title: 'Screening In Progress', actor: 'FCC Officer' },
  { key: 'awaiting_payment', title: 'Awaiting Payment', actor: 'Applicant' },
  { key: 'payment_verified', title: 'Payment Verified', actor: 'FCC Officer' },
  { key: 'under_vetting', title: 'Under Vetting', actor: 'Manager / Director' }
])

const APPLICATION_PROCESS_CONFIG = Object.freeze({
  'trademark-recordation': {
    processName: 'Trademark Recordation',
    stages: [
      { key: 'draft', title: 'Draft', actor: 'Applicant / Agent' },
      { key: 'application_submitted', title: 'Submitted', actor: 'Applicant / Agent' },
      { key: 'under_review', title: 'Under Review', actor: 'TRO / ACEO / ACEM' },
      { key: 'query_raised', title: 'Query Raised', actor: 'FCC Reviewer' },
      { key: 'payment_verified', title: 'Payment Verified', actor: 'Finance / FCC Officer' },
      { key: 'approved', title: 'Approved', actor: 'Chief Inspector' },
      { key: 'rejected', title: 'Rejected', actor: 'Chief Inspector' },
      { key: 'expired', title: 'Expired', actor: 'System' }
    ],
    fields: [
      {
        key: 'requestType',
        label: 'Request Type',
        type: 'select',
        required: true,
        step: 0,
        options: [
          'new_recordation',
          'renewal',
          'alteration',
          'ownership_change',
          'name_change',
          'agent_appointment',
          'discontinuation'
        ]
      },
      { key: 'markName', label: 'Trademark Name', type: 'text', required: true, step: 1 },
      { key: 'classNumber', label: 'Class Number', type: 'text', required: true, step: 1 },
      {
        key: 'representationType',
        label: 'Representation Type',
        type: 'select',
        required: true,
        step: 1,
        options: ['Word Mark', 'Device Mark', 'Combined Mark']
      },
      { key: 'ownerCategory', label: 'Owner Category', type: 'text', required: true, step: 1 },
      { key: 'registrationReference', label: 'Registration Reference', type: 'text', required: true, step: 1 },
      { key: 'countryOfOrigin', label: 'Country Of Origin', type: 'text', required: true, step: 1 }
    ]
  },
  'merger-clearance': {
    processName: 'Merger Clearance',
    stages: [
      { key: 'application_submitted', title: 'Application Submitted (FCC-8)', actor: 'Applicant' },
      { key: 'completeness_review', title: 'Completeness Review', actor: 'Economist / Legal Officer' },
      { key: 'complete_filing_issued', title: 'Complete Filing Notice Issued (FCC-11)', actor: 'DRMA' },
      { key: 'initial_period', title: 'Initial Period (14 days)', actor: 'DG / DRMA' },
      { key: 'investigation', title: 'Investigation Opened (FCC-14A)', actor: 'FCC' },
      { key: 'analysis_submitted', title: 'Merger Analysis Report Submitted', actor: 'Economist / Legal Officer' },
      { key: 'commission_determination', title: 'Commission Determination', actor: 'Commission' },
      { key: 'certificate_issued', title: 'Clearance Certificate Issued (FCC-18)', actor: 'Commission / DG' },
      { key: 'monitoring', title: 'Monitoring / Revocation Watch', actor: 'FCC' },
      { key: 'closed', title: 'Application Closed', actor: 'FCC' }
    ],
    fields: [
      {
        key: 'transactionType',
        label: 'Transaction Type',
        type: 'select',
        required: true,
        step: 0,
        options: ['Merger', 'Acquisition', 'Joint Venture']
      },
      { key: 'partiesInvolved', label: 'Parties Involved', type: 'textarea', required: true, step: 0 },
      { key: 'estimatedTurnover', label: 'Estimated Annual Turnover (TZS)', type: 'number', required: true, step: 0 },
      { key: 'transactionValue', label: 'Transaction Value (TZS)', type: 'number', required: true, step: 0 },
      { key: 'targetFirmName', label: 'Target Firm Name', type: 'text', required: true, step: 0 },
      { key: 'targetFirmBusiness', label: 'Target Firm Business Description', type: 'textarea', required: true, step: 0 },
      { key: 'acquisitionDescription', label: 'Nature of Acquisition', type: 'textarea', required: true, step: 0 },
      { key: 'commercialRationale', label: 'Commercial Rationale', type: 'textarea', required: true, step: 0 },
      { key: 'relevantMarketDefinition', label: 'Relevant Market Definition', type: 'textarea', required: true, step: 0 },
      { key: 'confidentialityClaimRequired', label: 'Confidentiality Claim Required', type: 'boolean', required: false, step: 0 },
      { key: 'confidentialityStatement', label: 'Confidentiality Statement', type: 'textarea', required: false, step: 0 }
    ]
  },
  'sfcc-registration': {
    processName: 'SFCC Registration',
    stages: [...COMMON_STAGES, { key: 'certificate_issued', title: 'Certificate Issued', actor: 'Director General' }],
    fields: [
      { key: 'contractCategory', label: 'Contract Category', type: 'text', required: true, step: 0 },
      { key: 'targetMarket', label: 'Target Market', type: 'text', required: true, step: 0 },
      { key: 'consumerImpactSummary', label: 'Consumer Impact Summary', type: 'textarea', required: true, step: 0 }
    ]
  },
  'legal-opinion': {
    processName: 'Legal Opinion',
    stages: [...COMMON_STAGES, { key: 'opinion_issued', title: 'Legal Opinion Issued', actor: 'Legal Director' }],
    fields: [
      {
        key: 'legalIssueCategory',
        label: 'Legal Issue Category',
        type: 'select',
        required: true,
        step: 0,
        options: ['Competition', 'Consumer Protection', 'Procedural', 'Other']
      },
      { key: 'questionSummary', label: 'Question Summary', type: 'textarea', required: true, step: 0 },
      { key: 'supportingFacts', label: 'Supporting Facts', type: 'textarea', required: true, step: 0 }
    ]
  },
  exemption: {
    processName: 'Exemption',
    stages: [...COMMON_STAGES, { key: 'exemption_issued', title: 'Exemption Issued', actor: 'Commission' }],
    fields: [
      {
        key: 'exemptionType',
        label: 'Exemption Type',
        type: 'select',
        required: true,
        step: 0,
        options: ['Block Exemption', 'Individual Exemption', 'Temporary Exemption']
      },
      { key: 'legalBasis', label: 'Legal Basis', type: 'textarea', required: true, step: 0 },
      { key: 'validityPeriodMonths', label: 'Requested Validity (Months)', type: 'number', required: true, step: 0 }
    ]
  }
})

export function getApplicationProcessConfig(serviceKey = DEFAULT_APPLICATION_SERVICE_KEY) {
  return APPLICATION_PROCESS_CONFIG[serviceKey] || APPLICATION_PROCESS_CONFIG[DEFAULT_APPLICATION_SERVICE_KEY]
}

export function getApplicationProcessName(serviceKey = DEFAULT_APPLICATION_SERVICE_KEY) {
  return getApplicationProcessConfig(serviceKey).processName
}

export function getApplicationProcessStages(serviceKey = DEFAULT_APPLICATION_SERVICE_KEY) {
  return getApplicationProcessConfig(serviceKey).stages
}

export function getApplicationServiceFields(serviceKey = DEFAULT_APPLICATION_SERVICE_KEY) {
  return getApplicationProcessConfig(serviceKey).fields
}
