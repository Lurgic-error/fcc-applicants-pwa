import { getApplicationServiceFields } from '@/constants/applicationProcesses'

const TRADEMARK_STEPS = [
  {
    key: 'requestType',
    label: 'Request Type',
    requiredFields: [
      { key: 'dateReceived', label: 'Submission Date' },
      { key: 'sector', label: 'Sector' },
      { key: 'trademarkRecordation.requestType', label: 'Request Type' }
    ]
  },
  {
    key: 'ownerTrademark',
    label: 'Owner & Trademark',
    requiredFields: [
      { key: 'contactEmail', label: 'Contact Email' },
      { key: 'phoneNumber', label: 'Phone Number' },
      { key: 'trademarkRecordation.ownerFullName', label: 'Owner Full Name' },
      { key: 'trademarkRecordation.ownerBusinessAddress', label: 'Owner Business Address' },
      { key: 'trademarkRecordation.ownerNationalityOrJurisdiction', label: 'Owner Nationality / Jurisdiction' }
    ]
  },
  {
    key: 'requestDetails',
    label: 'Request Details',
    requiredFields: []
  },
  {
    key: 'documents',
    label: 'Documents',
    requiredFields: []
  },
  {
    key: 'paymentDeclaration',
    label: 'Payment & Declaration',
    requiredFields: [
      { key: 'trademarkRecordation.declarationAccepted', label: 'Declaration Accepted' }
    ]
  }
]

function buildGenericSteps(serviceKey, applicantType) {
  const serviceFields = getApplicationServiceFields(serviceKey)
  const isFirm = applicantType === 'firm'

  const step0Fields = [
    { key: 'dateReceived', label: 'Submission Date' },
    { key: 'sector', label: 'Sector' },
    ...serviceFields
      .filter((f) => f.required)
      .map((f) => ({ key: f.key, label: f.label }))
  ]

  const step1Fields = isFirm
    ? [
        { key: 'companyName', label: 'Company Name' },
        { key: 'registrationNumber', label: 'Registration Number' },
        { key: 'contactPersonName', label: 'Contact Person Name' },
        { key: 'contactPersonEmail', label: 'Contact Person Email' },
        { key: 'contactPersonPhone', label: 'Contact Person Phone' }
      ]
    : [
        { key: 'firstName', label: 'First Name' },
        { key: 'surname', label: 'Surname' }
      ]

  const step2Fields = [
    { key: 'contactEmail', label: 'Contact Email' },
    { key: 'phoneNumber', label: 'Phone Number' },
    { key: 'postalAddress', label: 'Postal Address' },
    { key: 'physicalAddress', label: 'Physical Address' },
    { key: 'businessDescription', label: 'Business Description' }
  ]

  return [
    { key: 'application', label: 'Application', requiredFields: step0Fields },
    { key: 'applicant', label: 'Applicant', requiredFields: step1Fields },
    { key: 'contacts', label: 'Contacts', requiredFields: step2Fields }
  ]
}

function getNestedValue(obj, path) {
  if (!obj || !path) return undefined
  const keys = path.split('.')
  let current = obj
  for (const key of keys) {
    if (current == null) return undefined
    current = current[key]
  }
  return current
}

function isProvided(value) {
  if (value == null) return false
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return true
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return Boolean(value)
}

export function assessApplicationCompleteness(serviceKey, formData) {
  const data = formData || {}
  const applicantType = data.applicantType || 'firm'
  const isTrademarkService = serviceKey === 'trademark-recordation'

  const steps = isTrademarkService
    ? TRADEMARK_STEPS
    : buildGenericSteps(serviceKey, applicantType)

  let totalRequired = 0
  let totalProvided = 0

  const sections = steps.map((step, index) => {
    const missingFields = []
    let provided = 0
    const required = step.requiredFields.length

    for (const field of step.requiredFields) {
      const value = getNestedValue(data, field.key)
      if (isProvided(value)) {
        provided++
      } else {
        missingFields.push({ key: field.key, label: field.label })
      }
    }

    totalRequired += required
    totalProvided += provided

    let status = 'empty'
    if (required === 0) {
      status = 'complete'
    } else if (provided === required) {
      status = 'complete'
    } else if (provided > 0) {
      status = 'partial'
    }

    return {
      key: step.key,
      label: step.label,
      stepIndex: index,
      status,
      missingFields,
      providedFields: provided,
      requiredFields: required
    }
  })

  const percentage = totalRequired === 0 ? 100 : Math.round((totalProvided / totalRequired) * 100)

  return {
    complete: totalRequired > 0 && totalProvided === totalRequired,
    percentage,
    totalRequired,
    totalProvided,
    sections
  }
}
