import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createProperty,
  deleteProperty,
  getProperty,
  publishProperty,
  updateProperty,
} from '../api/properties'

const emptyForm = {
  title: '',
  address: '',
  city: '',
  operation: 'rent' as 'rent' | 'sale',
  type: 'apartment',
  price: 0,
}

export function PropertyFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isNew) return
    getProperty(id!)
      .then((property) =>
        setForm({
          title: property.title,
          address: property.address,
          city: property.city,
          operation: property.operation,
          type: property.type,
          price: property.price,
        }),
      )
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, isNew])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const saved = isNew
        ? await createProperty(form)
        : await updateProperty(id!, form)
      navigate(`/properties/${saved.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    if (!id || isNew) return
    setSaving(true)
    try {
      await publishProperty(id)
      navigate('/properties')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao publicar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!id || isNew || !confirm('Remover este imóvel?')) return
    await deleteProperty(id)
    navigate('/properties')
  }

  if (loading) return <p className="muted">Carregando…</p>

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>{isNew ? 'Novo imóvel' : 'Editar imóvel'}</h1>
          <Link to="/properties" className="muted">
            ← Voltar
          </Link>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="card form-grid" onSubmit={(e) => void handleSubmit(e)}>
        <label>
          Título
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </label>
        <label>
          Endereço
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            required
          />
        </label>
        <label>
          Cidade
          <input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            required
          />
        </label>
        <label>
          Operação
          <select
            value={form.operation}
            onChange={(e) =>
              setForm({ ...form, operation: e.target.value as 'rent' | 'sale' })
            }
          >
            <option value="rent">Aluguel</option>
            <option value="sale">Venda</option>
          </select>
        </label>
        <label>
          Tipo
          <input
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />
        </label>
        <label>
          Preço (R$)
          <input
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            required
          />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
          {!isNew && (
            <>
              <button type="button" className="btn btn-secondary" onClick={() => void handlePublish()}>
                Publicar
              </button>
              <button type="button" className="btn btn-danger" onClick={() => void handleDelete()}>
                Excluir
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  )
}
