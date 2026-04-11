/**
 * FCC-8 Merger Notification — Step definitions, factory functions, and initial state.
 *
 * Government Notice No. 344 FCC.8
 * Fair Competition Commission — Competition Rules 2018 — Rule 33(2)
 */

// ════════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS — produce empty default objects matching schema
// ════════════════════════════════════════════════════════════════════

export const mk = {
  addr: () => ({ street: '', city: '', region: '', postalCode: '', country: '' }),
  tzAddr: () => ({ street: '', city: '', region: '', postalCode: '', country: 'Tanzania' }),
  contact: () => ({ contactPerson: '', phone: '', email: '', address: '' }),
  contactPerson: () => ({ fullName: '', position: '', phone: '', email: '' }),
  prodSvc: () => ({ name: '', category: '', description: '' }),
  shareholder: () => ({ name: '', shareholdingPercentage: 0, shareType: '', nationality: '' }),
  relBody: () => ({
    name: '', relationshipType: '', placeOfIncorporation: '',
    registeredOffice: '', principalBusiness: '', ownershipPercentage: 0
  }),
  individual: () => ({
    fullName: '', nationalId: '', nationality: '', occupation: '',
    phone: '', email: '', physicalAddress: mk.addr()
  }),
  supplier: () => ({
    name: '', contactDetails: mk.contact(), location: '', areasSuppliedTo: [],
    size: '', goodsAndServicesSupplied: '', estimatedValue: 0, currency: '', suppliesTo: ''
  }),
  altSupplier: () => ({
    name: '', contactDetails: mk.contact(), location: '', areasSuppliedTo: [],
    size: '', productsOrServices: '', estimatedValueOfSupply: 0, currency: '',
    competitiveWithWhichParty: [], currentOrFuture: ''
  }),
  customer: () => ({
    name: '', contactDetails: mk.contact(), size: '', customerOf: '',
    goodsAndServicesPurchased: '', valueOfPurchases: 0, currency: ''
  }),
  supplyArrangement: () => ({
    customerName: '', mergerPartyName: '', contractDuration: '',
    exclusivity: { isExclusive: false, description: '' },
    rebatesAndDiscounts: { hasRebates: false, description: '' },
    supplyVolumes: '', willContinuePostAcquisition: null, anticipatedVariations: ''
  }),
  purchArrangement: () => ({
    supplierName: '', mergerPartyName: '', arrangementDescription: '',
    contractDuration: '', exclusivity: '', willContinuePostAcquisition: null,
    anticipatedVariationsPostAcquisition: ''
  }),
  histImport: () => ({ year: 0, importVolume: 0, importValue: 0, unit: '', currency: '', source: '' }),
  histExport: () => ({ year: 0, exportVolume: 0, exportValue: 0, unit: '', currency: '', source: '' }),
  priceComp: () => ({
    product: '', domesticPrice: 0, importPrice: 0, freightCost: 0,
    customsDuties: 0, otherCosts: 0, currency: '', divergenceExplanation: ''
  }),
  barrier: () => ({ barrierType: '', description: '', severity: '' }),
  potentialEntrant: () => ({
    firmName: '', currentBusiness: '', capabilityToEnter: '',
    estimatedTimeToEntry: '', competitiveConstraintDescription: ''
  }),
  coopAgreement: () => ({
    agreementType: '', subjectMatter: '', parties: [], duration: '',
    willContinuePostAcquisition: null, description: ''
  }),
  relationship: () => ({
    relationshipType: '', description: '', partiesInvolved: [], natureOfRelationship: ''
  }),
  pastAcq: () => ({
    acquirer: '', targetName: '', dateOfAcquisition: '', industrySector: '',
    description: '', value: 0, currency: ''
  }),
  relevantMarket: () => ({
    marketName: '', marketType: '',
    productDimension: { description: '', products: [], substituteSources: [], demandSideSubstitutability: '', supplySideSubstitutability: '' },
    functionalDimension: { description: '', verticalStages: [], arenaOfCompetition: '' },
    geographicDimension: { description: '', areas: [], customerAccessAreas: [] },
    timeDimension: { description: '', substitutionPeriod: '' }
  }),
  jurisdictionNotif: () => ({
    jurisdiction: '', competitionAuthority: '', notificationStatus: '',
    notificationDate: '', referenceNumber: '', outcome: ''
  }),
  signatory: () => ({ signature: '', fullName: '', officeHeld: '' }),
  declSignatory: () => ({ signature: '', fullName: '', officeHeld: '', isLegalCounsel: false, legalCounselDetails: '' }),

  acquiringFirm: () => ({
    acquiringFirmType: '', individualDetails: mk.individual(),
    bodyCorporateDetails: { companyName: '', registrationNumber: '', placeOfIncorporation: '', registeredOffice: mk.addr() },
    businessDescription: { description: '', productsAndServices: [] },
    ownershipStructure: { shareholders: [], otherInterests: '', mostRecentAnnualReportAttached: false },
    relatedBodiesCorporate: [], tanzaniaServiceAddress: mk.tzAddr(),
    beneficialOwner: { hasBeneficialOwner: false, name: '', address: mk.addr(), relationshipToAcquiringFirm: '' },
    acquisitionDetails: {
      acquisitionType: '',
      shares: { numberOfShares: 0, shareType: '', percentageOfIssuedCapital: 0, description: '' },
      assets: { description: '' }, business: { description: '' }
    }
  })
}

