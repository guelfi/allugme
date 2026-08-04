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
  /** Valor mensal por corretor além dos 5 inclusos */
  extraBrokerMonthly: 'R$ 39,00',
  /** Valor mensal por corretor além dos 5 inclusos (plano anual) */
  extraBrokerYearly: 'R$ 29,00',
} as const

/** Planos oficiais Allugme — corretor independente (conta individual) */
export const independentPricing = {
  monthly: {
    amount: 49,
    fullLabel: 'Mensal — R$ 49,00',
  },
  yearly: {
    amount: 470,
    fullLabel: 'Anual — R$ 470,00',
  },
} as const

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
