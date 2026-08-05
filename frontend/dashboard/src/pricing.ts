/** Planos oficiais Allugme — imobiliárias */
export const agencyPricing = {
  monthly: {
    amount: 99,
    fullLabel: 'Mensal — R$ 99,00',
    includedBrokers: 5,
  },
  yearly: {
    amount: 900,
    fullLabel: 'Anual — R$ 900,00',
    includedBrokers: 5,
  },
  /** Por corretor além dos 5 inclusos (plano mensal) */
  extraBrokerMonthly: 'R$ 39,00/mês',
  /** Por corretor além dos 5 inclusos (plano anual) */
  extraBrokerYearly: 'R$ 190,00/ano',
} as const

/** Planos oficiais Allugme — corretor independente (conta individual) */
export const independentPricing = {
  monthly: {
    amount: 49,
    fullLabel: 'Mensal — R$ 49,00',
  },
  yearly: {
    amount: 490,
    fullLabel: 'Anual — R$ 490,00',
  },
} as const

/** Economia do anual vs 12× mensal, arredondada para inteiro. */
export function yearlySavingsPercent(accountType: 'agency' | 'independent' = 'agency'): number {
  const monthly =
    accountType === 'independent' ? independentPricing.monthly.amount : agencyPricing.monthly.amount
  const yearly =
    accountType === 'independent' ? independentPricing.yearly.amount : agencyPricing.yearly.amount
  const yearlyIfMonthly = monthly * 12
  if (yearlyIfMonthly <= 0) return 0
  return Math.round(((yearlyIfMonthly - yearly) / yearlyIfMonthly) * 100)
}

export function yearlySavingsLabel(accountType: 'agency' | 'independent' = 'agency'): string {
  return `Economia de ${yearlySavingsPercent(accountType)}%`
}

export function planFullLabel(
  plan: 'monthly' | 'yearly',
  accountType: 'agency' | 'independent' = 'agency',
) {
  if (accountType === 'independent') {
    return plan === 'yearly'
      ? independentPricing.yearly.fullLabel
      : independentPricing.monthly.fullLabel
  }
  return plan === 'yearly' ? agencyPricing.yearly.fullLabel : agencyPricing.monthly.fullLabel
}
