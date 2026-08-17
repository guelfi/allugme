import { describe, expect, it } from 'vitest'
import { resolvePublicAssetUrl } from './http'

describe('resolvePublicAssetUrl', () => {
  it('mantém URLs absolutas', () => {
    expect(resolvePublicAssetUrl('https://cdn.example.com/avatar.jpg')).toBe(
      'https://cdn.example.com/avatar.jpg',
    )
  })

  it('resolve mídia relativa usando a origem da API, não a do painel', () => {
    expect(
      resolvePublicAssetUrl('/media/avatar.jpg', 'https://api.allugme.online/api/v1'),
    ).toBe('https://api.allugme.online/media/avatar.jpg')
  })

  it('ignora valores vazios', () => {
    expect(resolvePublicAssetUrl(null)).toBeUndefined()
  })
})
