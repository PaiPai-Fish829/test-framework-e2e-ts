export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 7) {
    return phone
  }
  return `${digits.slice(0, 3)}****${digits.slice(-4)}`
}

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
