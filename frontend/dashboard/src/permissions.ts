import type { User } from './types'

/** Admin SaaS puro — visualização global, sem editar dados de tenants. */
export function isSaasReadOnly(user: User | null | undefined): boolean {
  return user?.role === 'saas_admin'
}

export function isBroker(user: User | null | undefined): boolean {
  return user?.role === 'broker'
}

export function isTenantAdmin(user: User | null | undefined): boolean {
  return user?.role === 'tenant_admin'
}

/** Pode criar/editar/excluir imóveis (admin tenant ou corretor da própria carteira). */
export function canWriteProperties(user: User | null | undefined): boolean {
  if (!user || isSaasReadOnly(user)) return false
  return user.role === 'tenant_admin' || user.role === 'broker'
}

/** Pode confirmar/recusar visitas. */
export function canManageVisits(user: User | null | undefined): boolean {
  if (!user || isSaasReadOnly(user)) return false
  return user.role === 'tenant_admin' || user.role === 'broker'
}

export function canManageTeam(user: User | null | undefined): boolean {
  return Boolean(user?.canManageBrokers) && !isSaasReadOnly(user)
}

export function canEditTenantSettings(user: User | null | undefined): boolean {
  if (!user || isSaasReadOnly(user)) return false
  return user.membershipRole === 'agency_admin' || user.membershipRole === 'independent_broker'
}

export function canEditTheme(user: User | null | undefined): boolean {
  return canEditTenantSettings(user)
}

export function canEditBrokerSettings(user: User | null | undefined): boolean {
  if (!user || isSaasReadOnly(user)) return false
  return user.role === 'broker' || user.membershipRole === 'independent_broker'
}
