import { get } from './http'

export interface PublicProperty {
  id: string
  title: string
  description: string
  city: string
  neighborhood: string
  price: number
  bedrooms: number
  areaSqm: number
  operation: 'rent' | 'sale' | string
  propertyType: string
  tenantName: string
  tenantSlug: string
  imageUrls: string[]
  videoUrl?: string | null
  brokerName?: string
}

export interface PublicPropertySearchResult {
  items: PublicProperty[]
  total: number
}

export interface PublicPropertySearchQuery {
  city?: string
  neighborhood?: string
  maxPrice?: string | number
  bedrooms?: string | number
  operation?: string
  tenantSlug?: string
}

export function searchPublicProperties(
  query: PublicPropertySearchQuery = {},
): Promise<PublicPropertySearchResult> {
  return get<PublicPropertySearchResult>('/public/properties', {
    skipAuth: true,
    query: {
      city: query.city,
      neighborhood: query.neighborhood,
      maxPrice: query.maxPrice,
      bedrooms: query.bedrooms,
      operation: query.operation,
      tenantSlug: query.tenantSlug,
    },
  })
}
