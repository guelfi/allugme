import { del, get, post, put } from './http'
import type { Property } from '../types'

export type PropertyPayload = {
  operation: 'rent' | 'sale'
  propertyType: string
  title: string
  description: string
  city: string
  neighborhood: string
  price: number
  bedrooms: number
  areaSqm: number
  responsibleBrokerId?: string
}

type ApiProperty = {
  id: string
  tenantId?: string
  title: string
  description?: string
  city: string
  neighborhood?: string
  operation: 'rent' | 'sale' | string
  propertyType?: string
  type?: string
  price: number
  bedrooms?: number
  areaSqm?: number
  status: string
  createdAt?: string
  publishedAt?: string | null
}

function mapProperty(p: ApiProperty): Property {
  const status =
    p.status === 'published'
      ? 'published'
      : p.status === 'unlisted' || p.status === 'archived'
        ? 'archived'
        : 'draft'
  return {
    id: p.id,
    title: p.title,
    address: p.neighborhood ?? '',
    city: p.city,
    operation: p.operation === 'sale' ? 'sale' : 'rent',
    type: p.propertyType ?? p.type ?? 'apartment',
    price: Number(p.price),
    status,
    bedrooms: p.bedrooms,
    areaM2: p.areaSqm,
    updatedAt: p.publishedAt ?? p.createdAt ?? new Date().toISOString(),
    description: p.description,
    neighborhood: p.neighborhood,
    tenantId: p.tenantId,
  }
}

export async function listProperties(): Promise<Property[]> {
  const data = await get<ApiProperty[] | { items: ApiProperty[] }>('/properties')
  const items = Array.isArray(data) ? data : (data.items ?? [])
  return items.map(mapProperty)
}

export async function getProperty(id: string): Promise<Property> {
  return mapProperty(await get<ApiProperty>(`/properties/${id}`))
}

export async function createProperty(payload: PropertyPayload): Promise<Property> {
  return mapProperty(await post<ApiProperty>('/properties', payload))
}

export async function updateProperty(id: string, payload: Partial<PropertyPayload>): Promise<Property> {
  return mapProperty(await put<ApiProperty>(`/properties/${id}`, payload))
}

export async function deleteProperty(id: string): Promise<void> {
  await del<void>(`/properties/${id}`)
}

export async function publishProperty(id: string): Promise<Property> {
  return mapProperty(await post<ApiProperty>(`/properties/${id}/publish`))
}

export async function unpublishProperty(id: string): Promise<Property> {
  return mapProperty(await post<ApiProperty>(`/properties/${id}/unpublish`))
}
