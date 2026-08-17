import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { uploadMyAvatar } from '../api/brokers'
import { resolvePublicAssetUrl } from '../api/http'
import {
  getAvailability,
  getBrokerSettings,
  getTenantSettings,
  sendWhatsAppTest,
  updateAvailability,
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
import type { AvailabilityRule, TenantSettings } from '../types'

const DAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

function defaultAvailability(): AvailabilityRule[] {
  return DAY_LABELS.map((_, dayOfWeek) => ({
    dayOfWeek,
    startTime: '09:00',
    endTime: '18:00',
    isClosed: dayOfWeek === 0 || dayOfWeek === 6,
  }))
}

function normalizeRules(rules: AvailabilityRule[]): AvailabilityRule[] {
  const byDay = new Map(rules.map((r) => [r.dayOfWeek, r]))
  return DAY_LABELS.map((_, dayOfWeek) => {
    const existing = byDay.get(dayOfWeek)
    return (
      existing ?? {
        dayOfWeek,
        startTime: '09:00',
        endTime: '18:00',
        isClosed: dayOfWeek === 0 || dayOfWeek === 6,
      }
    )
  })
}

export function SettingsPage() {
  const { user, refreshUser, setAvatarUrl } = useAuth()
  const tenantMode = canEditTenantSettings(user)
  const brokerMode = canEditBrokerSettings(user) && !tenantMode
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [tenantForm, setTenantForm] = useState<TenantSettings>({
    visitDurationMinutes: 60,
    bufferMinutes: 60,
    whatsAppNotifyEnabled: false,
    emailNotifyEnabled: true,
  })
  const [brokerForm, setBrokerForm] = useState<BrokerSettings>({
    bufferMinutes: 60,
    visitDurationMinutes: 60,
    whatsAppE164: '',
  })
  const [availability, setAvailability] = useState<AvailabilityRule[]>(defaultAvailability())
  const [testPhone, setTestPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const availabilityScope = tenantMode ? 'tenant' : 'broker'

  useEffect(() => {
    if (isSaasReadOnly(user) || (!tenantMode && !brokerMode)) return
    const load = tenantMode ? getTenantSettings() : getBrokerSettings()
    Promise.all([load, getAvailability(availabilityScope)])
      .then(([settings, avail]) => {
        if (tenantMode) setTenantForm(settings as TenantSettings)
        else setBrokerForm(settings as BrokerSettings)
        setAvailability(normalizeRules(avail.rules ?? []))
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user, tenantMode, brokerMode, availabilityScope])

  if (isSaasReadOnly(user) || (!tenantMode && !brokerMode)) {
    return <Navigate to="/painel" replace />
  }

  function updateDay(dayOfWeek: number, patch: Partial<AvailabilityRule>) {
    setAvailability((prev) =>
      prev.map((rule) => (rule.dayOfWeek === dayOfWeek ? { ...rule, ...patch } : rule)),
    )
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
      const saved = await updateAvailability(availability, availabilityScope)
      setAvailability(normalizeRules(saved.rules ?? availability))
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
    if (!testPhone.trim()) {
      setError('Informe o número de destino em formato E.164.')
      return
    }
    try {
      await sendWhatsAppTest(testPhone.trim())
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
      const result = await uploadMyAvatar(file)
      setAvatarUrl(resolvePublicAssetUrl(result.avatarUrl) ?? result.avatarUrl)
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
          <div className="page-title-row">
            <h1>Configurações</h1>
            <span className="page-title-sep" aria-hidden="true">
              -
            </span>
            <span className="page-title-hint">
              {tenantMode
                ? 'Buffer entre visitas, notificações e horário da imobiliária'
                : 'Preferências de agenda e WhatsApp do corretor'}
            </span>
          </div>
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
            <h2>Notificações</h2>
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
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={Boolean(tenantForm.emailNotifyEnabled)}
                onChange={(e) =>
                  setTenantForm({ ...tenantForm, emailNotifyEnabled: e.target.checked })
                }
              />
              Notificar visitas por e-mail
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
            <label>
              Instância Evolution
              <input
                type="text"
                placeholder="allugme-imobiliaria"
                value={tenantForm.evolutionInstanceName ?? ''}
                onChange={(e) =>
                  setTenantForm({ ...tenantForm, evolutionInstanceName: e.target.value })
                }
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

        <h2>Horário de funcionamento</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          {tenantMode
            ? 'Horário padrão da imobiliária. Corretores podem sobrescrever nas próprias configurações.'
            : 'Seu horário pessoal (prevalece sobre o da imobiliária).'}
        </p>
        <div className="availability-grid">
          {availability.map((rule) => (
            <div key={rule.dayOfWeek} className="availability-row">
              <span className="availability-day">{DAY_LABELS[rule.dayOfWeek]}</span>
              <label className="checkbox-row availability-closed">
                <input
                  type="checkbox"
                  checked={rule.isClosed}
                  onChange={(e) => updateDay(rule.dayOfWeek, { isClosed: e.target.checked })}
                />
                Fechado
              </label>
              <label>
                Início
                <input
                  type="time"
                  value={rule.startTime}
                  disabled={rule.isClosed}
                  onChange={(e) => updateDay(rule.dayOfWeek, { startTime: e.target.value })}
                />
              </label>
              <label>
                Fim
                <input
                  type="time"
                  value={rule.endTime}
                  disabled={rule.isClosed}
                  onChange={(e) => updateDay(rule.dayOfWeek, { endTime: e.target.value })}
                />
              </label>
            </div>
          ))}
        </div>

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
