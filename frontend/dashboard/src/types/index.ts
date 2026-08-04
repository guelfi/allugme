export type UserRole = 'saas_admin' | 'tenant_admin' | 'broker'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  tenantId?: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  status: 'active' | 'suspended' | 'pending'
  type: string
  createdAt: string
}

export interface Property {
  id: string
  title: string
  address: string
  city: string
  operation: 'sale' | 'rent'
  type: string
  price: number
  status: 'draft' | 'published' | 'archived'
  bedrooms?: number
  areaM2?: number
  updatedAt: string
}

export interface Visit {
  id: string
  propertyId: string
  propertyTitle: string
  visitorName: string
  visitorPhone: string
  startAt: string
  endAt: string
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled'
  confirmationCode?: string
}

export interface TenantSettings {
  visitDurationMinutes: number
  bufferMinutes: number
  whatsAppE164?: string
  whatsAppNotifyEnabled: boolean
}

export interface ThemeConfig {
  themeId: string
  primaryColor?: string
  logoUrl?: string
}

export interface LoginResponse {
  accessToken: string
  user: User
}

export interface MeResponse {
  user: User
  memberships?: Array<{ tenantId: string; role: string }>
}
