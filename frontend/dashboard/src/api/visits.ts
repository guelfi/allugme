import { get, patch } from './http'
import type { Visit } from '../types'

export async function listVisits(params?: { status?: string; date?: string }): Promise<Visit[]> {
  const data = await get<Visit[] | { items: Visit[] }>('/visits', { query: params })
  return Array.isArray(data) ? data : (data.items ?? [])
}

export async function updateVisitStatus(
  id: string,
  status: Visit['status'],
): Promise<Visit> {
  return patch<Visit>(`/visits/${id}`, { status })
}
