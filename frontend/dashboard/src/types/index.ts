export type UserRole = 'saas_admin' | 'tenant_admin' | 'broker'
export type TenantType = 'agency' | 'independent'
export type MembershipRole = 'agency_admin' | 'broker' | 'independent_broker'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
  membershipRole?: MembershipRole
  tenantId?: string
  tenantName?: string
  tenantType?: TenantType
  plan?: 'monthly' | 'yearly'
  includedBrokerSlots?: number
  extraBrokerSlots?: number
  usedBrokerSlots?: number
  maxBrokerSlots?: number
  canManageBrokers?: boolean
}

export interface Tenant {
  id: string
  name: string
  slug: string
  status: 'active' | 'suspended' | 'pending' | 'pending_payment'
  type: string
  plan?: string
  includedBrokerSlots?: number
  extraBrokerSlots?: number
  maxBrokerSlots?: number
  createdAt: string
  pixReferenceCode?: string | null
}

export interface PropertyMediaItem {
  id: string
  url: string
  mediaType: 'photo' | 'video'
  sortOrder: number
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
  description?: string
  neighborhood?: string
  tenantId?: string
  media?: PropertyMediaItem[]
}

export interface Visit {
  id: string
  propertyId: string
  propertyTitle: string
  visitorName: string
  visitorPhone: string
  visitorEmail?: string
  brokerId?: string
  brokerName?: string
  startAt: string
  endAt: string
  status: 'pending' | 'confirmed' | 'declined' | 'rejected' | 'cancelled'
  confirmationCode?: string
  tenantId?: string
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