// ════════════════════════════════════════════════════════════════════
// INITIAL FORM STATE — matches FCC-8 Mongoose schema
// ════════════════════════════════════════════════════════════════════

export function createInitialFormState() {
  return {
    applicant: {
      applicantType: '', applicantRole: '', actsOnBehalfOf: '',
      individualDetails: mk.individual(),
      companyDetails: {
        companyName: '', registrationNumber: '', placeOfIncorporation: '',
        registeredOffice: mk.addr(), contactPerson: mk.contactPerson()
      },
      tanzaniaServiceAddress: mk.tzAddr()
    },
    acquiringFirms: [mk.acquiringFirm()],
    targetFirm: {
      targetType: '', isRegisteredInTanzania: true,
      bodyCorporateDetails: {
        name: '', placeOfIncorporation: '', registeredOffice: mk.addr(),
        businessDescription: { description: '', productsAndServices: [] },
        sharesOrAssetsToBeAcquired: {
          acquisitionType: '',
          shares: { numberOfShares: 0, shareType: '', percentageOfIssuedCapital: 0, description: '' },
          assets: { description: '' }
        }
      },
      individualDetails: {
        fullName: '', nationalId: '', nationality: '', phone: '', email: '',
        address: mk.addr(),
        businessDescription: { description: '', productsAndServices: [] },
        assetsToBeAcquired: ''
      },
      issuedCapitalDetails: {
        totalIssuedCapital: { amount: 0, currency: '', numberOfShares: 0, shareClasses: [] },
        capitalHolders: []
      },
      ownershipStructure: { shareholders: [], otherInterests: '', mostRecentAnnualReportAttached: false },
      relatedBodiesCorporate: []
    },
    localNexus: {
      isApplicable: false, companyName: '', registrationNumber: '', tinNumber: '',
      dateOfRegistration: '', registeredOffice: mk.tzAddr(),
      relationshipToTarget: '', relationshipDescription: '', ownershipByTarget: 0,
      businessDescription: { description: '', productsAndServices: [] },
      impactOfMerger: '', contactPerson: mk.contactPerson(),
      ownershipStructure: { shareholders: [] }, relatedBodiesCorporateInTanzania: []
    },
    acquisition: {
      natureAndDetails: {
        description: '', contractType: '', dateOfContract: '', intendedConsummationDate: '',
        consideration: { amount: 0, currency: '', form: '', description: '' },
        publicOfferDocumentAttached: false, contractCopyAttached: false, supportingDocuments: []
      },
      commercialRationale: { description: '', evaluationDocuments: [], marketsAffected: [] },
      ancillaryArrangements: { involvesAncillaryArrangements: false, arrangements: [] }
    },
    backgroundInformation: {
      industrySectors: { description: '', sectors: [] },
      areasOfOverlap: { description: '', productOverlaps: [], geographicOverlaps: [] },
      pastAcquisitions: { mergerPartyAcquisitions: [], otherIndustryAcquisitions: [] },
      existingRelationships: { description: '', relationships: [] },
      cooperativeAgreements: []
    },
    marketDefinition: { description: '', relevantMarkets: [] },
    suppliersForInputs: { partyInputs: [], suppliers: [], purchasingArrangements: [] },
    competitors: { alternativeSuppliers: [], viableAlternativesExplanation: '' },
    customers: { customers: [], distributionChannels: { description: '', channels: [] }, supplyArrangements: [] },
    marketConcentration: { description: '', marketShareEstimates: [] },
    constraintsOnMarketPower: {
      supplierConstraints: { description: '', supplierSwitchingAbility: '', competitorCapacityToIncreaseSupply: '' },
      competitorConstraints: { description: '', customerSwitchingEase: '', switchingCosts: '', productHomogeneityOrDifferentiation: '', brandLoyalty: '' },
      customerConstraints: { description: '', countervailingPower: '', participantsWithCountervailingPower: [], extentOfConstraintPostAcquisition: '' },
      otherConstraints: { description: '' }
    },
    imports: {
      importLevels: { description: '', importers: [], historicalImportLevels: [], transportOptions: [], transportCosts: '', productCharacteristics: { valueLevel: '', densityLevel: '', durabilityForTransport: '' }, dataSource: '' },
      importBarriers: { description: '', requiresSignificantInvestment: false },
      importFacilities: { description: '', facilities: [] },
      importPricing: { description: '', priceComparisons: [] },
      importConstraintPostAcquisition: { description: '' }
    },
    exports: {
      exportLevels: { description: '', historicalExportLevels: [], likelyExportMarkets: [], transportOptions: [], transportCosts: '', dataSource: '' },
      exportBarriers: { description: '', barriers: [] },
      exportPricing: { description: '', priceComparisons: [] },
      supplierExportAbility: { description: '', canSuppliersExportPostAcquisition: null, extentOfConstraintOnMergerParties: '' },
      existingExporters: []
    },
    barriersToEntryAndExpansion: {
      barriers: {
        naturalBarriers: { description: '', barriers: [] },
        strategicBarriers: { description: '', barriers: [] },
        regulatoryAndPolicyBarriers: { description: '', barriers: [] },
        sunkCostsInProductionCapacity: '', accessToShelfSpace: '', advertisingAndPromotion: '',
        regulatoryRestrictions: '', requirementsForScarceInputs: '', brandLoyalty: '',
        minimumEfficientScale: '', goodwill: '', accessToIntellectualProperty: '',
        potentialResponseOfIncumbents: '', timeForNewEntrantToEstablish: '',
        incentivesForNewEntry: '', disincentivesForNewEntry: ''
      },
      entryExitExpansionHistory: [], potentialEntrants: [], failedEntrants: []
    },
    dynamicCharacteristics: { description: '', growth: '', levelsOfInnovation: '', technologicalChange: '', productAndServiceDifferentiation: '' },
    vigorousAndEffectiveCompetitor: {
      description: '',
      targetAsCompetitor: {
        isVigorousAndEffective: null, extent: '', reasons: '',
        currentAndHistoricalPricingBehavior: '', purchasingBehavior: '',
        innovationRecord: '', growthRelativeToMarket: '', historyOfIndependentBehavior: ''
      },
      otherVigorousCompetitors: []
    },
    verticalIntegration: {
      increasedVerticalIntegration: { description: '', wouldResultInIncreasedVerticalIntegration: null, functionalLevelsAffected: [], existingVerticalRelationships: [] },
      foreclosureRisk: { description: '', wouldLimitSupplyOfInputs: null, wouldLimitAccessToDistribution: null, downstreamRivalsImpact: '', upstreamRivalsImpact: '' }
    },
    pricesAndProfitMargins: {
      pricingLevels: { description: '', priceData: [] },
      supplyCosts: { description: '', partyCosts: [] },
      competitiveConstraintsOnPricing: { description: '' },
      coordinatedConduct: { description: '', numberOfParticipants: 0, transparencyInMarket: '', homogeneityOfFirms: '', sizeAndFrequencyOfPurchases: '', multiMarketPresence: '' },
      profitMarginImpact: { description: '', expectedChangeInProfitMargins: '', expectedCauseOfChange: '' }
    },
    relatedMarkets: {
      complementarities: { description: '', complementaryProducts: [] },
      bundlingAndTying: {
        description: '',
        pureBundling: { exists: false, description: '', products: [] },
        mixedBundling: { exists: false, description: '' },
        tying: { exists: false, description: '', tyingProduct: '', tiedProduct: '' }
      },
      constraintsOnBundlingForeclosure: { description: '' }
    },
    otherGroundsForClearance: { description: '', grounds: [] },
    counterfactual: { description: '', reasons: '' },
    international: {
      internationalDimensions: {
        foreignParentInTanzania: { applicable: null, details: '' },
        tanzanianAffectedByOverseasConduct: { applicable: null, details: '' },
        foreignAffectedByTanzanianConduct: { applicable: null, details: '' },
        crossBorderConduct: { applicable: null, details: '' }
      },
      otherJurisdictionNotifications: []
    },
    undertaking: {
      companyName: '', companyAddress: '', acknowledgesPublicInspection: false,
      signatories: [], executionDate: { day: 0, month: '', year: 0 }
    },
    furtherInformation: {
      fullName: '', postalAddress: '', telephone: '', facsimile: '',
      email: '', relationshipToApplicant: ''
    },
    targetFirmInformationConfirmation: {
      targetFirmConsulted: false, confirmation: '',
      targetFirmSignatory: mk.declSignatory()
    },
    declaration: {
      signatories: [mk.declSignatory(), mk.declSignatory()],
      declarationDate: { day: 0, month: '', year: 0 }
    }
  }
}

