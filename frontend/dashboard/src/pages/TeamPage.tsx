import { type FormEvent, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  createBroker,
  fetchTeam,
  inviteBroker,
  removeBroker,
  resendInvite,
  type BrokerQuota,
  type BrokerSeat,
} from '../api/brokers'
import { BrokerDetail } from '../components/BrokerDetail'
import { Modal } from '../components/Modal'
import { PasswordInput } from '../components/PasswordInput'
import { useAuth } from '../contexts/AuthContext'

const roleLabel: Record<string, string> = {
  agency_admin: 'Administrador',
  broker: 'Corretor',
  independent_broker: 'Corretor independente',
}

type ModalMode = 'invite' | 'password' | null

export function TeamPage() {
  const { canManageBrokers, isIndependent } = useAuth()
  const [quota, setQuota] = useState<BrokerQuota | null>(null)
  const [members, setMembers] = useState<BrokerSeat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedMember, setSelectedMember] = useState<BrokerSeat | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)

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
    setPassword('')
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

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const created = await createBroker({
        name,
        email,
        password,
        phone: phone || undefined,
      })
      onCreated(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao cadastrar corretor')
    } finally {
      setSaving(false)
    }
  }

  async function handleResend(member: BrokerSeat) {
    setError(null)
    setResendingId(member.userId)
    try {
      await resendInvite(member.userId)
      setError(null)
      alert(`Convite reenviado para ${member.email}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao reenviar convite')
    } finally {
      setResendingId(null)
    }
  }

  async function handleRemove(member: BrokerSeat) {
    if (!confirm(`Remover ${member.name} da equipe?`)) return
    setError(null)
    try {
      await removeBroker(member.userId)
      setMembers((prev) => prev.filter((m) => m.userId !== member.userId))
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
      setError(err instanceof Error ? err.message : 'Falha ao remover corretor')
    }
  }

  const atLimit = (quota?.remainingBrokerSlots ?? 0) <= 0
  const missingAvatarCount = members.filter(
    (m) => !m.avatarUrl && m.status !== 'invited',
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
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              resetForm()
              setModalMode('password')
            }}
            disabled={loading || atLimit}
            title={atLimit ? 'Limite de assentos atingido' : undefined}
          >
            Adicionar com senha
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
                {members.map((member) => (
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
                      {!member.avatarUrl && member.status !== 'invited' && (
                        <span className="badge badge-pending" style={{ marginLeft: '0.5rem' }}>
                          Sem foto
                        </span>
                      )}
                    </td>
                    <td data-label="E-mail">{member.email}</td>
                    <td data-label="Papel">{roleLabel[member.role] ?? member.role}</td>
                    <td className="actions-cell">
                      {member.status === 'invited' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          disabled={resendingId === member.userId}
                          onClick={(e) => {
                            e.stopPropagation()
                            void handleResend(member)
                          }}
                        >
                          {resendingId === member.userId ? 'Enviando…' : 'Reenviar convite'}
                        </button>
                      )}
                      {member.role === 'broker' && !member.isCurrentUser && (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={(e) => {
                            e.stopPropagation()
                            void handleRemove(member)
                          }}
                        >
                          Remover
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {modalMode === 'password' && (
        <Modal title="Adicionar com senha" onClose={closeModal}>
          <form className="form-grid" onSubmit={(e) => void handleCreate(e)}>
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
            <label>
              Senha inicial
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={atLimit}
                autoComplete="new-password"
              />
            </label>
            <button type="submit" className="btn btn-primary" disabled={saving || atLimit}>
              {saving ? 'Salvando…' : 'Cadastrar corretor'}
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
