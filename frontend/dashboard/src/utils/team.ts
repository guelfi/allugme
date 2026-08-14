import type { BrokerSeat } from '../api/brokers'

export function isActiveBrokerMissingAvatar(member: BrokerSeat): boolean {
  return member.role === 'broker' && member.status === 'active' && !member.avatarUrl
}

export function countActiveBrokersMissingAvatar(members: BrokerSeat[]): number {
  return members.filter(isActiveBrokerMissingAvatar).length
}
