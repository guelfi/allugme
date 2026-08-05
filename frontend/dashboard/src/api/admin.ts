import { get } from './http'

export type AdminStats = {
  agencies: number
  independentBrokers: number
  properties: number
  clients: number
}

export async function getAdminStats(): Promise<AdminStats> {
  return get<AdminStats>('/admin/stats')
}
