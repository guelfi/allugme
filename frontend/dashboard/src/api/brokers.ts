import { del, get, post } from './http'

export type BrokerSeat = {
  userId: string
  name: string
  email: string
  phone?: string | null
  role: string
  createdAt: string
  isCurrentUser: boolean
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

export async function fetchTeam(): Promise<TeamResponse> {
  return get<TeamResponse>('/brokers')
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
