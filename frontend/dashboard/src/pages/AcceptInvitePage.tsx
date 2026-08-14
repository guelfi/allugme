import { type FormEvent, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { acceptInvite } from '../api/auth'
import { AuthCardHeader } from '../components/AuthCardHeader'
import { PasswordInput } from '../components/PasswordInput'
import { useAuth } from '../contexts/AuthContext'
import { formatBrPhone, isValidBrPhone, phoneToE164 } from '../utils/phone'

export function AcceptInvitePage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { applySession } = useAuth()
  const token = useMemo(() => params.get('token')?.trim() ?? '', [params])

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [phone, setPhone] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (!token) {
      setError('Link de convite inválido ou incompleto.')
      return
    }
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }
    if (!isValidBrPhone(phone)) {
      setError('Informe um WhatsApp/celular válido, com DDD.')
      return
    }
    if (!avatar) {
      setError('A foto de perfil é obrigatória.')
      return
    }
    if (!acceptPrivacy) {
      setError('É necessário aceitar a Política de Privacidade para ativar a conta.')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('token', token)
      formData.append('password', password)
      formData.append('phone', phoneToE164(phone))
      formData.append('avatar', avatar)
      formData.append('acceptPrivacy', 'true')
      const result = await acceptInvite(formData)
      applySession(result.accessToken, result.user)
      navigate('/painel', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível concluir o convite.')
    } finally {
      setLoading(false)
    }
  }

  const bgUrl = `${import.meta.env.BASE_URL}login-buildings.jpg`

  return (
    <div className="login-page" style={{ ['--login-bg-image' as string]: `url(${bgUrl})` }}>
      <form className="login-card card" onSubmit={(e) => void handleSubmit(e)}>
        <AuthCardHeader backTo="/login" backLabel="Voltar ao login" />
        <h1 className="register-title-line" style={{ fontSize: '1.25rem', margin: 0 }}>
          Finalizar cadastro
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          Defina sua senha, telefone e foto de perfil para ativar o acesso de corretor.
        </p>
        {!token && <div className="alert alert-error">Link inválido ou incompleto.</div>}
        {error && <div className="alert alert-error">{error}</div>}
        <label>
          Senha
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        <label>
          Confirmar senha
          <PasswordInput
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        <label>
          WhatsApp / celular
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(formatBrPhone(e.target.value))}
            placeholder="(99) 99999-9999"
            required
          />
        </label>
        <label>
          Foto de perfil
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
          />
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={acceptPrivacy}
            onChange={(event) => setAcceptPrivacy(event.target.checked)}
            required
          />
          <span>
            Li e aceito a <Link to="/privacy" target="_blank">Política de Privacidade</Link>
          </span>
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading || !token || !acceptPrivacy}>
          {loading ? 'Salvando…' : 'Ativar conta'}
        </button>
      </form>
    </div>
  )
}
