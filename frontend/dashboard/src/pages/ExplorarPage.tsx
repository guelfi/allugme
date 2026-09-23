import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import {
  searchPublicProperties,
  type PublicProperty,
  type PublicPropertySearchQuery,
} from '../api/publicProperties'
import { resolveListingImageUrl } from '../api/http'
import { vitrinePropertyUrl } from '../vitrineUrl'

function formatPrice(item: PublicProperty): string {
  const value = item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  return item.operation === 'rent' ? `${value}/mês` : value
}

function operationLabel(operation: string): string {
  return operation === 'sale' || operation === 'comprar' ? 'Comprar' : 'Alugar'
}

function queryFromParams(params: URLSearchParams): PublicPropertySearchQuery {
  return {
    city: params.get('city') || params.get('cidade') || undefined,
    neighborhood: params.get('neighborhood') || params.get('bairro') || undefined,
    maxPrice: params.get('maxPrice') || params.get('valor_max') || params.get('price') || undefined,
    bedrooms: params.get('bedrooms') || params.get('quartos') || undefined,
    operation: params.get('operation') || params.get('operacao') || undefined,
  }
}

function favoriteHref(propertyId: string, returnUrl: string): string {
  const next = new URLSearchParams({
    propertyId,
    returnUrl,
  })
  return `/portal/register?${next.toString()}`
}

export function ExplorarPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = useMemo(() => queryFromParams(searchParams), [searchParams])
  const [items, setItems] = useState<PublicProperty[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    searchPublicProperties(query)
      .then((result) => {
        setItems(result.items)
        setTotal(result.total)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [query])

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const next = new URLSearchParams()
    const city = String(data.get('city') || '').trim()
    const neighborhood = String(data.get('neighborhood') || '').trim()
    const operation = String(data.get('operation') || '').trim()
    const bedrooms = String(data.get('bedrooms') || '').trim()
    const maxPrice = String(data.get('maxPrice') || '').trim()
    if (city) next.set('city', city)
    if (neighborhood) next.set('neighborhood', neighborhood)
    if (operation) next.set('operation', operation)
    if (bedrooms) next.set('bedrooms', bedrooms)
    if (maxPrice) next.set('maxPrice', maxPrice)
    setSearchParams(next)
  }

  return (
    <div className="lp lp-explore">
      <header className="lp-nav">
        <div className="lp-nav-bar">
          <Link className="lp-brand" to="/" aria-label="Allugme">
            <BrandMark className="lp-brand-mark" />
            <span aria-hidden="true">llugme</span>
          </Link>
          <div className="lp-nav-actions">
            <Link to="/" className="btn btn-ghost btn-sm">
              Voltar
            </Link>
            <Link to="/login" className="btn btn-ghost btn-sm">
              Entrar
            </Link>
            <Link to="/portal/register" className="btn btn-primary btn-sm">
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      <main className="lp-explore-main">
        <header className="lp-explore-head">
          <p className="lp-explore-kicker">Para quem busca imóvel</p>
          <h1>Encontre um imóvel nas vitrines Allugme</h1>
          <p>
            Pesquise na rede de imobiliárias e corretores. O anúncio abre na vitrine de quem publica
            — lá você favorita e agenda a visita.
          </p>
        </header>

        <form className="lp-explore-filters" onSubmit={handleSearch}>
          <label>
            Cidade
            <input name="city" type="search" defaultValue={query.city ?? ''} placeholder="São Paulo" />
          </label>
          <label>
            Bairro
            <input
              name="neighborhood"
              type="search"
              defaultValue={query.neighborhood ?? ''}
              placeholder="Pinheiros"
            />
          </label>
          <label>
            Operação
            <select name="operation" defaultValue={query.operation ?? ''}>
              <option value="">Todas</option>
              <option value="rent">Alugar</option>
              <option value="sale">Comprar</option>
            </select>
          </label>
          <label>
            Quartos
            <select name="bedrooms" defaultValue={query.bedrooms ? String(query.bedrooms) : ''}>
              <option value="">Todos</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </label>
          <label>
            Valor até
            <select name="maxPrice" defaultValue={query.maxPrice ? String(query.maxPrice) : ''}>
              <option value="">Qualquer</option>
              <option value="2500">R$ 2.500</option>
              <option value="4000">R$ 4.000</option>
              <option value="6000">R$ 6.000</option>
              <option value="10000">R$ 10.000</option>
              <option value="850000">R$ 850.000</option>
            </select>
          </label>
          <button type="submit" className="btn btn-primary">
            Buscar
          </button>
        </form>

        {error && <div className="alert alert-error">{error}</div>}
        {loading ? (
          <p className="muted">Carregando imóveis…</p>
        ) : items.length === 0 ? (
          <p className="muted">Nenhum imóvel publicado combina com esses filtros.</p>
        ) : (
          <>
            <p className="lp-explore-count">{total} {total === 1 ? 'imóvel' : 'imóveis'}</p>
            <div className="lp-explore-grid">
              {items.map((item) => {
                const photo = resolveListingImageUrl(item.imageUrls?.[0])
                const detail = vitrinePropertyUrl(item.tenantSlug, item.id)
                const schedule = `/login?returnUrl=${encodeURIComponent(`/portal/agendar?propertyId=${item.id}`)}`
                return (
                  <article key={item.id} className="lp-explore-card">
                    <a className="lp-explore-media" href={detail}>
                      {photo ? (
                        <img src={photo} alt="" />
                      ) : (
                        <span className="lp-explore-media-empty" aria-hidden="true" />
                      )}
                      <span className="lp-explore-badge">{operationLabel(item.operation)}</span>
                    </a>
                    <div className="lp-explore-body">
                      <p className="lp-explore-price">{formatPrice(item)}</p>
                      <h2>
                        <a href={detail}>{item.title}</a>
                      </h2>
                      <p className="muted">
                        {[item.neighborhood, item.city].filter(Boolean).join(' · ')}
                        {item.bedrooms ? ` · ${item.bedrooms} quarto(s)` : ''}
                      </p>
                      <p className="lp-explore-tenant">{item.tenantName}</p>
                      <div className="lp-explore-actions">
                        <a className="btn btn-primary btn-sm" href={detail}>
                          Ver na vitrine
                        </a>
                        <a className="btn btn-secondary btn-sm" href={schedule}>
                          Agendar visita
                        </a>
                        <Link className="btn btn-ghost btn-sm" to={favoriteHref(item.id, detail)}>
                          Favoritar
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
