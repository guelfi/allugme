import { useEffect, useState } from 'react'
import { listClients, type Client } from '../api/clients'
import { useAuth } from '../contexts/AuthContext'
import { isSaasReadOnly } from '../permissions'

export function ClientsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listClients()
      .then(setItems)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Clientes</h1>
          <p className="muted">
            {isSaasReadOnly(user)
              ? 'Visitantes agregados de todas as imobiliárias (somente leitura)'
              : 'Visitantes que solicitaram agenda na vitrine'}
          </p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <p className="muted">Carregando…</p>
      ) : items.length === 0 ? (
        <div className="card empty-state">
          <p>Nenhum cliente/visitante encontrado ainda.</p>
        </div>
      ) : (
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>E-mail</th>
                {isSaasReadOnly(user) && <th>Tenant</th>}
                <th>Visitas</th>
                <th>Última visita</th>
              </tr>
            </thead>
            <tbody>
              {items.map((client, index) => (
                <tr key={`${client.visitorPhone}-${client.tenantId ?? ''}-${index}`}>
                  <td>{client.visitorName}</td>
                  <td>{client.visitorPhone}</td>
                  <td>{client.visitorEmail || '—'}</td>
                  {isSaasReadOnly(user) && <td>{client.tenantName || '—'}</td>}
                  <td>{client.visitCount}</td>
                  <td>{new Date(client.lastVisitAt).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
