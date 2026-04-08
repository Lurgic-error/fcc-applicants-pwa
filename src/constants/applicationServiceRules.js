import { DEFAULT_APPLICATION_SERVICE_KEY } from '@/constants/applicationCatalog'
import {
  getTrademarkFeeByRequestType,
  getTrademarkRequestTypeConfig,
  isTrademarkPaymentRequired
} from '@/constants/trademarkRecordation'

const SERVICE_RULES = Object.freeze({
  'trademark-recordation': {
    feeModel: 'trademark-request',
    certificate: {
      available: true,
      validityMonths: 12
    },
    fees: {
      base: 200000
    }
  },
  'sfcc-registration': {
    feeModel: 'per-contract',
    certificate: {
      available: true,
      validityMonths: 12
    },
    fees: {
      perContract: 95000
    }
  },
  'merger-clearance': {
    feeModel: 'single-clearance',
    certificate: {
      available: true,
      validityMonths: null
    },
    fees: {
      base: 850000
    }
  },
  'legal-opinion': {
    feeModel: 'fixed',
    certificate: {
      available: false,
      validityMonths: null
    },
    fees: {
      base: 250000
    }
  },
  exemption: {
    feeModel: 'fixed',
    certificate: {
      available: false,
      validityMonths: null
    },
    fees: {
      base: 180000
    }
  }
})

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function getServiceRule(serviceKey = DEFAULT_APPLICATION_SERVICE_KEY) {
  return SERVICE_RULES[serviceKey] || SERVICE_RULES[DEFAULT_APPLICATION_SERVICE_KEY]
}

export function calculateServiceFees(serviceKey = DEFAULT_APPLICATION_SERVICE_KEY, input = {}) {
  const rule = getServiceRule(serviceKey)
  const currency = String(input.currency || 'TZS')

  if (rule.feeModel === 'per-trademark-version') {
    const versions = Array.isArray(input.trademarkVersions) ? input.trademarkVersions : []
    if (versions.length === 0) {
      const fallback = toNumber(input.applicationFee, rule.fees.base)
      return {
        currency,
        model: rule.feeModel,
        total: fallback,
        breakdown: [
          {
            lineId: 'tm-fallback-fee',
            label: 'Trademark Filing Fee',
            amount: fallback
          }
        ]
      }
    }

    const breakdown = versions.map((version, index) => {
      const classCount = Math.max(1, toNumber(version.classCount, 1))
      const total = rule.fees.base + Math.max(0, classCount - 1) * rule.fees.perAdditionalClass
      return {
        lineId: version.versionId || `tm-version-${index + 1}`,
        label: `${version.markName || 'Trademark Version'} (${classCount} class${classCount > 1 ? 'es' : ''})`,
        amount: total
      }
    })

    const total = breakdown.reduce((sum, row) => sum + toNumber(row.amount), 0)
    return {
      currency,
      model: rule.feeModel,
      total,
      breakdown
    }
  }

  if (rule.feeModel === 'trademark-request') {
    const requestType = input?.trademarkRecordation?.requestType || input.trademarkRequestType || 'new_recordation'
    const requestConfig = getTrademarkRequestTypeConfig(requestType)
    const configured = getTrademarkFeeByRequestType(requestType)
    const fallback = toNumber(input.applicationFee, configured || rule.fees.base)
    const trademarkRows = Array.isArray(input?.trademarkRecordation?.trademarks)
      ? input.trademarkRecordation.trademarks.filter((row) => row && (row.trademarkName || row.markName))
      : Array.isArray(input?.trademarks)
        ? input.trademarks.filter(Boolean)
        : []
    const trademarkCount = Math.max(1, trademarkRows.length || 1)
    const perTrademarkFee = configured || fallback
    const total = perTrademarkFee * trademarkCount
    const paymentRequired = isTrademarkPaymentRequired(requestType)

    return {
      currency,
      model: rule.feeModel,
      total,
      breakdown: trademarkRows.length
        ? trademarkRows.map((row, index) => ({
            lineId: row.submissionId || row.trademarkId || `tm-${requestType}-fee-${index + 1}`,
            label: `${row.trademarkName || row.markName || `Trademark ${index + 1}`} - ${requestConfig.shortLabel}${paymentRequired ? '' : ' (No payment required)'}`,
            amount: perTrademarkFee
          }))
        : [
            {
              lineId: `tm-${requestType}-fee`,
              label: `${requestConfig.shortLabel} Fee${paymentRequired ? '' : ' (No payment required)'}`,
              amount: total
            }
          ]
    }
  }

  if (rule.feeModel === 'per-contract') {
    const contracts = Array.isArray(input.contracts) ? input.contracts : []
    if (contracts.length === 0) {
      const fallback = toNumber(input.applicationFee, rule.fees.perContract)
      return {
        currency,
        model: rule.feeModel,
        total: fallback,
        breakdown: [
          {
            lineId: 'sfcc-fallback-fee',
            label: 'SFCC Registration Fee',
            amount: fallback
          }
        ]
      }
    }

    const breakdown = contracts.map((contract, index) => ({
      lineId: contract.contractId || `contract-${index + 1}`,
      label: contract.contractName || contract.contractCategory || `Contract ${index + 1}`,
      amount: rule.fees.perContract
    }))
    const total = breakdown.reduce((sum, row) => sum + toNumber(row.amount), 0)
    return {
      currency,
      model: rule.feeModel,
      total,
      breakdown
    }
  }

  if (rule.feeModel === 'single-clearance') {
    const transactionValue = toNumber(input?.mergerClearance?.transactionValue || input.transactionValue, 0)
    const tieredIncrement = Math.floor(transactionValue / 1_000_000_000) * 50000
    const total = rule.fees.base + Math.max(0, tieredIncrement)
    return {
      currency,
      model: rule.feeModel,
      total,
      breakdown: [
        {
          lineId: 'merger-clearance-fee',
          label: 'Merger Clearance Filing Fee',
          amount: total
        }
      ]
    }
  }

  const fixed = toNumber(input.applicationFee, rule.fees.base)
  return {
    currency,
    model: rule.feeModel,
    total: fixed,
    breakdown: [
      {
        lineId: `${serviceKey}-base-fee`,
        label: 'Application Processing Fee',
        amount: fixed
      }
    ]
  }
}

export function getCertificatePolicy(serviceKey = DEFAULT_APPLICATION_SERVICE_KEY) {
  const rule = getServiceRule(serviceKey)
  return {
    available: Boolean(rule.certificate?.available),
    validityMonths: rule.certificate?.validityMonths ?? null
  }
}
