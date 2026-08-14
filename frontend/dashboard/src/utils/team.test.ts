import { describe, expect, it } from 'vitest'
import type { BrokerSeat } from '../api/brokers'
import { countActiveBrokersMissingAvatar } from './team'

function member(overrides: Partial<BrokerSeat>): BrokerSeat {
  return {
    userId: crypto.randomUUID(),
    name: 'Pessoa de teste',
    email: 'pessoa@example.test',
    role: 'broker',
    status: 'active',
    createdAt: new Date(0).toISOString(),
    isCurrentUser: false,
    avatarUrl: null,
    ...overrides,
  }
}

describe('countActiveBrokersMissingAvatar', () => {
  it('conta apenas corretores afiliados ativos sem foto', () => {
    const members = [
      member({ role: 'agency_admin' }),
      member({ role: 'broker' }),
      member({ role: 'broker', status: 'invited' }),
      member({ role: 'broker', status: 'inactive' }),
      member({ role: 'broker', avatarUrl: '/media/avatar.webp' }),
    ]

    expect(countActiveBrokersMissingAvatar(members)).toBe(1)
  })
})
