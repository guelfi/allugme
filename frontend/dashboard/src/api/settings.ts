import { get, post, put } from './http'
import type { TenantSettings } from '../types'

export type BrokerSettings = {
  bufferMinutes?: number | null
  visitDurationMinutes?: number | null
  whatsAppE164?: string | null
}

export async function getTenantSettings(): Promise<TenantSettings> {
  return get<TenantSettings>('/settings/tenant')
}

export async function updateTenantSettings(payload: TenantSettings): Promise<TenantSettings> {
  return put<TenantSettings>('/settings/tenant', payload)
}

export async function getBrokerSettings(): Promise<BrokerSettings> {
  return get<BrokerSettings>('/settings/broker')
}

export async function updateBrokerSettings(payload: BrokerSettings): Promise<BrokerSettings> {
  return put<BrokerSettings>('/settings/broker', payload)
}

export async function sendWhatsAppTest(phone: string): Promise<{ ok: boolean; message?: string }> {
  return post('/settings/whatsapp/test', { phone })
}
