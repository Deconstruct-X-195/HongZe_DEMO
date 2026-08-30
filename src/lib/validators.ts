/**
 * 表单数字字段范围校验（约束在客观事实范围内）
 * 适用于比率、数量、金额、天数等输入
 */

/** 百分比字段：0 - 100 */
export function percentError(v: number | undefined | null): string | null {
  if (v === undefined || v === null || Number.isNaN(v)) return null
  if (v < 0) return '比率不能为负数'
  if (v > 100) return '比率不能超过 100%'
  return null
}

/** 非负数量（吨/件等）：≥ 0 */
export function nonNegativeError(v: number | undefined | null): string | null {
  if (v === undefined || v === null || Number.isNaN(v)) return null
  if (v < 0) return '不能为负数'
  return null
}

/** 正数量：> 0 */
export function positiveError(v: number | undefined | null, label = '数量'): string | null {
  if (v === undefined || v === null || Number.isNaN(v)) return null
  if (v <= 0) return `${label}必须大于 0`
  return null
}
