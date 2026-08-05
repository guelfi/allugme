import { get, patch } from './http'
import type { Visit } from '../types'

type ApiVisit = {
  id: string
  propertyId: string
  propertyTitle: string
  brokerId?: string
  visitorName: string
  visitorPhone: string
  visitorEmail?: string | null
  brokerName?: string
  startAt: string
  endAt: string
  status: string
  confirmationCode?: string
  tenantId?: string
}

function mapVisit(v: ApiVisit): Visit {
  const status =
    v.status === 'rejected'
      ? 'declined'
      : (v.status as Visit['status'])
  return {
    id: v.id,
    propertyId: v.propertyId,
    propertyTitle: v.propertyTitle,
    visitorName: v.visitorName,
    visitorPhone: v.visitorPhone,
    visitorEmail: v.visitorEmail ?? undefined,
    brokerId: v.brokerId,
    brokerName: v.brokerName,
    startAt: v.startAt,
    endAt: v.endAt,
    status,
    confirmationCode: v.confirmationCode,
    tenantId: v.tenantId,
  }
}

export async function listVisits(params?: {
  status?: string
  date?: string
  brokerId?: string
}): Promise<Visit[]> {
  const query = params?.status === 'declined' ? { ...params, status: 'rejected' } : params
  const data = await get<ApiVisit[] | { items: ApiVisit[] }>('/visits', { query })
  const items = Array.isArray(data) ? data : (data.items ?? [])
  return items.map(mapVisit)
}

export async function updateVisitStatus(
  id: string,
  status: Visit['status'],
): Promise<Visit> {
  const apiStatus = status === 'declined' ? 'rejected' : status
  return mapVisit(await patch<ApiVisit>(`/visits/${id}`, { status: apiStatus }))
}
