import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listTenants, updateTenantPlan, updateTenantStatus } from '../api/tenants'
import type { Tenant } from '../types'

const statusLabel: Record<string, string> = {
  active: 'Ativo',
  suspended: 'Suspenso',
  pending: 'Pendente',
  pending_payment: 'Aguardando Pix',
}

export function TenantsPage() {
  const [items, setItems] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listTenants()
      .then(setItems)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

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
                  <td data-label="Nome">
                    <Link to={`/admin/tenants/${tenant.id}`}>
                      <strong>{tenant.name}</strong>
                    </Link>
                    <div className="muted">{tenant.slug}</div>
                  </td>
                  <td data-label="Tipo">{tenant.type === 'independent' ? 'Independente' : 'Imobiliária'}</td>
                  <td data-label="Plano">{tenant.plan === 'yearly' ? 'Anual' : 'Mensal'}</td>
                  <td data-label="Assentos">
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
                  <td data-label="Status">
                    <span className={`badge badge-${tenant.status === 'pending_payment' ? 'pending' : tenant.status}`}>
                      {statusLabel[tenant.status] ?? tenant.status}
                    </span>
                    {tenant.status === 'pending_payment' && tenant.pixReferenceCode && (
                      <div className="muted" title="Código exibido no Pix copia e cola do cadastro — use para conciliar com o extrato.">
                        Pix ref.: <code>{tenant.pixReferenceCode}</code>
                      </div>
                    )}
                  </td>
                  <td className="actions-cell">
                    <Link to={`/admin/tenants/${tenant.id}`} className="btn btn-sm btn-ghost">
                      Ver detalhes
                    </Link>
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
