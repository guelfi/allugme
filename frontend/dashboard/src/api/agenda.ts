import { del, get, post } from './http'

export type CalendarBlock = {
  id: string
  brokerId: string
  startAt: string
  endAt: string
  reason?: string | null
}

export async function listBlocks(brokerId?: string): Promise<CalendarBlock[]> {
  const data = await get<CalendarBlock[] | { items: CalendarBlock[] }>('/agenda/blocks', {
    query: brokerId ? { brokerId } : undefined,
  })
  return Array.isArray(data) ? data : (data.items ?? [])
}

export async function createBlock(payload: {
  startAt: string
  endAt: string
  reason?: string
}): Promise<CalendarBlock> {
  return post<CalendarBlock>('/agenda/blocks', payload)
}

export async function deleteBlock(id: string): Promise<void> {
  await del(`/agenda/blocks/${id}`)
}
