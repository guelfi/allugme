import { del, get, post, upload } from './http'

export type BrokerSeat = {
  userId: string
  name: string
  email: string
  phone?: string | null
  role: string
  createdAt: string
  isCurrentUser: boolean
  avatarUrl?: string | null
}

export type BrokerQuota = {
  tenantType: string
  plan: string
  includedBrokerSlots: number
  extraBrokerSlots: number
  usedBrokerSlots: number
  maxBrokerSlots: number
  remainingBrokerSlots: number
  canManageBrokers: boolean
}

export type TeamResponse = {
  quota: BrokerQuota
  members: BrokerSeat[]
}

export async function fetchTeam(tenantId?: string): Promise<TeamResponse> {
  return get<TeamResponse>('/brokers', { query: tenantId ? { tenantId } : undefined })
}

export async function createBroker(payload: {
  name: string
  email: string
  password: string
  phone?: string
}): Promise<BrokerSeat> {
  return post<BrokerSeat>('/brokers', payload)
}

export async function removeBroker(userId: string): Promise<void> {
  await del(`/brokers/${userId}`)
}

export async function uploadMyAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData()
  formData.append('file', file)
  return upload<{ avatarUrl: string }>('/brokers/me/avatar', formData)
}
