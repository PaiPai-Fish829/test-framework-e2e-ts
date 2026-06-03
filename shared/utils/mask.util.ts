/**
 * @module shared/utils/mask
 * @description 公用脱敏工具。对日志、报告、断言输出中的手机号与邮箱做掩码，避免敏感信息明文落盘。
 */

/**
 * 手机号脱敏：保留前 3 位与后 4 位，中间以 `****` 替代；不足 7 位数字则原样返回。
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 7) {
    return phone
  }
  return `${digits.slice(0, 3)}****${digits.slice(-4)}`
}

/**
 * 邮箱脱敏：保留用户名前 2 字符与完整域名，中间以 `***` 替代。
 */
export function maskEmail(email: string): string {
  const [name, domain] = email.split('@')
  if (!name || !domain) {
    return email
  }
  if (name.length <= 2) {
    return `${name[0] ?? '*'}***@${domain}`
  }
  return `${name.slice(0, 2)}***@${domain}`
}
