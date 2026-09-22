import { type FormEvent, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  getTheme,
  getThemeModel,
  OFFICIAL_THEMES,
  submitCustomTheme,
  updateTheme,
  type ThemeModel,
} from '../api/theme'
import { useAuth } from '../contexts/AuthContext'
import { canEditTheme } from '../permissions'
import type { ThemeConfig } from '../types'

const statusLabel: Record<string, string> = {
  pending: 'Aguardando validação',
  approved: 'Aprovado — pode ativar',
  rejected: 'Recusado',
}

export function ThemePage() {
  const { user } = useAuth()
  const [form, setForm] = useState<ThemeConfig>({ themeId: 'moderno' })
  const [model, setModel] = useState<ThemeModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!canEditTheme(user)) return
    Promise.all([getTheme(), getThemeModel()])
      .then(([theme, themeModel]) => {
        setForm(theme)
        setModel(themeModel)
      })
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

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input = event.currentTarget.elements.namedItem('package') as HTMLInputElement | null
    const file = input?.files?.[0]
    if (!file) {
      setError('Selecione o ZIP do layout.')
      return
    }
    setUploading(true)
    setError(null)
    setMessage(null)
    try {
      await submitCustomTheme(file)
      const refreshed = await getTheme()
      setForm(refreshed)
      setMessage('Layout enviado. Ele só poderá ser usado depois da validação no painel administrativo.')
      if (input) input.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar o layout')
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <p className="muted">Carregando…</p>

  const approved = (form.submissions ?? []).filter((s) => s.status === 'approved')

  return (
    <div>
      <header className="page-header">
        <div>
          <div className="page-title-row">
            <h1>Tema da vitrine</h1>
            <span className="page-title-sep" aria-hidden="true">
              -
            </span>
            <span className="page-title-hint">Layouts oficiais agora; layout próprio só após aprovação</span>
          </div>
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
          {approved.map((item) => (
            <label
              key={item.id}
              className={`theme-option ${form.themeId === item.themeKey ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="themeId"
                value={item.themeKey}
                checked={form.themeId === item.themeKey}
                onChange={() => setForm({ ...form, themeId: item.themeKey })}
              />
              <span>Próprio v{item.version}</span>
            </label>
          ))}
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar tema'}
        </button>
      </form>

      <section className="card" style={{ marginTop: '1.25rem' }}>
        <h2>Layout próprio</h2>
        <p className="muted">
          Envie um ZIP no modelo publicado. A vitrine pública só usa esse layout depois da validação
          pelo administrador Allugme.
        </p>
        {model && (
          <p className="muted">
            Arquivos obrigatórios: {model.requiredFiles.join(', ')}.
          </p>
        )}
        <form className="form-grid" onSubmit={(e) => void handleUpload(e)}>
          <label>
            Pacote ZIP
            <input name="package" type="file" accept=".zip,application/zip" />
          </label>
          <button type="submit" className="btn btn-ghost" disabled={uploading}>
            {uploading ? 'Enviando…' : 'Enviar para validação'}
          </button>
        </form>
        {(form.submissions ?? []).length > 0 && (
          <ul className="muted" style={{ marginTop: '1rem' }}>
            {(form.submissions ?? []).map((item) => (
              <li key={item.id}>
                v{item.version} · {item.originalFileName} · {statusLabel[item.status] ?? item.status}
                {item.reviewNotes ? ` — ${item.reviewNotes}` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
