export const APPLICATION_SERVICES = Object.freeze([
  {
    key: 'trademark-recordation',
    label: 'Trademark Recordation',
    description: 'Record trademark ownership and related rights for regulatory review.',
    overviewRouteName: 'applications-trademark-recordation'
  },
  {
    key: 'merger-clearance',
    label: 'Merger Clearance',
    description: 'Submit merger or acquisition notifications for FCC competition clearance.',
    overviewRouteName: 'applications-merger-clearance'
  },
  {
    key: 'sfcc-registration',
    label: 'SFCC Registration',
    description: 'Register standard form consumer contracts for FCC screening and approval.',
    overviewRouteName: 'applications-sfcc-registration'
  },
  {
    key: 'legal-opinion',
    label: 'Legal Opinion',
    description: 'Request formal legal opinion on competition and consumer protection issues.',
    overviewRouteName: 'applications-legal-opinion'
  },
  {
    key: 'exemption',
    label: 'Exemption',
    description: 'Apply for statutory exemptions under competition or consumer protection law.',
    overviewRouteName: 'applications-exemption'
  }
])

export const DEFAULT_APPLICATION_SERVICE_KEY = 'sfcc-registration'
export const APPLICATION_SERVICE_OVERVIEW_ROUTE_NAME = 'service-overview'

const SERVICE_BY_KEY = APPLICATION_SERVICES.reduce((acc, service) => {
  acc[service.key] = service
  return acc
}, {})

function normalizeInput(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
}

export function isValidApplicationServiceKey(value = '') {
  return Boolean(SERVICE_BY_KEY[normalizeInput(value)])
}

export function getApplicationServiceByKey(value = '') {
  return SERVICE_BY_KEY[normalizeInput(value)] || SERVICE_BY_KEY[DEFAULT_APPLICATION_SERVICE_KEY]
}

export function getApplicationServiceLabel(value = '') {
  return getApplicationServiceByKey(value).label
}

export function buildServiceOverviewRoute(serviceKey = '') {
  return {
    name: APPLICATION_SERVICE_OVERVIEW_ROUTE_NAME,
    params: {
      serviceKey: getApplicationServiceByKey(serviceKey).key
    }
  }
}

export function buildApplicationCreateRoute(serviceKey = '') {
  return {
    name: 'application-create',
    params: {
      serviceKey: getApplicationServiceByKey(serviceKey).key
    }
  }
}

export function buildApplicationDetailsRoute(serviceKey = '', applicationId = '') {
  return {
    name: 'application-details',
    params: {
      serviceKey: getApplicationServiceByKey(serviceKey).key,
      id: String(applicationId || '')
    }
  }
}

export function buildApplicationUpdateRoute(serviceKey = '', applicationId = '') {
  return {
    name: 'application-update',
    params: {
      serviceKey: getApplicationServiceByKey(serviceKey).key,
      id: String(applicationId || '')
    }
  }
}

export function resolveApplicationServiceKeyFromText(...values) {
  const merged = values
    .filter(Boolean)
    .map((value) => normalizeInput(value))
    .join(' ')

  if (!merged) {
    return DEFAULT_APPLICATION_SERVICE_KEY
  }

  if (merged.includes('trademark')) {
    return 'trademark-recordation'
  }

  if (merged.includes('merger') || merged.includes('acquisition') || merged.includes('clearence') || merged.includes('clearance')) {
    return 'merger-clearance'
  }

  if (merged.includes('legal opinion') || (merged.includes('legal') && merged.includes('opinion'))) {
    return 'legal-opinion'
  }

  if (merged.includes('exemption')) {
    return 'exemption'
  }

  if (
    merged.includes('sfcc') ||
    merged.includes('standard form consumer contract') ||
    merged.includes('consumer contract')
  ) {
    return 'sfcc-registration'
  }

  return DEFAULT_APPLICATION_SERVICE_KEY
}
