import { type FormEvent, useEffect, useState } from 'react'
import { createTenant, listTenants, updateTenantPlan, updateTenantStatus } from '../api/tenants'
import type { Tenant } from '../types'

const statusLabel: Record<string, string> = {
  active: 'Ativo',
  suspended: 'Suspenso',
  pending: 'Pendente',
  pending_payment: 'Aguardando Pix',
}

export function TenantsPage() {
  const [items, setItems] = useState<Tenant[]>([])
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listTenants()
      .then(setItems)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    try {
      const tenant = await createTenant({ name, slug })
      setItems((prev) => [...prev, tenant])
      setName('')
      setSlug('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar tenant')
    }
  }

  async function toggleStatus(tenant: Tenant) {
    const next = tenant.status === 'active' ? 'suspended' : 'active'
    try {
      const updated = await updateTenantStatus(tenant.id, next)
      setItems((prev) => prev.map((t) => (t.id === tenant.id ? updated : t)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status')
    }
  }

  async function activatePending(tenant: Tenant) {
    try {
      const updated = await updateTenantStatus(tenant.id, 'active')
      setItems((prev) => prev.map((t) => (t.id === tenant.id ? updated : t)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ativar tenant')
    }
  }

  async function adjustExtras(tenant: Tenant, delta: number) {
    if (tenant.type === 'independent') return
    const next = Math.max(0, (tenant.extraBrokerSlots ?? 0) + delta)
    try {
      const updated = await updateTenantPlan(tenant.id, { extraBrokerSlots: next })
      setItems((prev) => prev.map((t) => (t.id === tenant.id ? updated : t)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ajustar assentos')
    }
  }

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Tenants</h1>
          <p className="muted">Administração SaaS — imobiliárias e limites de corretores</p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <p className="muted" style={{ margin: 0 }}>
          Visão SaaS: ative contas após Pix e ajuste assentos extras. Dados de imóveis, visitas e
          clientes são somente leitura nos respectivos menus.
        </p>
      </div>

      <form className="card form-grid" onSubmit={(e) => void handleCreate(e)} hidden>
        <h2>Nova imobiliária</h2>
        <label>
          Nome
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Slug (vitrine /allugme/t/{'{slug}'})
          <input value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </label>
        <button type="submit" className="btn btn-primary">
          Criar tenant
        </button>
      </form>

      {loading ? (
        <p className="muted">Carregando…</p>
      ) : (
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Plano</th>
                <th>Assentos</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((tenant) => (
                <tr key={tenant.id}>
                  <td>
                    <strong>{tenant.name}</strong>
                    <div className="muted">{tenant.slug}</div>
                  </td>
                  <td>{tenant.type === 'independent' ? 'Independente' : 'Imobiliária'}</td>
                  <td>{tenant.plan === 'yearly' ? 'Anual' : 'Mensal'}</td>
                  <td>
                    {tenant.type === 'independent' ? (
                      '1 (fixo)'
                    ) : (
                      <div className="actions-cell">
                        <span>
                          {(tenant.includedBrokerSlots ?? 5) + (tenant.extraBrokerSlots ?? 0)}
                          {' '}
                          ({tenant.includedBrokerSlots ?? 5}+{tenant.extraBrokerSlots ?? 0})
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => void adjustExtras(tenant, 1)}
                          title="Adicionar corretor extra"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => void adjustExtras(tenant, -1)}
                          title="Remover corretor extra"
                          disabled={(tenant.extraBrokerSlots ?? 0) <= 0}
                        >
                          −1
                        </button>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${tenant.status === 'pending_payment' ? 'pending' : tenant.status}`}>
                      {statusLabel[tenant.status] ?? tenant.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {(tenant.status === 'pending_payment' || tenant.status === 'pending') && (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => void activatePending(tenant)}
                      >
                        Ativar
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => void toggleStatus(tenant)}
                    >
                      {tenant.status === 'active' ? 'Suspender' : 'Ativar/Reativar'}
                    </button>
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
