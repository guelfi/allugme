import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listProperties } from '../api/properties'
import { TablePagination } from '../components/TablePagination'
import { useAuth } from '../contexts/AuthContext'
import { usePagination } from '../hooks/usePagination'
import { canWriteProperties, isBroker, isSaasReadOnly } from '../permissions'
import type { Property } from '../types'

const statusLabel: Record<Property['status'], string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  archived: 'Despublicado',
}

export function PropertiesPage() {
  const { user } = useAuth()
  const canWrite = canWriteProperties(user)
  const readOnly = isSaasReadOnly(user)
  const [items, setItems] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pagination = usePagination(items)

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
          <div className="page-title-row">
            <h1>Imóveis</h1>
            <span className="page-title-sep" aria-hidden="true">
              -
            </span>
            <span className="page-title-hint">
              {readOnly
                ? 'somente leitura'
                : isBroker(user)
                  ? 'Imóveis sob sua responsabilidade'
                  : 'Cadastro e publicação na vitrine'}
            </span>
            {readOnly && (
              <>
                <span className="page-title-sep" aria-hidden="true">
                  -
                </span>
                <span className="page-title-hint">Visão global</span>
              </>
            )}
          </div>
        </div>
        {canWrite && (
          <Link to="/properties/new" className="btn btn-primary">
            Novo imóvel
          </Link>
        )}
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <p className="muted">Carregando…</p>
      ) : items.length === 0 ? (
        <div className="card empty-state">
          <p>Nenhum imóvel cadastrado.</p>
          {canWrite && (
            <Link to="/properties/new" className="btn btn-primary">
              Criar primeiro imóvel
            </Link>
          )}
        </div>
      ) : (
        <div className="table-shell">
          <div className="table-toolbar">
            <TablePagination total={items.length} page={pagination.page} pageCount={pagination.pageCount} pageSize={pagination.pageSize} onPageChange={pagination.setPage} itemLabel="imóveis" />
          </div>
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
              {pagination.pagedItems.map((item) => (
                <tr key={item.id}>
                  <td data-label="Título">{item.title}</td>
                  <td data-label="Cidade">{item.city}</td>
                  <td data-label="Operação">{item.operation === 'rent' ? 'Aluguel' : 'Venda'}</td>
                  <td data-label="Preço">
                    {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td data-label="Status">
                    <span className={`badge badge-${item.status}`}>{statusLabel[item.status]}</span>
                  </td>
                  <td className="actions-cell">
                    <Link to={`/properties/${item.id}`} className="btn btn-ghost btn-sm">
                      {canWrite ? 'Editar' : 'Ver'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
