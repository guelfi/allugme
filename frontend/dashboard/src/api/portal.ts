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