// ════════════════════════════════════════════════════════════════════
// STEP DEFINITIONS
// ════════════════════════════════════════════════════════════════════

export const STEPS = [
  { id: 'applicant', label: 'Applicant', fcc: '—', desc: 'Entity filing this merger notification.' },
  { id: 'acquiringFirms', label: 'Acquiring Firm(s)', fcc: 'S.1', desc: 'Entities performing the acquisition.' },
  { id: 'targetFirm', label: 'Target Firm', fcc: 'S.2', desc: 'Entity being acquired.' },
  { id: 'localNexus', label: 'Local Nexus', fcc: '—', desc: 'Tanzanian subsidiary/branch.', conditional: true },
  { id: 'acquisition', label: 'The Acquisition', fcc: 'S.3', desc: 'Nature and details of the transaction.' },
  { id: 'background', label: 'Background Info', fcc: 'S.4', desc: 'Industry sectors, overlaps, relationships.' },
  { id: 'marketDef', label: 'Market Definition', fcc: 'S.5', desc: 'Product, functional, geographic and time dimensions.' },
  { id: 'suppliers', label: 'Suppliers', fcc: 'S.6', desc: 'Suppliers of inputs to the merger parties.' },
  { id: 'competitors', label: 'Competitors', fcc: 'S.7', desc: 'Alternative suppliers and viable alternatives.' },
  { id: 'customers', label: 'Customers', fcc: 'S.8', desc: 'Customer base and distribution channels.' },
  { id: 'concentration', label: 'Market Concentration', fcc: 'S.9', desc: 'Current and post-acquisition market shares.' },
  { id: 'constraints', label: 'Market Power', fcc: 'S.10', desc: 'Constraints on the exercise of market power.' },
  { id: 'imports', label: 'Imports', fcc: 'S.11', desc: 'Import levels, barriers, and pricing.' },
  { id: 'exports', label: 'Exports', fcc: 'S.12', desc: 'Export levels, barriers, and pricing.' },
  { id: 'barriers', label: 'Barriers to Entry', fcc: 'S.13', desc: 'Natural, strategic, and regulatory barriers.' },
  { id: 'dynamics', label: 'Dynamics', fcc: 'S.14', desc: 'Growth, innovation, technological change.' },
  { id: 'vigorous', label: 'Vigorous Competitor', fcc: 'S.15', desc: 'Vigorous and effective competitor assessment.' },
  { id: 'vertical', label: 'Vertical Integration', fcc: 'S.16', desc: 'Vertical integration and foreclosure risk.' },
  { id: 'prices', label: 'Prices & Margins', fcc: 'S.17', desc: 'Pricing levels, costs, coordinated conduct.' },
  { id: 'related', label: 'Related Markets', fcc: 'S.18', desc: 'Complementarities, bundling, tying.' },
  { id: 'otherGrounds', label: 'Other Grounds', fcc: 'S.19', desc: 'Additional grounds for clearance.' },
  { id: 'counterfactual', label: 'Counterfactual', fcc: 'S.20', desc: 'State of market without acquisition.' },
  { id: 'international', label: 'International', fcc: 'S.21', desc: 'International dimensions and notifications.' },
  { id: 'attachments', label: 'Attachments', fcc: 'S.22', desc: 'Required supporting documents.' },
  { id: 'mergerFees', label: 'Merger Fees', fcc: 'R.68', desc: 'Provisional declaration of merger filing fees — Rule 68(2).' },
  { id: 'undertaking', label: 'Undertaking & Decl.', fcc: 'S.23-26', desc: 'Undertaking, contacts, and declaration.' },
  { id: 'review', label: 'Review & Submit', fcc: '—', desc: 'Verify and submit your application.' }
]

