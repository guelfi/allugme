import { type FormEvent, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  deactivateBroker,
  fetchTeam,
  inviteBroker,
  resendInvite,
  type BrokerQuota,
  type BrokerSeat,
} from '../api/brokers'
import { BrokerDetail } from '../components/BrokerDetail'
import { Modal } from '../components/Modal'
import { TablePagination } from '../components/TablePagination'
import { useAuth } from '../contexts/AuthContext'
import { usePagination } from '../hooks/usePagination'

const roleLabel: Record<string, string> = {
  agency_admin: 'Administrador',
  broker: 'Corretor',
  independent_broker: 'Corretor independente',
}

type ModalMode = 'invite' | null

export function TeamPage() {
  const { canManageBrokers, isIndependent } = useAuth()
  const [quota, setQuota] = useState<BrokerQuota | null>(null)
  const [members, setMembers] = useState<BrokerSeat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedMember, setSelectedMember] = useState<BrokerSeat | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const pagination = usePagination(members)

  useEffect(() => {
    if (!canManageBrokers) return
    fetchTeam()
      .then((data) => {
        setQuota(data.quota)
        setMembers(data.members)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [canManageBrokers])

  if (isIndependent || !canManageBrokers) {
    return <Navigate to="/painel" replace />
  }

  function resetForm() {
    setName('')
    setEmail('')
    setPhone('')
  }

  function closeModal() {
    setModalMode(null)
    resetForm()
  }

  function onCreated(created: BrokerSeat) {
    setMembers((prev) => [...prev, created])
    setQuota((prev) =>
      prev
        ? {
            ...prev,
            usedBrokerSlots: prev.usedBrokerSlots + 1,
            remainingBrokerSlots: Math.max(0, prev.remainingBrokerSlots - 1),
          }
        : prev,
    )
    closeModal()
  }

  async function handleInvite(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const created = await inviteBroker({
        name,
        email,
        phone: phone || undefined,
      })
      onCreated(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao convidar corretor')
    } finally {
      setSaving(false)
    }
  }

  async function handleResend(member: BrokerSeat) {
    if (
      member.status === 'active' &&
      !confirm(`Enviar um novo convite para ${member.name}? O acesso atual ficará bloqueado até a conclusão do convite.`)
    ) return
    setError(null)
    setResendingId(member.userId)
    try {
      await resendInvite(member.userId)
      setMembers((prev) =>
        prev.map((item) =>
          item.userId === member.userId ? { ...item, status: 'invited' } : item,
        ),
      )
      if (member.status === 'inactive') {
        setQuota((prev) =>
          prev
            ? {
                ...prev,
                usedBrokerSlots: prev.usedBrokerSlots + 1,
                remainingBrokerSlots: Math.max(0, prev.remainingBrokerSlots - 1),
              }
            : prev,
        )
      }
      setError(null)
      alert(`Convite reenviado para ${member.email}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao reenviar convite')
    } finally {
      setResendingId(null)
    }
  }

  async function handleDeactivate(member: BrokerSeat) {
    if (!confirm(`Inativar o acesso de ${member.name}? O histórico será preservado.`)) return
    setError(null)
    try {
      const updated = await deactivateBroker(member.userId)
      setMembers((prev) => prev.map((item) => (item.userId === member.userId ? updated : item)))
      setQuota((prev) =>
        prev
          ? {
            ...prev,
            usedBrokerSlots: Math.max(0, prev.usedBrokerSlots - 1),
            remainingBrokerSlots: prev.remainingBrokerSlots + 1,
          }
          : prev,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao inativar corretor')
    }
  }

  const atLimit = (quota?.remainingBrokerSlots ?? 0) <= 0
  const missingAvatarCount = members.filter(
    (m) => !m.avatarUrl && m.status === 'active',
  ).length

  return (
    <div>
      <header className="page-header">
        <div>
          <div className="page-title-row">
            <h1>Equipe</h1>
            <span className="page-title-sep" aria-hidden="true">
              -
            </span>
            <span className="page-title-hint">
              Cadastre corretores até o limite do plano da imobiliária
            </span>
          </div>
        </div>
        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              resetForm()
              setModalMode('invite')
            }}
            disabled={loading || atLimit}
            title={atLimit ? 'Limite de assentos atingido' : undefined}
          >
            Convidar por e-mail
          </button>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {missingAvatarCount > 0 && (
        <div className="alert alert-warning">
          {missingAvatarCount === 1
            ? '1 corretor está sem foto de rosto cadastrada.'
            : `${missingAvatarCount} corretores estão sem foto de rosto cadastrada.`}{' '}
          A foto é obrigatória para que o corretor afiliado possa usar o sistema (agendar visitas e
          ter imóveis publicados).
        </div>
      )}

      {loading ? (
        <p className="muted">Carregando…</p>
      ) : (
        <>
          {quota && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <p style={{ margin: 0 }}>
                Plano <strong>{quota.plan === 'yearly' ? 'Anual' : 'Mensal'}</strong>
                {' · '}
                {quota.usedBrokerSlots}/{quota.maxBrokerSlots} assentos em uso
                {quota.extraBrokerSlots > 0
                  ? ` (${quota.includedBrokerSlots} inclusos + ${quota.extraBrokerSlots} extras)`
                  : ` (${quota.includedBrokerSlots} inclusos)`}
              </p>
              {atLimit && (
                <p className="muted" style={{ margin: '0.5rem 0 0' }}>
                  Limite atingido. Para mais corretores, solicite assentos extras ao administrador
                  Allugme (R$ 39,00/mês no mensal ou R$ 190,00/ano no anual).
                </p>
              )}
            </div>
          )}

          <div className="table-shell">
            <div className="table-toolbar">
              <TablePagination total={members.length} page={pagination.page} pageCount={pagination.pageCount} pageSize={pagination.pageSize} onPageChange={pagination.setPage} itemLabel="corretores" />
            </div>
            <div className="table-wrap card">
              <table>
              <thead>
                <tr>
                  <th />
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Papel</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pagination.pagedItems.map((member) => (
                  <tr
                    key={member.userId}
                    className="clickable-row"
                    onClick={() => setSelectedMember(member)}
                  >
                    <td data-label="Foto">
                      <div
                        className="avatar-preview avatar-preview-sm"
                        title={member.avatarUrl ? '' : 'Sem foto de rosto cadastrada'}
                      >
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.name} />
                        ) : (
                          <span aria-hidden="true">{member.name.trim().charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    </td>
                    <td data-label="Nome">
                      {member.name}
                      {member.status === 'invited' && (
                        <span className="badge badge-pending" style={{ marginLeft: '0.5rem' }}>
                          Convidado
                        </span>
                      )}
                      {member.status === 'inactive' && (
                        <span className="badge badge-suspended" style={{ marginLeft: '0.5rem' }}>
                          Inativo
                        </span>
                      )}
                      {!member.avatarUrl && member.status !== 'invited' && (
                        <span className="badge badge-pending" style={{ marginLeft: '0.5rem' }}>
                          Sem foto
                        </span>
                      )}
                    </td>
                    <td data-label="E-mail">{member.email}</td>
                    <td data-label="Papel">{roleLabel[member.role] ?? member.role}</td>
                    <td className="actions-cell">
                      {member.role === 'broker' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          disabled={resendingId === member.userId || (member.status === 'inactive' && atLimit)}
                          onClick={(e) => {
                            e.stopPropagation()
                            void handleResend(member)
                          }}
                        >
                          {resendingId === member.userId
                            ? 'Enviando…'
                            : member.status === 'invited'
                              ? 'Reenviar convite'
                              : 'Novo convite de acesso'}
                        </button>
                      )}
                      {member.role === 'broker' && !member.isCurrentUser && member.status !== 'inactive' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={(e) => {
                            e.stopPropagation()
                            void handleDeactivate(member)
                          }}
                        >
                          Inativar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {modalMode === 'invite' && (
        <Modal title="Convidar por e-mail" onClose={closeModal}>
          <form className="form-grid" onSubmit={(e) => void handleInvite(e)}>
            <p className="muted" style={{ margin: 0 }}>
              O corretor recebe um e-mail para definir senha, telefone e foto de perfil.
            </p>
            <label>
              Nome
              <input value={name} onChange={(e) => setName(e.target.value)} required disabled={atLimit} />
            </label>
            <label>
              E-mail
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={atLimit}
              />
            </label>
            <label>
              WhatsApp (opcional)
              <input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={atLimit} />
            </label>
            <button type="submit" className="btn btn-primary" disabled={saving || atLimit}>
              {saving ? 'Enviando…' : 'Enviar convite'}
            </button>
          </form>
        </Modal>
      )}

      {selectedMember && (
        <Modal title={selectedMember.name} onClose={() => setSelectedMember(null)}>
          <BrokerDetail broker={selectedMember} />
        </Modal>
      )}
    </div>
  )
}
