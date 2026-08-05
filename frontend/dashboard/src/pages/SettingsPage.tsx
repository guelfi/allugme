import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { uploadMyAvatar } from '../api/brokers'
import {
  getBrokerSettings,
  getTenantSettings,
  sendWhatsAppTest,
  updateBrokerSettings,
  updateTenantSettings,
  type BrokerSettings,
} from '../api/settings'
import { useAuth } from '../contexts/AuthContext'
import {
  canEditBrokerSettings,
  canEditTenantSettings,
  isSaasReadOnly,
} from '../permissions'
import type { TenantSettings } from '../types'

export function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const tenantMode = canEditTenantSettings(user)
  const brokerMode = canEditBrokerSettings(user) && !tenantMode
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [tenantForm, setTenantForm] = useState<TenantSettings>({
    visitDurationMinutes: 60,
    bufferMinutes: 60,
    whatsAppNotifyEnabled: false,
  })
  const [brokerForm, setBrokerForm] = useState<BrokerSettings>({
    bufferMinutes: 60,
    visitDurationMinutes: 60,
    whatsAppE164: '',
  })
  const [testPhone, setTestPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isSaasReadOnly(user) || (!tenantMode && !brokerMode)) return
    const load = tenantMode ? getTenantSettings() : getBrokerSettings()
    load
      .then((data) => {
        if (tenantMode) setTenantForm(data as TenantSettings)
        else setBrokerForm(data as BrokerSettings)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user, tenantMode, brokerMode])

  if (isSaasReadOnly(user) || (!tenantMode && !brokerMode)) {
    return <Navigate to="/painel" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      if (tenantMode) {
        setTenantForm(await updateTenantSettings(tenantForm))
      } else {
        setBrokerForm(await updateBrokerSettings(brokerForm))
      }
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

  async function handleAvatarSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setAvatarError(null)
    setAvatarUploading(true)
    try {
      await uploadMyAvatar(file)
      await refreshUser()
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Erro ao enviar foto')
    } finally {
      setAvatarUploading(false)
    }
  }

  if (loading) return <p className="muted">Carregando…</p>

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Configurações</h1>
          <p className="muted">
            {tenantMode
              ? 'Buffer entre visitas e WhatsApp da imobiliária'
              : 'Preferências de agenda e WhatsApp do corretor'}
          </p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <section className="card" style={{ marginBottom: '1rem' }}>
        <h2>Minha foto de rosto</h2>
        <p className="muted">
          Exibida ao visitante quando ele agenda uma visita com você. Obrigatória para publicar
          imóveis.
        </p>
        {avatarError && <div className="alert alert-error">{avatarError}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="avatar-preview">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user?.name ?? 'Foto de perfil'} />
            ) : (
              <span aria-hidden="true">
                {(user?.name ?? '?').trim().charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
          >
            {avatarUploading ? 'Enviando…' : user?.avatarUrl ? 'Trocar foto' : 'Enviar foto'}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => void handleAvatarSelect(e)}
          />
        </div>
      </section>

      <form className="card form-grid" onSubmit={(e) => void handleSubmit(e)}>
        <h2>Agenda</h2>
        {tenantMode ? (
          <>
            <label>
              Duração da visita (min)
              <input
                type="number"
                min={15}
                step={15}
                value={tenantForm.visitDurationMinutes}
                onChange={(e) =>
                  setTenantForm({ ...tenantForm, visitDurationMinutes: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Buffer entre visitas (min)
              <input
                type="number"
                min={0}
                step={15}
                value={tenantForm.bufferMinutes}
                onChange={(e) =>
                  setTenantForm({ ...tenantForm, bufferMinutes: Number(e.target.value) })
                }
              />
            </label>
            <h2>WhatsApp</h2>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={tenantForm.whatsAppNotifyEnabled}
                onChange={(e) =>
                  setTenantForm({ ...tenantForm, whatsAppNotifyEnabled: e.target.checked })
                }
              />
              Notificar novas visitas via WhatsApp
            </label>
            <label>
              Número WhatsApp (E.164)
              <input
                type="tel"
                placeholder="+5511999999999"
                value={tenantForm.whatsAppE164 ?? ''}
                onChange={(e) => setTenantForm({ ...tenantForm, whatsAppE164: e.target.value })}
              />
            </label>
          </>
        ) : (
          <>
            <label>
              Duração da visita (min)
              <input
                type="number"
                min={15}
                step={15}
                value={brokerForm.visitDurationMinutes ?? 60}
                onChange={(e) =>
                  setBrokerForm({ ...brokerForm, visitDurationMinutes: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Buffer entre visitas (min)
              <input
                type="number"
                min={0}
                step={15}
                value={brokerForm.bufferMinutes ?? 60}
                onChange={(e) =>
                  setBrokerForm({ ...brokerForm, bufferMinutes: Number(e.target.value) })
                }
              />
            </label>
            <label>
              WhatsApp do corretor (E.164)
              <input
                type="tel"
                placeholder="+5511999999999"
                value={brokerForm.whatsAppE164 ?? ''}
                onChange={(e) => setBrokerForm({ ...brokerForm, whatsAppE164: e.target.value })}
              />
            </label>
          </>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>

      {tenantMode && (
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
      )}
    </div>
  )
}
