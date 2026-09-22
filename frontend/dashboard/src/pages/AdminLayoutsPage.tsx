import { useEffect, useState } from 'react'
import { listAdminThemeSubmissions, reviewThemeSubmission, type ThemeSubmission } from '../api/theme'

const statusLabel: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Recusado',
}

export function AdminLayoutsPage() {
  const [items, setItems] = useState<ThemeSubmission[]>([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function refresh(status = filter) {
    setLoading(true)
    setError(null)
    try {
      setItems(await listAdminThemeSubmissions(status || undefined))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar layouts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh(filter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  async function review(id: string, decision: 'approve' | 'reject') {
    const notes = window.prompt(decision === 'reject' ? 'Motivo da recusa (opcional)' : 'Nota (opcional)') ?? undefined
    setError(null)
    setMessage(null)
    try {
      await reviewThemeSubmission(id, decision, notes)
      setMessage(decision === 'approve' ? 'Layout aprovado. O tenant já pode ativá-lo.' : 'Layout recusado.')
      await refresh(filter)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao validar layout')
    }
  }

  return (
    <div>
      <header className="page-header">
        <div>
          <div className="page-title-row">
            <h1>Layouts próprios</h1>
            <span className="page-title-sep" aria-hidden="true">
              -
            </span>
            <span className="page-title-hint">Validar antes de liberar na vitrine</span>
          </div>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <label className="field" style={{ maxWidth: 220, marginBottom: '1rem' }}>
        Status
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="pending">Pendentes</option>
          <option value="approved">Aprovados</option>
          <option value="rejected">Recusados</option>
          <option value="">Todos</option>
        </select>
      </label>

      {loading ? (
        <p className="muted">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="muted">Nenhum layout neste filtro.</p>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Versão</th>
                <th>Arquivo</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.tenantName}</td>
                  <td>v{item.version}</td>
                  <td>{item.originalFileName}</td>
                  <td>{statusLabel[item.status] ?? item.status}</td>
                  <td>
                    {item.status === 'pending' && (
                      <>
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => void review(item.id, 'approve')}>
                          Aprovar
                        </button>{' '}
                        <button type="button" className="btn btn-sm btn-ghost" onClick={() => void review(item.id, 'reject')}>
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
