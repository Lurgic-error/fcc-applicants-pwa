import { getApplicationServiceLabel } from '@/constants/applicationCatalog'

const serviceRows = {
  'trademark-recordation': [
    {
      applicationId: 'APP-TRM-2401',
      serviceKey: 'trademark-recordation',
      service: 'Trademark Recordation',
      requestType: 'new_recordation',
      workflowStageTitle: 'Screening In Progress',
      status: 'screening in progress',
      submittedAt: '2026-02-14',
      previewOnly: true
    },
    {
      applicationId: 'APP-TRM-2402',
      serviceKey: 'trademark-recordation',
      service: 'Trademark Recordation',
      requestType: 'renewal',
      workflowStageTitle: 'Awaiting Payment',
      status: 'awaiting payment',
      submittedAt: '2026-02-09',
      previewOnly: true
    },
    {
      applicationId: 'APP-TRM-2403',
      serviceKey: 'trademark-recordation',
      service: 'Trademark Recordation',
      requestType: 'ownership_change',
      workflowStageTitle: 'Under Vetting',
      status: 'under vetting',
      submittedAt: '2026-02-03',
      previewOnly: true
    }
  ],
  'merger-clearance': [
    {
      applicationId: 'APP-MRG-1151',
      serviceKey: 'merger-clearance',
      service: 'Merger Clearance',
      workflowStageTitle: 'Under Vetting',
      status: 'under vetting',
      submittedAt: '2026-02-13',
      previewOnly: true
    },
    {
      applicationId: 'APP-MRG-1149',
      serviceKey: 'merger-clearance',
      service: 'Merger Clearance',
      workflowStageTitle: 'Payment Verified',
      status: 'payment verified',
      submittedAt: '2026-02-08',
      previewOnly: true
    },
    {
      applicationId: 'APP-MRG-1142',
      serviceKey: 'merger-clearance',
      service: 'Merger Clearance',
      workflowStageTitle: 'Application Submitted',
      status: 'application submitted',
      submittedAt: '2026-02-02',
      previewOnly: true
    }
  ],
  'sfcc-registration': [
    {
      applicationId: 'APP-SFCC-9031',
      serviceKey: 'sfcc-registration',
      service: 'SFCC Registration',
      workflowStageTitle: 'Awaiting Payment',
      status: 'awaiting payment',
      submittedAt: '2026-02-15',
      previewOnly: true
    },
    {
      applicationId: 'APP-SFCC-9028',
      serviceKey: 'sfcc-registration',
      service: 'SFCC Registration',
      workflowStageTitle: 'Screening In Progress',
      status: 'screening in progress',
      submittedAt: '2026-02-10',
      previewOnly: true
    },
    {
      applicationId: 'APP-SFCC-9016',
      serviceKey: 'sfcc-registration',
      service: 'SFCC Registration',
      workflowStageTitle: 'Certificate Issued',
      status: 'certificate issued',
      submittedAt: '2026-01-29',
      previewOnly: true
    }
  ],
  'legal-opinion': [
    {
      applicationId: 'APP-LEG-4483',
      serviceKey: 'legal-opinion',
      service: 'Legal Opinion',
      workflowStageTitle: 'Assigned For Screening',
      status: 'assigned for screening',
      submittedAt: '2026-02-12',
      previewOnly: true
    },
    {
      applicationId: 'APP-LEG-4477',
      serviceKey: 'legal-opinion',
      service: 'Legal Opinion',
      workflowStageTitle: 'Under Vetting',
      status: 'under vetting',
      submittedAt: '2026-02-06',
      previewOnly: true
    },
    {
      applicationId: 'APP-LEG-4470',
      serviceKey: 'legal-opinion',
      service: 'Legal Opinion',
      workflowStageTitle: 'Opinion Issued',
      status: 'opinion issued',
      submittedAt: '2026-01-30',
      previewOnly: true
    }
  ],
  exemption: [
    {
      applicationId: 'APP-EXM-7711',
      serviceKey: 'exemption',
      service: 'Exemption',
      workflowStageTitle: 'Application Submitted',
      status: 'application submitted',
      submittedAt: '2026-02-15',
      previewOnly: true
    },
    {
      applicationId: 'APP-EXM-7706',
      serviceKey: 'exemption',
      service: 'Exemption',
      workflowStageTitle: 'Screening In Progress',
      status: 'screening in progress',
      submittedAt: '2026-02-09',
      previewOnly: true
    },
    {
      applicationId: 'APP-EXM-7692',
      serviceKey: 'exemption',
      service: 'Exemption',
      workflowStageTitle: 'Exemption Issued',
      status: 'exemption issued',
      submittedAt: '2026-01-24',
      previewOnly: true
    }
  ]
}

