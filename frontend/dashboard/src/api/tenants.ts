import { get, patch, post } from './http'
import type { PixQuote } from './auth'
import type { Tenant } from '../types'

export async function listTenants(): Promise<Tenant[]> {
  const data = await get<Tenant[] | { items: Tenant[] }>('/tenants')
  return Array.isArray(data) ? data : (data.items ?? [])
}

export async function getTenant(id: string): Promise<Tenant> {
  return get<Tenant>(`/tenants/${id}`)
}

export async function createTenant(payload: { name: string; slug: string }): Promise<Tenant> {
  return post<Tenant>('/tenants', payload)
}

export async function updateTenantStatus(
  id: string,
  status: Tenant['status'],
): Promise<Tenant> {
  return patch<Tenant>(`/tenants/${id}/status`, { status })
}

export async function updateTenantPlan(
  id: string,
  payload: { plan?: string; extraBrokerSlots?: number; status?: string },
): Promise<Tenant> {
  return patch<Tenant>(`/tenants/${id}/plan`, payload)
}

export async function getMyPix(): Promise<PixQuote> {
  return get<PixQuote>('/tenants/me/pix')
}
