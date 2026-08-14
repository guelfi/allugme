import { useEffect, useState } from 'react'
import { listClients, type Client } from '../api/clients'
import { TablePagination } from '../components/TablePagination'
import { useAuth } from '../contexts/AuthContext'
import { usePagination } from '../hooks/usePagination'
import { isSaasReadOnly } from '../permissions'

export function ClientsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pagination = usePagination(items)

  useEffect(() => {
    listClients()
      .then(setItems)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <header className="page-header">
        <div>
          <div className="page-title-row">
            <h1>Clientes</h1>
            <span className="page-title-sep" aria-hidden="true">
              -
            </span>
            <span className="page-title-hint">
              {isSaasReadOnly(user)
                ? 'somente leitura'
                : 'Visitantes que solicitaram agenda na vitrine'}
            </span>
            {isSaasReadOnly(user) && (
              <>
                <span className="page-title-sep" aria-hidden="true">
                  -
                </span>
                <span className="page-title-hint">Contas cadastradas no portal</span>
              </>
            )}
          </div>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <p className="muted">Carregando…</p>
      ) : items.length === 0 ? (
        <div className="card empty-state">
          <p>Nenhum cliente/visitante encontrado ainda.</p>
        </div>
      ) : (
        <div className="table-shell">
          <div className="table-toolbar">
            <TablePagination total={items.length} page={pagination.page} pageCount={pagination.pageCount} pageSize={pagination.pageSize} onPageChange={pagination.setPage} itemLabel="clientes" />
          </div>
          <div className="table-wrap card">
            <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>E-mail</th>
                {isSaasReadOnly(user) && <th>Tenant</th>}
                <th>Visitas</th>
                {!isSaasReadOnly(user) && <th>Avaliação</th>}
                {!isSaasReadOnly(user) && <th>Interesse</th>}
                {isSaasReadOnly(user) && <th>Cadastro</th>}
                <th>Última visita</th>
              </tr>
            </thead>
            <tbody>
              {pagination.pagedItems.map((client, index) => (
                <tr key={client.clientUserId ?? `${client.visitorPhone}-${client.tenantId ?? ''}-${index}`}>
                  <td data-label="Nome">{client.visitorName}</td>
                  <td data-label="Telefone">{client.visitorPhone}</td>
                  <td data-label="E-mail">{client.visitorEmail || '—'}</td>
                  {isSaasReadOnly(user) && <td data-label="Tenant">{client.tenantName || '—'}</td>}
                  <td data-label="Visitas">{client.visitCount}</td>
                  {!isSaasReadOnly(user) && <td data-label="Avaliação">{client.averageVisitRating ? `${client.averageVisitRating.toFixed(1)} / 5` : '—'}</td>}
                  {!isSaasReadOnly(user) && <td data-label="Interesse">{client.wantsContact ? 'Solicitou contato' : client.latestInterestLevel?.replaceAll('_', ' ') || '—'}</td>}
                  {isSaasReadOnly(user) && <td data-label="Cadastro">{client.registeredAt ? new Date(client.registeredAt).toLocaleDateString('pt-BR') : '—'}</td>}
                  <td data-label="Última visita">{client.lastVisitAt ? new Date(client.lastVisitAt).toLocaleString('pt-BR') : '—'}</td>
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
