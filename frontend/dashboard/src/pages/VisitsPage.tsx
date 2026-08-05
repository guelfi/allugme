import { type FormEvent, useEffect, useState } from 'react'
import { createBlock, deleteBlock, listBlocks, type CalendarBlock } from '../api/agenda'
import { listVisits, updateVisitStatus } from '../api/visits'
import { Tabs } from '../components/Tabs'
import { useAuth } from '../contexts/AuthContext'
import { canManageVisits, isBroker, isSaasReadOnly } from '../permissions'
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

export function VisitsPage() {
  const { user } = useAuth()
  const canManage = canManageVisits(user)
  const readOnly = isSaasReadOnly(user)
  const showAgendaBlocks = isBroker(user) || user?.membershipRole === 'independent_broker'
  const [items, setItems] = useState<Visit[]>([])
  const [blocks, setBlocks] = useState<CalendarBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('')
  const [blockStart, setBlockStart] = useState('')
  const [blockEnd, setBlockEnd] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [tab, setTab] = useState<'agenda' | 'blocks'>('agenda')

  async function reload() {
    setLoading(true)
    try {
      const visits = await listVisits(filter ? { status: filter } : undefined)
      setItems(visits)
      if (showAgendaBlocks) {
        setBlocks(await listBlocks())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar agenda')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, showAgendaBlocks])

  async function handleAction(id: string, status: Visit['status']) {
    try {
      const updated = await updateVisitStatus(id, status)
      setItems((prev) => prev.map((v) => (v.id === id ? updated : v)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar visita')
    }
  }

  async function handleCreateBlock(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      const created = await createBlock({
        startAt: new Date(blockStart).toISOString(),
        endAt: new Date(blockEnd).toISOString(),
        reason: blockReason || undefined,
      })
      setBlocks((prev) => [...prev, created].sort((a, b) => a.startAt.localeCompare(b.startAt)))
      setBlockStart('')
      setBlockEnd('')
      setBlockReason('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao bloquear horário')
    }
  }

  async function handleDeleteBlock(id: string) {
    try {
      await deleteBlock(id)
      setBlocks((prev) => prev.filter((b) => b.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover bloqueio')
    }
  }

  const showBlockTab = showAgendaBlocks && canManage

  const agendaContent = (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Todos</option>
          <option value="pending">Pendentes</option>
          <option value="confirmed">Confirmadas</option>
          <option value="declined">Recusadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
      </div>

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
                <th>Corretor</th>
                <th>Horário</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((visit) => (
                <tr key={visit.id}>
                  <td data-label="Imóvel">{visit.propertyTitle}</td>
                  <td data-label="Visitante">{visit.visitorName}</td>
                  <td data-label="Telefone">{visit.visitorPhone}</td>
                  <td data-label="Corretor">{visit.brokerName || '—'}</td>
                  <td data-label="Horário">{formatDateTime(visit.startAt)}</td>
                  <td data-label="Status">
                    <span className={`badge badge-${visit.status}`}>
                      {statusLabel[visit.status] ?? visit.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {canManage && visit.status === 'pending' && (
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
    </>
  )

  return (
    <div>
      <header className="page-header">
        <div>
          <div className="page-title-row">
            <h1>{isBroker(user) ? 'Minha agenda' : 'Agenda de visitas'}</h1>
            {readOnly && (
              <>
                <span className="page-title-sep" aria-hidden="true">
                  -
                </span>
                <span className="page-title-hint">somente leitura</span>
              </>
            )}
          </div>
          <p className="muted">
            {readOnly ? 'Visão global' : 'Confirme ou recuse solicitações da vitrine'}
          </p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {showBlockTab ? (
        <>
          <Tabs
            tabs={[
              { id: 'agenda', label: 'Agenda' },
              { id: 'blocks', label: 'Bloquear horário' },
            ]}
            active={tab}
            onChange={(id) => setTab(id as 'agenda' | 'blocks')}
          />

          {tab === 'agenda' && agendaContent}

          {tab === 'blocks' && (
            <form className="card form-grid form-grid-2col" onSubmit={(e) => void handleCreateBlock(e)}>
              <label>
                Início
                <input
                  type="datetime-local"
                  value={blockStart}
                  onChange={(e) => setBlockStart(e.target.value)}
                  required
                />
              </label>
              <label>
                Fim
                <input
                  type="datetime-local"
                  value={blockEnd}
                  onChange={(e) => setBlockEnd(e.target.value)}
                  required
                />
              </label>
              <label className="full-row">
                Motivo (opcional)
                <input value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
              </label>
              <div className="full-row">
                <button type="submit" className="btn btn-secondary">
                  Adicionar bloqueio
                </button>
              </div>
              {blocks.length > 0 && (
                <div className="table-wrap full-row">
                  <table>
                    <thead>
                      <tr>
                        <th>Início</th>
                        <th>Fim</th>
                        <th>Motivo</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {blocks.map((b) => (
                        <tr key={b.id}>
                          <td data-label="Início">{formatDateTime(b.startAt)}</td>
                          <td data-label="Fim">{formatDateTime(b.endAt)}</td>
                          <td data-label="Motivo">{b.reason || '—'}</td>
                          <td className="actions-cell">
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost"
                              onClick={() => void handleDeleteBlock(b.id)}
                            >
                              Remover
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </form>
          )}
        </>
      ) : (
        agendaContent
      )}
    </div>
  )
}
