/** Máscara/validação para celular BR (DDD + 8 ou 9 dígitos), usado no WhatsApp de contato. */

export function formatBrPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  const len = digits.length
  if (len === 0) return ''
  if (len <= 2) return `(${digits}`
  if (len <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (len <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

export function phoneDigits(raw: string): string {
  return raw.replace(/\D/g, '')
}

export function isValidBrPhone(raw: string): boolean {
  const digits = phoneDigits(raw)
  return digits.length === 10 || digits.length === 11
}

export function phoneToE164(raw: string): string {
  const digits = phoneDigits(raw)
  return digits.startsWith('55') ? `+${digits}` : `+55${digits}`
}
