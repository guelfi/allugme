import { get } from './http'

export type Client = {
  clientUserId?: string | null
  visitorName: string
  visitorPhone: string
  visitorEmail?: string | null
  visitCount: number
  lastVisitAt?: string | null
  registeredAt?: string | null
  tenantId?: string | null
  tenantName?: string | null
}

export async function listClients(): Promise<Client[]> {
  const data = await get<Client[] | { items: Client[] }>('/clients')
  return Array.isArray(data) ? data : (data.items ?? [])
}