// ════════════════════════════════════════════════════════════════════
// SELECT OPTIONS
// ════════════════════════════════════════════════════════════════════

export const APPLICANT_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'company', label: 'Company' },
  { value: 'lawFirm', label: 'Law Firm' }
]

export const APPLICANT_ROLES = [
  { value: 'acquiringFirm', label: 'Is an Acquiring Firm' },
  { value: 'targetFirm', label: 'Is the Target Firm' },
  { value: 'representative', label: 'Third-party Representative' }
]

export const ENTITY_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'bodyCorporate', label: 'Body Corporate' }
]

export const ACQUISITION_TYPES = [
  { value: 'shares', label: 'Shares' },
  { value: 'assets', label: 'Assets' },
  { value: 'business', label: 'Business' },
  { value: 'sharesAndAssets', label: 'Shares & Assets' }
]

export const CONTRACT_TYPES = [
  { value: 'contract', label: 'Contract' },
  { value: 'arrangement', label: 'Arrangement' },
  { value: 'understanding', label: 'Understanding' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'publicOffer', label: 'Public Offer' }
]

export const CONSIDERATION_FORMS = [
  { value: 'cash', label: 'Cash' },
  { value: 'shares', label: 'Shares' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'other', label: 'Other' }
]

export const SIZES = [
  { value: 'large', label: 'Large' },
  { value: 'medium', label: 'Medium' },
  { value: 'small', label: 'Small' }
]

