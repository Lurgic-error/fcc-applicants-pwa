/**
 * Format a number with comma separators for display in el-input-number.
 * Use with :formatter and :parser props on el-input-number.
 */
export function formatNumber(value) {
  if (value === null || value === undefined || value === '') return ''
  return Number(value).toLocaleString('en-US')
}

export function parseNumber(value) {
  if (!value) return 0
  return Number(String(value).replace(/,/g, '')) || 0
}
