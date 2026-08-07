import { useEffect, useState } from 'react'
import { listFavorites, removeFavorite, type PortalFavorite } from '../api/portal'

function formatPrice(value?: number): string {
  if (value == null) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function PortalFavoritesPage() {
  const [items, setItems] = useState<PortalFavorite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listFavorites()
      .then(setItems)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleRemove(propertyId: string) {
    setError(null)
    try {
      await removeFavorite(propertyId)
      setItems((prev) => prev.filter((i) => i.propertyId !== propertyId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao remover favorito')
    }
  }

  return (
    <div>
      <header className="page-header">
        <div>
          <div className="page-title-row">
            <h1>Favoritos</h1>
            <span className="page-title-sep" aria-hidden="true">
              -
            </span>
            <span className="page-title-hint">Imóveis salvos na sua conta</span>
          </div>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <p className="muted">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="muted">Você ainda não salvou nenhum imóvel.</p>
      ) : (
        <div className="portal-fav-list">
          {items.map((item) => (
            <article key={item.id} className="card portal-fav-card">
              {item.photoUrl ? (
                <img src={item.photoUrl} alt="" className="portal-fav-photo" />
              ) : (
                <div className="portal-fav-photo portal-fav-photo-empty" aria-hidden="true" />
              )}
              <div className="portal-fav-body">
                <h2>{item.title}</h2>
                <p className="muted">
                  {[item.neighborhood, item.city].filter(Boolean).join(' · ') || '—'}
                  {item.tenantName ? ` · ${item.tenantName}` : ''}
                </p>
                <p>
                  <strong>{formatPrice(item.price)}</strong>
                </p>
                <div className="form-actions">
                  {item.tenantSlug && (
                    <a
                      className="btn btn-secondary btn-sm"
                      href={`/${item.tenantSlug}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver na vitrine
                    </a>
                  )}
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => void handleRemove(item.propertyId)}
                  >
                    Remover
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
