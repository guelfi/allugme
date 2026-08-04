import { get, patch, post } from './http'
import type { Tenant } from '../types'

export async function listTenants(): Promise<Tenant[]> {
  const data = await get<Tenant[] | { items: Tenant[] }>('/tenants')
  return Array.isArray(data) ? data : (data.items ?? [])
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
