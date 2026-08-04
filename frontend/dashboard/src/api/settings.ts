import { get, post, put } from './http'
import type { TenantSettings } from '../types'

export async function getTenantSettings(): Promise<TenantSettings> {
  return get<TenantSettings>('/settings/tenant')
}

export async function updateTenantSettings(payload: TenantSettings): Promise<TenantSettings> {
  return put<TenantSettings>('/settings/tenant', payload)
}

export async function sendWhatsAppTest(phone: string): Promise<{ ok: boolean; message?: string }> {
  return post('/settings/whatsapp/test', { phone })
}
