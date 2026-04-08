export const FIELD_HELP = Object.freeze({
  sector: 'The primary industry sector your business operates in (e.g., Manufacturing, Retail, Agriculture).',
  dateReceived: 'The date this application is being filed with FCC.',
  applicationFee: 'The statutory fee for this application type, calculated based on service rules.',
  businessDescription: 'A brief summary of your business activities, products, and services.',
  transactionType: 'Select whether this is a Merger (combining entities), Acquisition (one entity purchasing another), or Joint Venture (creating a new entity).',
  partiesInvolved: 'List all companies and individuals involved in this transaction.',
  estimatedTurnover: 'The combined annual turnover of all parties in Tanzanian Shillings.',
  transactionValue: 'The total value of the merger/acquisition transaction in Tanzanian Shillings.',
  targetFirmName: 'The legal name of the company being acquired or merging.',
  targetFirmBusiness: 'Description of what the target firm does — products, services, and markets.',
  acquisitionDescription: 'Explain the nature and structure of the acquisition — what is being acquired (shares, assets, business).',
  commercialRationale: 'The business reasons for pursuing this transaction (e.g., market expansion, synergies, vertical integration).',
  relevantMarketDefinition: 'Define the relevant product and geographic markets where the merging parties compete or operate.',
  confidentialityStatement: 'If claiming confidentiality under FCC-2, provide the basis and scope of the claim.',
  requestType: 'The type of trademark action you are requesting — new registration, renewal, transfer, etc.',
  ownerFullName: 'The full legal name of the trademark rights holder.',
  ownerBusinessAddress: 'The registered business address of the trademark owner.',
  ownerNationalityOrJurisdiction: 'The country of nationality or legal jurisdiction of the trademark owner.',
  declarationAccepted: 'You must accept the declaration confirming the accuracy of all information provided.',
  contractCategory: 'The category of the contract being registered (e.g., Distribution, Supply, Franchise).',
  targetMarket: 'The geographic or sector market this contract operates in.',
  consumerImpactSummary: 'Describe the expected impact of this contract on consumers and competition.',
  legalIssueCategory: 'The category of legal issue — Competition, Consumer Protection, Procedural, or Other.',
  questionSummary: 'A brief summary of the legal question or issue requiring FCC opinion.',
  supportingFacts: 'The key facts and circumstances relevant to the legal question.',
  exemptionType: 'Whether this is a Block Exemption, Individual Exemption, or Temporary Exemption.',
  legalBasis: 'The legal grounds and statutory provisions supporting the exemption request.',
  validityPeriodMonths: 'The number of months for which the exemption is being requested.'
})

export function getFieldHelp(key) {
  return FIELD_HELP[key] || null
}
