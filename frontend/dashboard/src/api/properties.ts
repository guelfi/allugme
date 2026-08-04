import { del, get, post, put } from './http'
import type { Property } from '../types'

export async function listProperties(): Promise<Property[]> {
  const data = await get<Property[] | { items: Property[] }>('/properties')
  return Array.isArray(data) ? data : (data.items ?? [])
}

export async function getProperty(id: string): Promise<Property> {
  return get<Property>(`/properties/${id}`)
}

export async function createProperty(payload: Partial<Property>): Promise<Property> {
  return post<Property>('/properties', payload)
}

export async function updateProperty(id: string, payload: Partial<Property>): Promise<Property> {
  return put<Property>(`/properties/${id}`, payload)
}

export async function deleteProperty(id: string): Promise<void> {
  await del<void>(`/properties/${id}`)
}

export async function publishProperty(id: string): Promise<Property> {
  return post<Property>(`/properties/${id}/publish`)
}
