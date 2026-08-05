import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchTeam, type BrokerSeat } from '../api/brokers'
import { getTenant } from '../api/tenants'
import { BrokerDetail } from '../components/BrokerDetail'
import { Modal } from '../components/Modal'
import { Tabs } from '../components/Tabs'
import type { Tenant } from '../types'

const statusLabel: Record<string, string> = {
  active: 'Ativo',
  suspended: 'Suspenso',
  pending: 'Pendente',
  pending_payment: 'Aguardando Pix',
  trial: 'Em teste',
}

const roleLabel: Record<string, string> = {
  agency_admin: 'Administrador',
  broker: 'Corretor',
  independent_broker: 'Corretor independente',
}

export function TenantDetailPage() {
  const { id } = useParams()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [members, setMembers] = useState<BrokerSeat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState('info')
  const [selectedBroker, setSelectedBroker] = useState<BrokerSeat | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([getTenant(id), fetchTeam(id)])
      .then(([tenantData, team]) => {
        setTenant(tenantData)
        setMembers(team.members)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="muted">Carregando…</p>
  if (error) return <div className="alert alert-error">{error}</div>
  if (!tenant) return <div className="alert alert-error">Imobiliária não encontrada.</div>

  const isIndependent = tenant.type === 'independent'
  const soleBroker = members[0]

  return (
    <div>
      <header className="page-header">
        <div>
          <div className="page-title-row">
            <Link to="/admin/tenants" className="page-back-link">
              ← Voltar
            </Link>
            <span className="page-title-sep" aria-hidden="true">
              -
            </span>
            <h1>{tenant.name}</h1>
          </div>
        </div>
      </header>

      {isIndependent ? (
        soleBroker ? (
          <div className="card">
            <BrokerDetail broker={soleBroker} />
          </div>
        ) : (
          <p className="muted">Nenhum corretor encontrado para esta conta.</p>
        )
      ) : (
        <>
          <Tabs
            tabs={[
              { id: 'info', label: 'Imobiliária' },
              { id: 'brokers', label: `Corretores (${members.length})` },
            ]}
            active={tab}
            onChange={setTab}
          />

          {tab === 'info' && (
            <div className="card">
              <dl className="detail-list">
                <dt>Nome</dt>
                <dd>{tenant.name}</dd>
                <dt>Vitrine</dt>
                <dd>/{tenant.slug}</dd>
                <dt>Plano</dt>
                <dd>{tenant.plan === 'yearly' ? 'Anual' : 'Mensal'}</dd>
                <dt>Assentos</dt>
                <dd>
                  {(tenant.includedBrokerSlots ?? 5) + (tenant.extraBrokerSlots ?? 0)} (
                  {tenant.includedBrokerSlots ?? 5}+{tenant.extraBrokerSlots ?? 0})
                </dd>
                <dt>Status</dt>
                <dd>
                  <span className={`badge badge-${tenant.status === 'pending_payment' ? 'pending' : tenant.status}`}>
                    {statusLabel[tenant.status] ?? tenant.status}
                  </span>
                </dd>
                {tenant.status === 'trial' && tenant.trialEndsAt && (
                  <>
                    <dt>Teste grátis expira em</dt>
                    <dd>{new Date(tenant.trialEndsAt).toLocaleDateString('pt-BR')}</dd>
                  </>
                )}
                {tenant.status === 'pending_payment' && tenant.pixReferenceCode && (
                  <>
                    <dt>Pix ref.</dt>
                    <dd>
                      <code>{tenant.pixReferenceCode}</code>
                    </dd>
                  </>
                )}
                <dt>Criado em</dt>
                <dd>{new Date(tenant.createdAt).toLocaleDateString('pt-BR')}</dd>
              </dl>
            </div>
          )}

          {tab === 'brokers' && (
            <div className="table-wrap card">
              {members.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>
                  Nenhum corretor cadastrado ainda.
                </p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th />
                      <th>Nome</th>
                      <th>E-mail</th>
                      <th>Papel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr
                        key={member.userId}
                        className="clickable-row"
                        onClick={() => setSelectedBroker(member)}
                      >
                        <td data-label="Foto">
                          <div className="avatar-preview avatar-preview-sm">
                            {member.avatarUrl ? (
                              <img src={member.avatarUrl} alt={member.name} />
                            ) : (
                              <span aria-hidden="true">{member.name.trim().charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                        </td>
                        <td data-label="Nome">{member.name}</td>
                        <td data-label="E-mail">{member.email}</td>
                        <td data-label="Papel">{roleLabel[member.role] ?? member.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {selectedBroker && (
        <Modal title={selectedBroker.name} onClose={() => setSelectedBroker(null)}>
          <BrokerDetail broker={selectedBroker} />
        </Modal>
      )}
    </div>
  )
}
