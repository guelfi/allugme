import { type FormEvent, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  createProperty,
  deleteProperty,
  getProperty,
  publishProperty,
  unpublishProperty,
  updateProperty,
} from '../api/properties'
import { useAuth } from '../contexts/AuthContext'
import { canWriteProperties, isSaasReadOnly } from '../permissions'

const emptyForm = {
  title: '',
  neighborhood: '',
  city: '',
  description: '',
  operation: 'rent' as 'rent' | 'sale',
  propertyType: 'apartment',
  price: 0,
  bedrooms: 2,
  areaSqm: 50,
}

export function PropertyFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canWrite = canWriteProperties(user)
  const readOnly = isSaasReadOnly(user) || !canWrite
  const isNew = !id || id === 'new'
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState<string>('draft')
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isNew) return
    getProperty(id!)
      .then((property) => {
        setForm({
          title: property.title,
          neighborhood: property.neighborhood ?? property.address ?? '',
          city: property.city,
          description: property.description ?? '',
          operation: property.operation,
          propertyType: property.type || 'apartment',
          price: property.price,
          bedrooms: property.bedrooms ?? 2,
          areaSqm: property.areaM2 ?? 50,
        })
        setStatus(property.status)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, isNew])

  if (isNew && !canWrite) {
    return <Navigate to="/properties" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (readOnly) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        title: form.title,
        neighborhood: form.neighborhood,
        city: form.city,
        description: form.description,
        operation: form.operation,
        propertyType: form.propertyType,
        price: form.price,
        bedrooms: form.bedrooms,
        areaSqm: form.areaSqm,
      }
      const saved = isNew ? await createProperty(payload) : await updateProperty(id!, payload)
      navigate(`/properties/${saved.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    if (!id || isNew || readOnly) return
    setSaving(true)
    try {
      await publishProperty(id)
      setStatus('published')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao publicar')
    } finally {
      setSaving(false)
    }
  }

  async function handleUnpublish() {
    if (!id || isNew || readOnly) return
    setSaving(true)
    try {
      await unpublishProperty(id)
      setStatus('archived')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao despublicar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!id || isNew || readOnly || !confirm('Remover este imóvel?')) return
    await deleteProperty(id)
    navigate('/properties')
  }

  if (loading) return <p className="muted">Carregando…</p>

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>{isNew ? 'Novo imóvel' : readOnly ? 'Detalhe do imóvel' : 'Editar imóvel'}</h1>
          <Link to="/properties" className="muted">
            ← Voltar
          </Link>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {readOnly && !isNew && (
        <div className="alert alert-success">Modo visualização — sem permissão de edição.</div>
      )}

      <form className="card form-grid" onSubmit={(e) => void handleSubmit(e)}>
        <label>
          Título
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            disabled={readOnly}
          />
        </label>
        <label>
          Bairro
          <input
            value={form.neighborhood}
            onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
            required
            disabled={readOnly}
          />
        </label>
        <label>
          Cidade
          <input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            required
            disabled={readOnly}
          />
        </label>
        <label>
          Descrição
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            disabled={readOnly}
          />
        </label>
        <label>
          Operação
          <select
            value={form.operation}
            onChange={(e) =>
              setForm({ ...form, operation: e.target.value as 'rent' | 'sale' })
            }
            disabled={readOnly}
          >
            <option value="rent">Aluguel</option>
            <option value="sale">Venda</option>
          </select>
        </label>
        <label>
          Tipo
          <select
            value={form.propertyType}
            onChange={(e) => setForm({ ...form, propertyType: e.target.value })}
            disabled={readOnly}
          >
            <option value="apartment">Apartamento</option>
            <option value="house">Casa</option>
            <option value="commercial">Comercial</option>
            <option value="land">Terreno</option>
          </select>
        </label>
        <label>
          Quartos
          <input
            type="number"
            min={0}
            value={form.bedrooms}
            onChange={(e) => setForm({ ...form, bedrooms: Number(e.target.value) })}
            disabled={readOnly}
          />
        </label>
        <label>
          Área (m²)
          <input
            type="number"
            min={0}
            value={form.areaSqm}
            onChange={(e) => setForm({ ...form, areaSqm: Number(e.target.value) })}
            disabled={readOnly}
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
            disabled={readOnly}
          />
        </label>
        {!readOnly && (
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
            {!isNew && (
              <>
                {status !== 'published' ? (
                  <button type="button" className="btn btn-secondary" onClick={() => void handlePublish()}>
                    Publicar
                  </button>
                ) : (
                  <button type="button" className="btn btn-secondary" onClick={() => void handleUnpublish()}>
                    Despublicar
                  </button>
                )}
                <button type="button" className="btn btn-danger" onClick={() => void handleDelete()}>
                  Excluir
                </button>
              </>
            )}
          </div>
        )}
      </form>
    </div>
  )
}
