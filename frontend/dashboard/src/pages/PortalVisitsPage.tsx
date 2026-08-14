import { type FormEvent, useEffect, useState } from 'react'
import { cancelPortalVisit, claimVisits, getPropertyVisitSlots, listMyVisits, reschedulePortalVisit, submitVisitFeedback } from '../api/portal'
import { TablePagination } from '../components/TablePagination'
import { usePagination } from '../hooks/usePagination'
import type { Visit } from '../types'

const statusLabel: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmada',
  declined: 'Recusada',
  rejected: 'Recusada',
  cancelled: 'Cancelada',
  done: 'Concluída',
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
  const [feedbackVisit, setFeedbackVisit] = useState<Visit | null>(null)
  const [overallRating, setOverallRating] = useState(5)
  const [brokerRating, setBrokerRating] = useState(5)
  const [interestLevel, setInterestLevel] = useState<'not_interested' | 'other_options' | 'interested' | 'make_offer'>('interested')
  const [comment, setComment] = useState('')
  const [wantsContact, setWantsContact] = useState(false)
  const [rescheduleVisit, setRescheduleVisit] = useState<Visit | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [slots, setSlots] = useState<Array<{ startAt: string; endAt: string }>>([])
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

  async function handleCancel(visit: Visit) {
    if (!window.confirm('Deseja cancelar esta visita?')) return
    try { setMessage((await cancelPortalVisit(visit.id)).message); await reload() }
    catch (err) { setError(err instanceof Error ? err.message : 'Falha ao cancelar visita') }
  }

  async function handleFeedback(event: FormEvent) {
    event.preventDefault()
    if (!feedbackVisit) return
    try {
      const result = await submitVisitFeedback(feedbackVisit.id, { overallRating, brokerRating, interestLevel, comment, wantsContact })
      setMessage(result.message); setFeedbackVisit(null); await reload()
    } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao enviar avaliação') }
  }

  function calendarUrl(visit: Visit) {
    const stamp = (value: string) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const params = new URLSearchParams({ action: 'TEMPLATE', text: `Visita — ${visit.propertyTitle}`, dates: `${stamp(visit.startAt)}/${stamp(visit.endAt)}`, details: `Visita com ${visit.brokerName ?? 'corretor Allugme'}` })
    return `https://calendar.google.com/calendar/render?${params}`
  }

  async function loadSlots(visit: Visit, date: string) {
    setRescheduleDate(date)
    if (!date) return setSlots([])
    try { setSlots((await getPropertyVisitSlots(visit.propertyId, date)).slots) }
    catch (err) { setError(err instanceof Error ? err.message : 'Falha ao consultar horários') }
  }

  async function chooseSlot(startAt: string) {
    if (!rescheduleVisit) return
    try { setMessage((await reschedulePortalVisit(rescheduleVisit.id, startAt)).message); setRescheduleVisit(null); await reload() }
    catch (err) { setError(err instanceof Error ? err.message : 'Falha ao reagendar') }
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
                <th>Ações</th>
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
                  <td data-label="Ações" className="table-actions">
                    {visit.status === 'confirmed' && <a className="btn btn-secondary btn-sm" href={calendarUrl(visit)} target="_blank" rel="noreferrer">Agenda</a>}
                    {(visit.status === 'pending' || visit.status === 'confirmed') && <button className="btn btn-secondary btn-sm" type="button" onClick={() => void handleCancel(visit)}>Cancelar</button>}
                    {(visit.status === 'pending' || visit.status === 'confirmed') && <button className="btn btn-secondary btn-sm" type="button" onClick={() => { setRescheduleVisit(visit); setRescheduleDate(''); setSlots([]) }}>Reagendar</button>}
                    {visit.status === 'done' && !visit.hasFeedback && <button className="btn btn-primary btn-sm" type="button" onClick={() => setFeedbackVisit(visit)}>Avaliar</button>}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      )}
      {feedbackVisit && <div className="modal-backdrop" role="presentation"><form className="modal card feedback-form" onSubmit={(e) => void handleFeedback(e)}><h2>Avalie sua visita</h2><p>{feedbackVisit.propertyTitle}</p><label>Experiência geral<select value={overallRating} onChange={(e) => setOverallRating(Number(e.target.value))}>{[5,4,3,2,1].map(n => <option key={n} value={n}>{n} estrela(s)</option>)}</select></label><label>Atendimento do corretor<select value={brokerRating} onChange={(e) => setBrokerRating(Number(e.target.value))}>{[5,4,3,2,1].map(n => <option key={n} value={n}>{n} estrela(s)</option>)}</select></label><label>Interesse<select value={interestLevel} onChange={(e) => setInterestLevel(e.target.value as typeof interestLevel)}><option value="make_offer">Quero fazer proposta</option><option value="interested">Tenho interesse</option><option value="other_options">Quero outras opções</option><option value="not_interested">Não tenho interesse</option></select></label><label>Comentário<textarea value={comment} maxLength={2000} onChange={(e) => setComment(e.target.value)} /></label><label className="checkbox-row"><input type="checkbox" checked={wantsContact} onChange={(e) => setWantsContact(e.target.checked)} /> Quero que entrem em contato</label><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setFeedbackVisit(null)}>Fechar</button><button className="btn btn-primary" type="submit">Enviar avaliação</button></div></form></div>}
      {rescheduleVisit && <div className="modal-backdrop" role="presentation"><section className="modal card"><h2>Reagendar visita</h2><p>{rescheduleVisit.propertyTitle}</p><label>Nova data<input type="date" min={new Date().toISOString().slice(0, 10)} value={rescheduleDate} onChange={(e) => void loadSlots(rescheduleVisit, e.target.value)} /></label><div className="slot-grid">{slots.map((slot) => <button key={slot.startAt} className="btn btn-secondary" type="button" onClick={() => void chooseSlot(slot.startAt)}>{new Date(slot.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</button>)}</div>{rescheduleDate && slots.length === 0 && <p className="muted">Nenhum horário disponível.</p>}<div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setRescheduleVisit(null)}>Fechar</button></div></section></div>}
    </div>
  )
}
