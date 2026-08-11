import { useEffect, useState } from 'react'
import { claimVisits, listMyVisits } from '../api/portal'
import { TablePagination } from '../components/TablePagination'
import { usePagination } from '../hooks/usePagination'
import type { Visit } from '../types'

const statusLabel: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmada',
  declined: 'Recusada',
  rejected: 'Recusada',
  cancelled: 'Cancelada',
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export function PortalVisitsPage() {
  const [items, setItems] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const pagination = usePagination(items)

  async function reload() {
    setLoading(true)
    try {
      setItems(await listMyVisits())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar visitas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  async function handleClaim() {
    setError(null)
    setMessage(null)
    try {
      const result = await claimVisits()
      setMessage(
        result.claimed > 0
          ? `${result.claimed} visita(s) vinculada(s) à sua conta.`
          : 'Nenhuma visita pendente para vincular.',
      )
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao vincular visitas')
    }
  }

  return (
    <div>
      <header className="page-header">
        <div>
          <div className="page-title-row">
            <h1>Minhas visitas</h1>
            <span className="page-title-sep" aria-hidden="true">
              -
            </span>
            <span className="page-title-hint">Pendentes, confirmadas e histórico</span>
          </div>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => void handleClaim()}>
          Vincular visitas do meu e-mail
        </button>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {loading ? (
        <p className="muted">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="muted">Nenhuma visita encontrada.</p>
      ) : (
        <div className="table-shell">
          <div className="table-toolbar">
            <TablePagination total={items.length} page={pagination.page} pageCount={pagination.pageCount} pageSize={pagination.pageSize} onPageChange={pagination.setPage} itemLabel="visitas" />
          </div>
          <div className="table-wrap card">
            <table>
            <thead>
              <tr>
                <th>Imóvel</th>
                <th>Data</th>
                <th>Corretor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pagination.pagedItems.map((visit) => (
                <tr key={visit.id}>
                  <td data-label="Imóvel">{visit.propertyTitle}</td>
                  <td data-label="Data">{formatDateTime(visit.startAt)}</td>
                  <td data-label="Corretor">{visit.brokerName ?? '—'}</td>
                  <td data-label="Status">
                    <span className={`badge badge-${visit.status}`}>
                      {statusLabel[visit.status] ?? visit.status}
                    </span>
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