export const REL_BODY_TYPES = [
  { value: 'holdingCompany', label: 'Holding Company' },
  { value: 'subsidiary', label: 'Subsidiary' },
  { value: 'subsidiaryOfHoldingCompany', label: 'Subsidiary of Holding Co.' }
]

export const LOCAL_NEXUS_RELATIONSHIPS = [
  { value: 'subsidiary', label: 'Subsidiary' },
  { value: 'branch', label: 'Branch' },
  { value: 'affiliate', label: 'Affiliate' },
  { value: 'jointVenture', label: 'Joint Venture' },
  { value: 'other', label: 'Other' }
]

export const NOTIFICATION_STATUSES = [
  { value: 'notified', label: 'Notified' },
  { value: 'intended', label: 'Intended' },
  { value: 'pending', label: 'Pending' }
]

export const JURISDICTION_OUTCOMES = [
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'conditionallyApproved', label: 'Conditionally Approved' },
  { value: 'rejected', label: 'Rejected' }
]

export const SUPPLIES_TO_OPTIONS = [
  { value: 'acquiringFirm', label: 'Acquiring Firm' },
  { value: 'targetFirm', label: 'Target Firm' },
  { value: 'localNexus', label: 'Local Nexus' }
]

export const SEVERITY_OPTIONS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
]

// ════════════════════════════════════════════════════════════════════
// MERGER FEE TIERS — Rule 68(2) of Competition Rules 2018
// ════════════════════════════════════════════════════════════════════

export const MERGER_FEE_TIERS = [
  { min: 3_500_000_000, max: 25_000_000_000, fee: 25_000_000, rule: '68(2)(a)', label: 'TZS 3.5B – 25B' },
  { min: 25_000_000_001, max: 99_999_999_999, fee: 50_000_000, rule: '68(2)(b)', label: '>TZS 25B – <100B' },
  { min: 100_000_000_000, max: Infinity, fee: 100_000_000, rule: '68(2)(c)', label: 'TZS 100B+' },
]

export function calculateMergerFee(value) {
  const tier = MERGER_FEE_TIERS.find(t => value >= t.min && value <= t.max)
  return tier ? { fee: tier.fee, rule: tier.rule, label: tier.label } : null
}
