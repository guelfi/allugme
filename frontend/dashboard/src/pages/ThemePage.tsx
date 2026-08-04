import { type FormEvent, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getTheme, OFFICIAL_THEMES, updateTheme } from '../api/theme'
import { useAuth } from '../contexts/AuthContext'
import { canEditTheme } from '../permissions'
import type { ThemeConfig } from '../types'

export function ThemePage() {
  const { user } = useAuth()
  const [form, setForm] = useState<ThemeConfig>({ themeId: 'moderno' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!canEditTheme(user)) return
    getTheme()
      .then(setForm)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user])

  if (!canEditTheme(user)) {
    return <Navigate to="/painel" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const saved = await updateTheme(form)
      setForm(saved)
      setMessage('Tema da vitrine atualizado.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar tema')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="muted">Carregando…</p>

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Tema da vitrine</h1>
          <p className="muted">Layout público em /allugme/t/seu-slug</p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <form className="card form-grid" onSubmit={(e) => void handleSubmit(e)}>
        <div className="theme-grid">
          {OFFICIAL_THEMES.map((theme) => (
            <label
              key={theme.id}
              className={`theme-option ${form.themeId === theme.id ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="themeId"
                value={theme.id}
                checked={form.themeId === theme.id}
                onChange={() => setForm({ ...form, themeId: theme.id })}
              />
              <span>{theme.label}</span>
            </label>
          ))}
        </div>
        <label>
          Cor primária (opcional)
          <input
            type="color"
            value={form.primaryColor ?? '#0f766e'}
            onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
          />
        </label>
        <label>
          URL do logo (opcional)
          <input
            type="url"
            value={form.logoUrl ?? ''}
            onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar tema'}
        </button>
      </form>
    </div>
  )
}
