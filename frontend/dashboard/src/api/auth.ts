import { get, post, resolvePublicAssetUrl, upload } from './http'
import type { LoginResponse, MembershipRole, TenantType, User, UserRole } from '../types'

type ApiMembership = {
  tenantId: string
  tenantName?: string
  tenantSlug?: string
  role: string
  status?: string
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
  isClient?: boolean
  isEmailVerified?: boolean
  avatarUrl?: string | null
  missingAvatarLoginCount?: number
  memberships?: ApiMembership[]
}

type ApiLoginResponse = {
  token?: string
  accessToken?: string
  user: ApiUser
}

function mapRole(dto: ApiUser): UserRole {
  if (dto.isClient || dto.memberships?.[0]?.role === 'client') return 'client'
  if (dto.isSaasAdmin) return 'saas_admin'
  const role = dto.memberships?.[0]?.role ?? ''
  if (role === 'agency_admin' || role === 'independent_broker') return 'tenant_admin'
  return 'broker'
}

export function mapUser(dto: ApiUser): User {
  const role = mapRole(dto)
  const membership = dto.memberships?.[0]
  const membershipRole =
    membership?.role && membership.role !== 'client'
      ? (membership.role as MembershipRole)
      : undefined
  return {
    id: dto.id,
    email: dto.email,
    name: dto.name,
    role,
    isClient: Boolean(dto.isClient) || role === 'client',
    isEmailVerified: dto.isEmailVerified ?? !dto.isClient,
    avatarUrl: resolvePublicAssetUrl(dto.avatarUrl),
    missingAvatarLoginCount: dto.missingAvatarLoginCount ?? 0,
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

export function verifyEmail(token: string): Promise<{ message: string; claimed: number }> {
  return post('/auth/verify-email', { token }, { skipAuth: true })
}

export function resendEmailVerification(email: string): Promise<{ message: string }> {
  return post('/auth/resend-email-verification', { email }, { skipAuth: true })
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
  acceptPrivacy: boolean
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

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return post('/auth/forgot-password', { email }, { skipAuth: true })
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  return post('/auth/reset-password', { token, newPassword }, { skipAuth: true })
}

export async function acceptInvite(formData: FormData): Promise<LoginResponse> {
  const raw = await upload<ApiLoginResponse>('/auth/accept-invite', formData, { skipAuth: true })
  const accessToken = raw.token ?? raw.accessToken
  if (!accessToken) throw new Error('Token ausente na resposta do convite')
  return { accessToken, user: mapUser(raw.user) }
}

export async function registerClient(payload: {
  email: string
  password: string
  name: string
  phone: string
  acceptPrivacy: boolean
}): Promise<LoginResponse> {
  const raw = await post<ApiLoginResponse>('/auth/register-client', payload, { skipAuth: true })
  const accessToken = raw.token ?? raw.accessToken
  if (!accessToken) throw new Error('Token ausente na resposta de cadastro')
  return { accessToken, user: mapUser(raw.user) }
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
