import { del, get, post } from './http'
import type { Visit } from '../types'

export type PortalFavorite = {
  id: string
  propertyId: string
  createdAt: string
  title: string
  city?: string
  neighborhood?: string
  price?: number
  tenantName?: string
  tenantSlug?: string
  photoUrl?: string | null
}

export async function listFavorites(): Promise<PortalFavorite[]> {
  return get<PortalFavorite[]>('/portal/favorites')
}

export async function addFavorite(propertyId: string): Promise<{ message: string }> {
  return post(`/portal/favorites/${propertyId}`)
}

export async function removeFavorite(propertyId: string): Promise<void> {
  await del(`/portal/favorites/${propertyId}`)
}

export async function listMyVisits(): Promise<Visit[]> {
  return get<Visit[]>('/portal/visits')
}

export async function claimVisits(): Promise<{ claimed: number }> {
  return post('/portal/claim-visits')
}

export function cancelPortalVisit(visitId: string): Promise<{ message: string }> {
  return post(`/portal/visits/${visitId}/cancel`)
}

export function reschedulePortalVisit(visitId: string, startAt: string): Promise<{ message: string }> {
  return post(`/portal/visits/${visitId}/reschedule`, { startAt })
}

export function getPropertyVisitSlots(propertyId: string, date: string): Promise<{ slots: Array<{ startAt: string; endAt: string }> }> {
  return get(`/public/properties/${propertyId}/visit-slots?date=${encodeURIComponent(date)}`)
}

export type PortalSummary = {
  pendingVisits: number
  favoriteCount: number
  feedbackPending: number
  nextVisit: null | {
    id: string
    propertyId: string
    propertyTitle: string
    startAt: string
    endAt: string
    brokerName: string
    photoUrl?: string | null
  }
}

export function getPortalSummary(): Promise<PortalSummary> {
  return get('/portal/summary')
}

export function submitVisitFeedback(visitId: string, payload: {
  overallRating: number
  brokerRating: number
  interestLevel: 'not_interested' | 'other_options' | 'interested' | 'make_offer'
  comment?: string
  wantsContact: boolean
}): Promise<{ message: string }> {
  return post(`/portal/visits/${visitId}/feedback`, payload)
}
