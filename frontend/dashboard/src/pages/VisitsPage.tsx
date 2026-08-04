import { useEffect, useState } from 'react'
import { listVisits, updateVisitStatus } from '../api/visits'
import type { Visit } from '../types'

const statusLabel: Record<Visit['status'], string> = {
  pending: 'Pendente',
  confirmed: 'Confirmada',
  declined: 'Recusada',
  cancelled: 'Cancelada',
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export function VisitsPage() {
  const [items, setItems] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('')

  useEffect(() => {
    listVisits(filter ? { status: filter } : undefined)
      .then(setItems)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [filter])

  async function handleAction(id: string, status: Visit['status']) {
    try {
      const updated = await updateVisitStatus(id, status)
      setItems((prev) => prev.map((v) => (v.id === id ? updated : v)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar visita')
    }
  }

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Agenda de visitas</h1>
          <p className="muted">Confirme ou recuse solicitações da vitrine</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Todos</option>
          <option value="pending">Pendentes</option>
          <option value="confirmed">Confirmadas</option>
          <option value="declined">Recusadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <p className="muted">Carregando…</p>
      ) : items.length === 0 ? (
        <div className="card empty-state">
          <p>Nenhuma visita encontrada.</p>
        </div>
      ) : (
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>Imóvel</th>
                <th>Visitante</th>
                <th>Telefone</th>
                <th>Horário</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((visit) => (
                <tr key={visit.id}>
                  <td>{visit.propertyTitle}</td>
                  <td>{visit.visitorName}</td>
                  <td>{visit.visitorPhone}</td>
                  <td>{formatDateTime(visit.startAt)}</td>
                  <td>
                    <span className={`badge badge-${visit.status}`}>
                      {statusLabel[visit.status]}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {visit.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => void handleAction(visit.id, 'confirmed')}
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => void handleAction(visit.id, 'declined')}
                        >
                          Recusar
                        </button>
                      </>
                    )}
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