const defaultVolumeSeries = [
  { label: 'W1', value: 9 },
  { label: 'W2', value: 11 },
  { label: 'W3', value: 10 },
  { label: 'W4', value: 13 },
  { label: 'W5', value: 15 },
  { label: 'W6', value: 16 }
]

const defaultPipelineTable = [
  { stage: 'Intake', volume: 28, averageDays: 1.6, sla: '96%' },
  { stage: 'Screening', volume: 32, averageDays: 3.1, sla: '84%' },
  { stage: 'Payment', volume: 17, averageDays: 2.4, sla: '79%' },
  { stage: 'Vetting', volume: 16, averageDays: 5.9, sla: '73%' },
  { stage: 'Final Decision', volume: 39, averageDays: 2.8, sla: '89%' }
]

export const DEMO_OVERVIEW_ROWS = Object.values(serviceRows).flat()

export const OVERVIEW_INSIGHTS = {
  summary: 'Application command center for all applicant services.',
  stats: [
    { label: 'Total Applications', value: 126, delta: '+11% this month' },
    { label: 'In Progress', value: 48, delta: '12 in screening' },
    { label: 'Pending Payments', value: 17, delta: 'TZS 18.3M pending' },
    { label: 'Issued Outcomes', value: 39, delta: '31% completion rate' }
  ],
  trend: [
    { label: 'Sep', value: 14 },
    { label: 'Oct', value: 18 },
    { label: 'Nov', value: 16 },
    { label: 'Dec', value: 22 },
    { label: 'Jan', value: 24 },
    { label: 'Feb', value: 32 }
  ],
  volumeSeries: defaultVolumeSeries,
  statusBreakdown: [
    { label: 'Screening', count: 32, color: '#0ea5e9' },
    { label: 'Awaiting Payment', count: 17, color: '#f59e0b' },
    { label: 'Under Vetting', count: 16, color: '#6366f1' },
    { label: 'Issued', count: 39, color: '#10b981' },
    { label: 'Submitted', count: 22, color: '#94a3b8' }
  ],
  progressMilestones: [
    { label: 'Submission Completeness', percent: 92 },
    { label: 'SLA Compliance', percent: 81 },
    { label: 'Payment Resolution', percent: 74 },
    { label: 'Decision Turnaround', percent: 68 }
  ],
  pipelineTable: defaultPipelineTable,
  healthScore: 79
}

