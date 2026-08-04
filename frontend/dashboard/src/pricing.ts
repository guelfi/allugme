/** Planos oficiais Allugme — imobiliárias */
export const agencyPricing = {
  monthly: {
    fullLabel: 'Mensal — R$ 99,00',
    includedBrokers: 5,
  },
  yearly: {
    fullLabel: 'Anual — R$ 900,00',
    includedBrokers: 5,
  },
  /** Valor mensal por corretor além dos 5 inclusos */
  extraBrokerMonthly: 'R$ 39,00',
  /** Valor mensal por corretor além dos 5 inclusos (plano anual) */
  extraBrokerYearly: 'R$ 29,00',
} as const

export function planFullLabel(plan: 'monthly' | 'yearly') {
  return plan === 'yearly' ? agencyPricing.yearly.fullLabel : agencyPricing.monthly.fullLabel
}
