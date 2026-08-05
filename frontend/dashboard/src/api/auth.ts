import { get, post } from './http'
import type { LoginResponse, MembershipRole, TenantType, User, UserRole } from '../types'

type ApiMembership = {
  tenantId: string
  tenantName?: string
  tenantSlug?: string
  role: string
  tenantType?: string
  plan?: string
  includedBrokerSlots?: number
  extraBrokerSlots?: number
  usedBrokerSlots?: number
  maxBrokerSlots?: number
  canManageBrokers?: boolean
  tenantStatus?: string
  trialEndsAt?: string | null
}

type ApiUser = {
  id: string
  email: string
  name: string
  phone?: string | null
  isSaasAdmin?: boolean
  avatarUrl?: string | null
  memberships?: ApiMembership[]
}

type ApiLoginResponse = {
  token?: string
  accessToken?: string
  user: ApiUser
}

function mapRole(dto: ApiUser): UserRole {
  if (dto.isSaasAdmin) return 'saas_admin'
  const role = dto.memberships?.[0]?.role ?? ''
  if (role === 'agency_admin' || role === 'independent_broker') return 'tenant_admin'
  return 'broker'
}

export function mapUser(dto: ApiUser): User {
  const membership = dto.memberships?.[0]
  const membershipRole = membership?.role as MembershipRole | undefined
  return {
    id: dto.id,
    email: dto.email,
    name: dto.name,
    role: mapRole(dto),
    avatarUrl: dto.avatarUrl ?? undefined,
    membershipRole,
    tenantId: membership?.tenantId,
    tenantName: membership?.tenantName,
    tenantType: (membership?.tenantType as TenantType | undefined) ?? undefined,
    plan: membership?.plan === 'yearly' ? 'yearly' : membership?.plan ? 'monthly' : undefined,
    includedBrokerSlots: membership?.includedBrokerSlots,
    extraBrokerSlots: membership?.extraBrokerSlots,
    usedBrokerSlots: membership?.usedBrokerSlots,
    maxBrokerSlots: membership?.maxBrokerSlots,
    canManageBrokers: Boolean(membership?.canManageBrokers),
    tenantStatus: membership?.tenantStatus as User['tenantStatus'],
    trialEndsAt: membership?.trialEndsAt ?? undefined,
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const raw = await post<ApiLoginResponse>(
    '/auth/login',
    { email, password },
    { skipAuth: true },
  )
  const accessToken = raw.token ?? raw.accessToken
  if (!accessToken) throw new Error('Token ausente na resposta de login')
  return { accessToken, user: mapUser(raw.user) }
}

export async function logout(): Promise<void> {
  try {
    await post<void>('/auth/logout')
  } catch {
    /* best effort */
  }
}

export async function fetchMe(): Promise<User> {
  const me = await get<ApiUser | { user: ApiUser }>('/me')
  const dto = 'user' in me && me.user ? me.user : (me as ApiUser)
  return mapUser(dto)
}

export type RegisterPayload = {
  email: string
  password: string
  name: string
  phone: string
  accountType: 'agency' | 'independent'
  businessName: string
  plan: 'monthly' | 'yearly'
  pixReferenceCode?: string
}

export type PixQuote = {
  amount: number
  planLabel: string
  pixKey: string
  merchantName: string
  merchantCity: string
  txId: string
  copyPaste: string
  qrCodePngBase64: string
}

export type RegisterResult = {
  message: string
  plan: string
  pix?: PixQuote
  accessToken: string
  user: ApiUser
  trialEndsAt: string
}

export async function registerAccount(payload: RegisterPayload): Promise<RegisterResult> {
  return post('/auth/register', payload, { skipAuth: true })
}

export async function quotePix(params: {
  accountType: 'agency' | 'independent'
  plan: 'monthly' | 'yearly'
}): Promise<PixQuote> {
  return post('/public/pix/quote', params, { skipAuth: true })
}

export function persistToken(token: string): void {
  localStorage.setItem('authToken', token)
}

export function clearToken(): void {
  localStorage.removeItem('authToken')
}

export function readToken(): string | null {
  return localStorage.getItem('authToken')
}
