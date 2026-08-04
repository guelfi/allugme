import { type FormEvent, useEffect, useState } from 'react'
import { createTenant, listTenants, updateTenantStatus } from '../api/tenants'
import type { Tenant } from '../types'

const statusLabel: Record<Tenant['status'], string> = {
  active: 'Ativo',
  suspended: 'Suspenso',
  pending: 'Pendente',
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

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Tenants</h1>
          <p className="muted">Administração SaaS — imobiliárias na plataforma</p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="card form-grid" onSubmit={(e) => void handleCreate(e)}>
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
                <th>Slug</th>
                <th>Status</th>
                <th>Criado em</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((tenant) => (
                <tr key={tenant.id}>
                  <td>{tenant.name}</td>
                  <td>{tenant.slug}</td>
                  <td>
                    <span className={`badge badge-${tenant.status}`}>
                      {statusLabel[tenant.status]}
                    </span>
                  </td>
                  <td>{new Date(tenant.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => void toggleStatus(tenant)}
                    >
                      {tenant.status === 'active' ? 'Suspender' : 'Ativar'}
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
