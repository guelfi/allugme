import { describe, expect, it } from 'vitest'
import { resolveListingImageUrl, resolvePublicAssetUrl } from './http'

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

describe('resolveListingImageUrl', () => {
  it('resolve /themes no host da página, não no da API', () => {
    expect(
      resolveListingImageUrl(
        '/themes/moderno/assets/img/imovel-1.jpg',
        'https://api.allugme.online/api/v1',
        'https://allugme.online',
      ),
    ).toBe('https://allugme.online/themes/moderno/assets/img/imovel-1.jpg')
  })

  it('mantém mídia enviada na origem da API', () => {
    expect(
      resolveListingImageUrl('/media/foto.jpg', 'https://api.allugme.online/api/v1', 'https://allugme.online'),
    ).toBe('https://api.allugme.online/media/foto.jpg')
  })
})
