import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listProperties } from '../api/properties'
import type { Property } from '../types'

const statusLabel: Record<Property['status'], string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  archived: 'Arquivado',
}

export function PropertiesPage() {
  const [items, setItems] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listProperties()
      .then(setItems)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Imóveis</h1>
          <p className="muted">Cadastro e publicação na vitrine</p>
        </div>
        <Link to="/properties/new" className="btn btn-primary">
          Novo imóvel
        </Link>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <p className="muted">Carregando…</p>
      ) : items.length === 0 ? (
        <div className="card empty-state">
          <p>Nenhum imóvel cadastrado.</p>
          <Link to="/properties/new" className="btn btn-primary">
            Criar primeiro imóvel
          </Link>
        </div>
      ) : (
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Cidade</th>
                <th>Operação</th>
                <th>Preço</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.city}</td>
                  <td>{item.operation === 'rent' ? 'Aluguel' : 'Venda'}</td>
                  <td>
                    {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td>
                    <span className={`badge badge-${item.status}`}>{statusLabel[item.status]}</span>
                  </td>
                  <td>
                    <Link to={`/properties/${item.id}`} className="btn btn-ghost btn-sm">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
