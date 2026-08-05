import { type FormEvent, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  createBroker,
  fetchTeam,
  removeBroker,
  type BrokerQuota,
  type BrokerSeat,
} from '../api/brokers'
import { PasswordInput } from '../components/PasswordInput'
import { useAuth } from '../contexts/AuthContext'

const roleLabel: Record<string, string> = {
  agency_admin: 'Administrador',
  broker: 'Corretor',
  independent_broker: 'Corretor independente',
}

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
      setName('')
      setEmail('')
      setPhone('')
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao cadastrar corretor')
    } finally {
      setSaving(false)
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

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Equipe</h1>
          <p className="muted">
            Cadastre corretores até o limite do plano da imobiliária.
          </p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

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

          <form className="card form-grid" onSubmit={(e) => void handleCreate(e)}>
            <h2>Novo corretor</h2>
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

          <div className="table-wrap card" style={{ marginTop: '1rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Papel</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.userId}>
                    <td>{member.name}</td>
                    <td>{member.email}</td>
                    <td>{roleLabel[member.role] ?? member.role}</td>
                    <td className="actions-cell">
                      {member.role === 'broker' && !member.isCurrentUser && (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => void handleRemove(member)}
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
    </div>
  )
}
