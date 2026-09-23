import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getPublicProperty, type PublicProperty } from '../api/publicProperties'
import { createPortalVisit, getPropertyVisitSlots } from '../api/portal'
import { useAuth } from '../contexts/AuthContext'

export function PortalAgendarPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const propertyId = params.get('propertyId') ?? ''
  const [property, setProperty] = useState<PublicProperty | null>(null)
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<Array<{ startAt: string; endAt: string }>>([])
  const [startAt, setStartAt] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!propertyId) {
      setLoading(false)
      return
    }
    setLoading(true)
    getPublicProperty(propertyId)
      .then(setProperty)
      .catch((err) => setError(err instanceof Error ? err.message : 'Imóvel não encontrado.'))
      .finally(() => setLoading(false))
  }, [propertyId])

  async function loadSlots(nextDate: string) {
    setDate(nextDate)
    setStartAt('')
    if (!propertyId || !nextDate) {
      setSlots([])
      return
    }
    try {
      setSlots((await getPropertyVisitSlots(propertyId, nextDate)).slots)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao consultar horários')
      setSlots([])
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!propertyId || !startAt) {
      setError('Escolha um horário disponível.')
      return
    }
    setSending(true)
    setError(null)
    try {
      await createPortalVisit({
        propertyId,
        startAt,
        visitorName: user?.name ?? '',
        visitorPhone: '',
        visitorEmail: user?.email ?? '',
      })
      navigate('/portal/visits', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível agendar.')
    } finally {
      setSending(false)
    }
  }

  if (!propertyId) {
    return (
      <div>
        <header className="page-header">
          <h1>Agendar visita</h1>
        </header>
        <p className="muted">Escolha um imóvel na vitrine ou em Explorar para agendar.</p>
        <p><Link to="/explorar">Buscar imóveis</Link></p>
      </div>
    )
  }

  return (
    <div>
      <header className="page-header">
        <div className="page-title-row">
          <h1>Agendar visita</h1>
          <span className="page-title-sep">-</span>
          <span className="page-title-hint">Horário com o corretor, na sua conta</span>
        </div>
      </header>
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <p className="muted">Carregando imóvel…</p>
      ) : property ? (
        <form className="card" onSubmit={(e) => void handleSubmit(e)} style={{ display: 'grid', gap: '1rem', maxWidth: 520 }}>
          <div>
            <p className="muted" style={{ margin: 0 }}>{property.tenantName}</p>
            <h2 style={{ margin: '0.2rem 0' }}>{property.title}</h2>
            <p className="muted">{[property.neighborhood, property.city].filter(Boolean).join(' · ')}</p>
          </div>
          <label>
            Data
            <input
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => void loadSlots(e.target.value)}
              required
            />
          </label>
          <div>
            <p style={{ margin: '0 0 0.5rem' }}>Horários disponíveis</p>
            <div className="slot-grid">
              {slots.map((slot) => (
                <button
                  key={slot.startAt}
                  type="button"
                  className={startAt === slot.startAt ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                  onClick={() => setStartAt(slot.startAt)}
                >
                  {new Date(slot.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </button>
              ))}
            </div>
            {date && slots.length === 0 && <p className="muted">Nenhum horário nesta data.</p>}
          </div>
          <p className="muted">
            A visita será pedida como {user?.name} ({user?.email}). O corretor confirma pelo WhatsApp.
          </p>
          <button className="btn btn-primary" type="submit" disabled={sending || !startAt}>
            {sending ? 'Enviando…' : 'Confirmar agendamento'}
          </button>
        </form>
      ) : (
        <p className="muted">Imóvel indisponível.</p>
      )}
    </div>
  )
}
