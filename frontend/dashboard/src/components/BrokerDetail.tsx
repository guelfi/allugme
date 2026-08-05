import { useEffect, useState } from 'react'
import { listVisits } from '../api/visits'
import type { BrokerSeat } from '../api/brokers'
import type { Visit } from '../types'
import { Tabs } from './Tabs'

const roleLabel: Record<string, string> = {
  agency_admin: 'Administrador',
  broker: 'Corretor',
  independent_broker: 'Corretor independente',
}

const statusLabel: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmada',
  declined: 'Recusada',
  rejected: 'Recusada',
  cancelled: 'Cancelada',
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function VisitGroup({ title, visits }: { title: string; visits: Visit[] }) {
  return (
    <div style={{ marginBottom: '1.1rem' }}>
      <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--muted)', margin: '0 0 0.5rem' }}>
        {title} ({visits.length})
      </h3>
      {visits.length === 0 ? (
        <p className="muted">Nenhuma visita.</p>
      ) : (
        <div className="visit-list">
          {visits.map((v) => (
            <div key={v.id} className="visit-item">
              <div>
                <strong>{v.propertyTitle}</strong>
                <div className="muted">
                  {v.visitorName} · {formatDateTime(v.startAt)}
                </div>
              </div>
              <span className={`badge badge-${v.status}`}>{statusLabel[v.status] ?? v.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function BrokerDetail({ broker }: { broker: BrokerSeat }) {
  const [tab, setTab] = useState('data')
  const [visits, setVisits] = useState<Visit[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (tab !== 'visits' || visits !== null) return
    listVisits({ brokerId: broker.userId })
      .then(setVisits)
      .catch((err: Error) => setError(err.message))
  }, [tab, visits, broker.userId])

  const now = Date.now()
  const upcoming = (visits ?? [])
    .filter((v) => new Date(v.startAt).getTime() >= now)
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
  const past = (visits ?? [])
    .filter((v) => new Date(v.startAt).getTime() < now)
    .sort((a, b) => b.startAt.localeCompare(a.startAt))

  return (
    <div>
      <div className="broker-card-header">
        <div className="avatar-preview" style={{ width: 56, height: 56, fontSize: '1.3rem' }}>
          {broker.avatarUrl ? (
            <img src={broker.avatarUrl} alt={broker.name} />
          ) : (
            <span aria-hidden="true">{broker.name.trim().charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div>
          <strong style={{ display: 'block', fontSize: '1.1rem' }}>{broker.name}</strong>
          <span className="muted">{roleLabel[broker.role] ?? broker.role}</span>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'data', label: 'Dados' },
          { id: 'visits', label: 'Visitas' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'data' && (
        <dl className="detail-list">
          <dt>E-mail</dt>
          <dd>{broker.email}</dd>
          <dt>WhatsApp</dt>
          <dd>{broker.phone || '—'}</dd>
          <dt>Cadastrado em</dt>
          <dd>{new Date(broker.createdAt).toLocaleDateString('pt-BR')}</dd>
          <dt>Foto de rosto</dt>
          <dd className={broker.avatarUrl ? undefined : 'muted'}>
            {broker.avatarUrl ? 'Cadastrada' : 'Não cadastrada — publicações bloqueadas até enviar.'}
          </dd>
        </dl>
      )}

      {tab === 'visits' && (
        <div>
          {error && <div className="alert alert-error">{error}</div>}
          {visits === null ? (
            <p className="muted">Carregando…</p>
          ) : (
            <>
              <VisitGroup title="Próximas visitas" visits={upcoming} />
              <VisitGroup title="Visitas realizadas" visits={past} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