const serviceInsights = {
  'trademark-recordation': {
    summary: 'Trademark filing load and mark-class processing progress.',
    stats: [
      { label: 'Total Filings', value: 34, delta: '+7 this month' },
      { label: 'Pending Payment', value: 6, delta: 'TZS 2.1M pending' },
      { label: 'Under Review', value: 12, delta: 'Avg 4.2 days' },
      { label: 'Issued', value: 11, delta: '32% issued' }
    ],
    trend: [
      { label: 'Sep', value: 3 },
      { label: 'Oct', value: 5 },
      { label: 'Nov', value: 4 },
      { label: 'Dec', value: 6 },
      { label: 'Jan', value: 7 },
      { label: 'Feb', value: 9 }
    ],
    volumeSeries: [
      { label: 'W1', value: 2 },
      { label: 'W2', value: 4 },
      { label: 'W3', value: 3 },
      { label: 'W4', value: 5 },
      { label: 'W5', value: 6 },
      { label: 'W6', value: 7 }
    ],
    statusBreakdown: [
      { label: 'Screening', count: 10, color: '#0ea5e9' },
      { label: 'Awaiting Payment', count: 6, color: '#f59e0b' },
      { label: 'Vetting', count: 7, color: '#6366f1' },
      { label: 'Issued', count: 11, color: '#10b981' }
    ],
    progressMilestones: [
      { label: 'Classification Validation', percent: 88 },
      { label: 'Ownership Verification', percent: 82 },
      { label: 'Publication Readiness', percent: 71 }
    ],
    pipelineTable: [
      { stage: 'Intake', volume: 8, averageDays: 1.3, sla: '98%' },
      { stage: 'Classification', volume: 10, averageDays: 3.8, sla: '83%' },
      { stage: 'Payment', volume: 6, averageDays: 2.1, sla: '81%' },
      { stage: 'Vetting', volume: 7, averageDays: 4.9, sla: '76%' },
      { stage: 'Issuance', volume: 11, averageDays: 2.4, sla: '90%' }
    ],
    healthScore: 78
  },
  'merger-clearance': {
    summary: 'Merger notification throughput and competition assessment status.',
    stats: [
      { label: 'Submitted Cases', value: 22, delta: '+4 this month' },
      { label: 'Economic Analysis', value: 8, delta: '3 high priority' },
      { label: 'Pending Payment', value: 4, delta: 'TZS 4.5M pending' },
      { label: 'Clearence Issued', value: 7, delta: '31% issued' }
    ],
    trend: [
      { label: 'Sep', value: 2 },
      { label: 'Oct', value: 3 },
      { label: 'Nov', value: 4 },
      { label: 'Dec', value: 4 },
      { label: 'Jan', value: 4 },
      { label: 'Feb', value: 5 }
    ],
    volumeSeries: [
      { label: 'W1', value: 2 },
      { label: 'W2', value: 2 },
      { label: 'W3', value: 3 },
      { label: 'W4', value: 3 },
      { label: 'W5', value: 4 },
      { label: 'W6', value: 4 }
    ],
    statusBreakdown: [
      { label: 'Submitted', count: 3, color: '#94a3b8' },
      { label: 'Screening', count: 5, color: '#0ea5e9' },
      { label: 'Vetting', count: 7, color: '#6366f1' },
      { label: 'Issued', count: 7, color: '#10b981' }
    ],
    progressMilestones: [
      { label: 'Market Definition', percent: 83 },
      { label: 'Competition Impact Review', percent: 76 },
      { label: 'Decision Drafting', percent: 69 }
    ],
    pipelineTable: [
      { stage: 'Submission', volume: 6, averageDays: 1.4, sla: '95%' },
      { stage: 'Economic Review', volume: 8, averageDays: 5.4, sla: '72%' },
      { stage: 'Payment', volume: 4, averageDays: 2.6, sla: '80%' },
      { stage: 'Panel Vetting', volume: 7, averageDays: 6.8, sla: '68%' },
      { stage: 'Decision', volume: 7, averageDays: 3.3, sla: '86%' }
    ],
    healthScore: 74
  },
  'sfcc-registration': {
    summary: 'SFCC registration processing load and contract approval flow.',
    stats: [
      { label: 'Active Requests', value: 41, delta: '+6 this month' },
      { label: 'Pending Payment', value: 5, delta: 'TZS 1.3M pending' },
      { label: 'In Vetting', value: 14, delta: 'Avg 5.1 days' },
      { label: 'Certificates Issued', value: 15, delta: '37% issued' }
    ],
    trend: [
      { label: 'Sep', value: 5 },
      { label: 'Oct', value: 6 },
      { label: 'Nov', value: 6 },
      { label: 'Dec', value: 7 },
      { label: 'Jan', value: 8 },
      { label: 'Feb', value: 9 }
    ],
    volumeSeries: [
      { label: 'W1', value: 5 },
      { label: 'W2', value: 6 },
      { label: 'W3', value: 6 },
      { label: 'W4', value: 7 },
      { label: 'W5', value: 8 },
      { label: 'W6', value: 9 }
    ],
    statusBreakdown: [
      { label: 'Screening', count: 11, color: '#0ea5e9' },
      { label: 'Awaiting Payment', count: 5, color: '#f59e0b' },
      { label: 'Vetting', count: 10, color: '#6366f1' },
      { label: 'Issued', count: 15, color: '#10b981' }
    ],
    progressMilestones: [
      { label: 'Contract Risk Screening', percent: 86 },
      { label: 'Compliance Validation', percent: 80 },
      { label: 'Issuance Queue', percent: 73 }
    ],
    pipelineTable: [
      { stage: 'Submission', volume: 12, averageDays: 1.5, sla: '97%' },
      { stage: 'Screening', volume: 11, averageDays: 3.9, sla: '82%' },
      { stage: 'Payment', volume: 5, averageDays: 2.1, sla: '86%' },
      { stage: 'Vetting', volume: 10, averageDays: 5.2, sla: '74%' },
      { stage: 'Certificate', volume: 15, averageDays: 2.6, sla: '91%' }
    ],
    healthScore: 82
  },
  'legal-opinion': {
    summary: 'Legal opinion request queue and advisory issuance progress.',
    stats: [
      { label: 'Open Requests', value: 17, delta: '+2 this month' },
      { label: 'Drafting', value: 6, delta: '4 under legal review' },
      { label: 'Pending Payment', value: 2, delta: 'TZS 0.4M pending' },
      { label: 'Opinions Issued', value: 8, delta: '47% issued' }
    ],
    trend: [
      { label: 'Sep', value: 2 },
      { label: 'Oct', value: 2 },
      { label: 'Nov', value: 3 },
      { label: 'Dec', value: 3 },
      { label: 'Jan', value: 3 },
      { label: 'Feb', value: 4 }
    ],
    volumeSeries: [
      { label: 'W1', value: 1 },
      { label: 'W2', value: 2 },
      { label: 'W3', value: 2 },
      { label: 'W4', value: 3 },
      { label: 'W5', value: 3 },
      { label: 'W6', value: 4 }
    ],
    statusBreakdown: [
      { label: 'Assigned', count: 4, color: '#94a3b8' },
      { label: 'Screening', count: 3, color: '#0ea5e9' },
      { label: 'Drafting', count: 2, color: '#6366f1' },
      { label: 'Issued', count: 8, color: '#10b981' }
    ],
    progressMilestones: [
      { label: 'Issue Classification', percent: 91 },
      { label: 'Legal Analysis', percent: 77 },
      { label: 'Opinion Approval', percent: 71 }
    ],
    pipelineTable: [
      { stage: 'Submission', volume: 4, averageDays: 1.4, sla: '98%' },
      { stage: 'Triage', volume: 3, averageDays: 2.8, sla: '88%' },
      { stage: 'Drafting', volume: 2, averageDays: 6.1, sla: '73%' },
      { stage: 'Review', volume: 3, averageDays: 4.7, sla: '76%' },
      { stage: 'Opinion Issued', volume: 8, averageDays: 2.2, sla: '93%' }
    ],
    healthScore: 81
  },
  exemption: {
    summary: 'Exemption applications and approval pipeline performance.',
    stats: [
      { label: 'Applications', value: 12, delta: '+3 this month' },
      { label: 'Pending Review', value: 5, delta: '2 priority' },
      { label: 'Pending Payment', value: 2, delta: 'TZS 0.8M pending' },
      { label: 'Exemptions Issued', value: 4, delta: '33% issued' }
    ],
    trend: [
      { label: 'Sep', value: 1 },
      { label: 'Oct', value: 2 },
      { label: 'Nov', value: 2 },
      { label: 'Dec', value: 2 },
      { label: 'Jan', value: 2 },
      { label: 'Feb', value: 3 }
    ],
    volumeSeries: [
      { label: 'W1', value: 1 },
      { label: 'W2', value: 1 },
      { label: 'W3', value: 2 },
      { label: 'W4', value: 2 },
      { label: 'W5', value: 2 },
      { label: 'W6', value: 3 }
    ],
    statusBreakdown: [
      { label: 'Submitted', count: 2, color: '#94a3b8' },
      { label: 'Screening', count: 3, color: '#0ea5e9' },
      { label: 'Vetting', count: 3, color: '#6366f1' },
      { label: 'Issued', count: 4, color: '#10b981' }
    ],
    progressMilestones: [
      { label: 'Grounds Evaluation', percent: 79 },
      { label: 'Public Interest Test', percent: 73 },
      { label: 'Commission Approval', percent: 66 }
    ],
    pipelineTable: [
      { stage: 'Submission', volume: 3, averageDays: 1.2, sla: '97%' },
      { stage: 'Screening', volume: 3, averageDays: 3.5, sla: '81%' },
      { stage: 'Payment', volume: 2, averageDays: 2.9, sla: '75%' },
      { stage: 'Vetting', volume: 3, averageDays: 5.4, sla: '69%' },
      { stage: 'Decision', volume: 4, averageDays: 3.1, sla: '85%' }
    ],
    healthScore: 72
  }
}

export function getServiceInsight(serviceKey) {
  return (
    serviceInsights[serviceKey] || {
      summary: `${getApplicationServiceLabel(serviceKey)} analytics preview`,
      stats: OVERVIEW_INSIGHTS.stats,
      trend: OVERVIEW_INSIGHTS.trend,
      volumeSeries: OVERVIEW_INSIGHTS.volumeSeries,
      statusBreakdown: OVERVIEW_INSIGHTS.statusBreakdown,
      progressMilestones: OVERVIEW_INSIGHTS.progressMilestones,
      pipelineTable: OVERVIEW_INSIGHTS.pipelineTable,
      healthScore: OVERVIEW_INSIGHTS.healthScore
    }
  )
}

export function getDemoServiceRows(serviceKey) {
  return serviceRows[serviceKey] || []
}
