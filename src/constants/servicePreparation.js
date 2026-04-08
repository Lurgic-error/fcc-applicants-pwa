export const SERVICE_PREPARATION = Object.freeze({
  'trademark-recordation': {
    title: 'Trademark Recordation — Preparation Checklist',
    description: 'Gather these documents and information before starting your trademark application.',
    estimatedTime: '15-30 minutes to complete the form',
    checklist: [
      { label: 'Certified current trademark registration certificate', required: true, tip: 'Must be certified by the registering authority.' },
      { label: 'Evidence of title (assignment, license, or succession)', required: true, tip: 'Original or certified copy showing how ownership was obtained.' },
      { label: 'High-resolution trademark visuals/images', required: true, tip: 'Clear images of the mark as registered. Minimum 300 DPI.' },
      { label: 'Completed FCC Form 1 (for new recordation)', required: false, tip: 'Download the form, fill it, and upload during the application.' },
      { label: 'Power of Attorney (if using an agent)', required: false, tip: 'Required only if a third-party agent is filing on behalf of the owner.' },
      { label: 'Owner company registration certificate', required: true, tip: 'Business registration or certificate of incorporation.' },
      { label: 'Owner TIN certificate', required: true, tip: 'Tax Identification Number certificate from TRA.' }
    ],
    forms: [
      { label: 'FCC Form 1 — Application for Recordation', filename: 'FCC_Form_1.pdf' },
      { label: 'FCC Form 2 — Transfer of Ownership', filename: 'FCC_Form_2.pdf' }
    ],
    fees: [
      { type: 'New Recordation', amount: 'TZS 200,000' },
      { type: 'Renewal', amount: 'TZS 50,000' },
      { type: 'Alteration', amount: 'TZS 100,000' },
      { type: 'Ownership Change', amount: 'TZS 150,000' },
      { type: 'Name Change', amount: 'TZS 100,000' },
      { type: 'Agent Appointment', amount: 'No fee' },
      { type: 'Discontinuation', amount: 'No fee' }
    ]
  },
  'merger-clearance': {
    title: 'Merger Clearance (FCC-8) — Preparation Checklist',
    description: 'The FCC-8 merger notification is comprehensive. Prepare these items in advance.',
    estimatedTime: '1-3 hours to complete all 26 sections',
    checklist: [
      { label: 'Acquiring firm company registration details', required: true, tip: 'Registration number, place of incorporation, registered office.' },
      { label: 'Target firm company registration details', required: true, tip: 'Same details for the entity being acquired.' },
      { label: 'Transaction value and consideration details', required: true, tip: 'Total value in TZS, form of payment.' },
      { label: 'Ownership structure of both firms', required: true, tip: 'Shareholder lists with percentage holdings.' },
      { label: 'Market share estimates', required: true, tip: 'Current market shares in relevant markets.' },
      { label: 'List of top 5 suppliers and customers', required: true, tip: 'With contact details, purchase/supply values.' },
      { label: 'Most recent annual reports', required: true, tip: 'For both acquiring and target firms.' },
      { label: 'Signed copy of transaction agreement', required: true, tip: 'Sale/purchase agreement, share transfer agreement.' },
      { label: 'Confidentiality claim statement (if applicable)', required: false, tip: 'If claiming confidentiality on any information.' }
    ],
    forms: [{ label: 'FCC-8 — Merger Notification Form', filename: 'FCC_Form_8.pdf' }],
    fees: [{ type: 'Merger Clearance Filing Fee', amount: 'Based on transaction value' }]
  },
  'sfcc-registration': {
    title: 'SFCC Registration — Preparation Checklist',
    description: 'Prepare these for your Supply of Finished Consumer Commodities registration.',
    estimatedTime: '10-20 minutes',
    checklist: [
      { label: 'Company registration certificate', required: true, tip: 'BRELA certificate of incorporation.' },
      { label: 'TIN certificate', required: true, tip: 'Valid Tax Identification Number from TRA.' },
      { label: 'Contract/agreement details', required: true, tip: 'Category, target market, consumer impact.' },
      { label: 'Business license', required: true, tip: 'Valid business license for the relevant sector.' }
    ],
    forms: [],
    fees: [{ type: 'SFCC Registration Fee', amount: 'Per statutory schedule' }]
  },
  'legal-opinion': {
    title: 'Legal Opinion Request — Preparation Checklist',
    description: 'Prepare a clear summary of your legal question for FCC review.',
    estimatedTime: '10-15 minutes',
    checklist: [
      { label: 'Clear statement of the legal question', required: true, tip: 'What specific issue needs FCC opinion?' },
      { label: 'Supporting facts and documentation', required: true, tip: 'Relevant contracts, agreements, market data.' },
      { label: 'Applicable legal provisions', required: false, tip: 'Reference to Fair Competition Act sections if known.' }
    ],
    forms: [],
    fees: [{ type: 'Legal Opinion Request Fee', amount: 'Per statutory schedule' }]
  },
  'exemption': {
    title: 'Exemption Application — Preparation Checklist',
    description: 'Prepare your case for requesting an exemption from competition rules.',
    estimatedTime: '15-25 minutes',
    checklist: [
      { label: 'Description of the agreement/practice', required: true, tip: 'What arrangement requires exemption?' },
      { label: 'Legal basis for exemption', required: true, tip: 'Which provision supports the exemption?' },
      { label: 'Public interest justification', required: true, tip: 'How does this benefit consumers?' },
      { label: 'Duration of requested exemption', required: true, tip: 'How many months of exemption?' }
    ],
    forms: [],
    fees: [{ type: 'Exemption Application Fee', amount: 'Per statutory schedule' }]
  }
})

export function getServicePreparation(serviceKey) {
  return SERVICE_PREPARATION[serviceKey] || null
}
