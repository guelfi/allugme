import { type FormEvent, useEffect, useState } from 'react'
import {
  getTenantSettings,
  sendWhatsAppTest,
  updateTenantSettings,
} from '../api/settings'
import type { TenantSettings } from '../types'

export function SettingsPage() {
  const [form, setForm] = useState<TenantSettings>({
    visitDurationMinutes: 60,
    bufferMinutes: 60,
    whatsAppNotifyEnabled: false,
  })
  const [testPhone, setTestPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getTenantSettings()
      .then(setForm)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const saved = await updateTenantSettings(form)
      setForm(saved)
      setMessage('Configurações salvas.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleTestWhatsApp() {
    setError(null)
    setMessage(null)
    try {
      await sendWhatsAppTest(testPhone)
      setMessage('Mensagem de teste enviada (se Evolution estiver configurada).')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no teste WhatsApp')
    }
  }

  if (loading) return <p className="muted">Carregando…</p>

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Configurações</h1>
          <p className="muted">Buffer entre visitas e WhatsApp da imobiliária</p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <form className="card form-grid" onSubmit={(e) => void handleSubmit(e)}>
        <h2>Agenda</h2>
        <label>
          Duração da visita (min)
          <input
            type="number"
            min={15}
            step={15}
            value={form.visitDurationMinutes}
            onChange={(e) =>
              setForm({ ...form, visitDurationMinutes: Number(e.target.value) })
            }
          />
        </label>
        <label>
          Buffer entre visitas (min)
          <input
            type="number"
            min={0}
            step={15}
            value={form.bufferMinutes}
            onChange={(e) => setForm({ ...form, bufferMinutes: Number(e.target.value) })}
          />
        </label>

        <h2>WhatsApp</h2>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.whatsAppNotifyEnabled}
            onChange={(e) => setForm({ ...form, whatsAppNotifyEnabled: e.target.checked })}
          />
          Notificar novas visitas via WhatsApp
        </label>
        <label>
          Número WhatsApp (E.164)
          <input
            type="tel"
            placeholder="+5511999999999"
            value={form.whatsAppE164 ?? ''}
            onChange={(e) => setForm({ ...form, whatsAppE164: e.target.value })}
          />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>

      <section className="card form-grid">
        <h2>Teste WhatsApp</h2>
        <label>
          Enviar para
          <input
            type="tel"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="+5511999999999"
          />
        </label>
        <button type="button" className="btn btn-secondary" onClick={() => void handleTestWhatsApp()}>
          Enviar teste
        </button>
      </section>
    </div>
  )
}
