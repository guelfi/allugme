import { useEffect, useRef, useState, type ReactNode } from 'react'
import { uploadMyAvatar } from '../../api/brokers'
import { resolvePublicAssetUrl } from '../../api/http'
import { useAuth } from '../../contexts/AuthContext'

const OPTIONAL_LOGIN_LIMIT = 9

export function BrokerAvatarGate({ children }: { children: ReactNode }) {
  const { user, refreshUser, setAvatarUrl } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const isBroker =
    user?.membershipRole === 'broker' || user?.membershipRole === 'independent_broker'
  const loginCount = user?.missingAvatarLoginCount ?? 0
  const needsAvatar = Boolean(isBroker && !user?.avatarUrl)
  const mandatory = needsAvatar && loginCount > OPTIONAL_LOGIN_LIMIT
  const visible = needsAvatar && (!dismissed || mandatory)

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraOpen(false)
  }

  useEffect(() => () => stopCamera(), [])

  useEffect(() => {
    if (!cameraOpen || !videoRef.current || !streamRef.current) return
    videoRef.current.srcObject = streamRef.current
    void videoRef.current.play()
  }, [cameraOpen])

  async function openCamera() {
    setCameraError(null)
    setUploadError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Este navegador não oferece captura pela câmera. Use a opção de escolher foto.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      })
      streamRef.current = stream
      setCameraOpen(true)
    } catch {
      setCameraError(
        'Não foi possível acessar a câmera. Autorize o uso no navegador ou escolha uma foto do dispositivo.',
      )
    }
  }

  async function upload(file: File) {
    setUploading(true)
    setUploadError(null)
    try {
      const result = await uploadMyAvatar(file)
      setAvatarUrl(resolvePublicAssetUrl(result.avatarUrl) ?? result.avatarUrl)
      stopCamera()
      await refreshUser()
      setDismissed(true)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Não foi possível salvar a foto.')
    } finally {
      setUploading(false)
    }
  }

  async function capture() {
    const video = videoRef.current
    if (!video || !video.videoWidth || !video.videoHeight) {
      setUploadError('A câmera ainda está iniciando. Aguarde um instante e tente novamente.')
      return
    }
    const size = Math.min(video.videoWidth, video.videoHeight)
    const canvas = document.createElement('canvas')
    canvas.width = 720
    canvas.height = 720
    const context = canvas.getContext('2d')
    if (!context) return
    const sourceX = (video.videoWidth - size) / 2
    const sourceY = (video.videoHeight - size) / 2
    context.drawImage(video, sourceX, sourceY, size, size, 0, 0, 720, 720)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
    if (!blob) {
      setUploadError('Não foi possível processar a foto capturada.')
      return
    }
    await upload(new File([blob], 'selfie.jpg', { type: 'image/jpeg' }))
  }

  return (
    <>
      {children}
      {visible && (
        <div className="avatar-gate-backdrop" role="dialog" aria-modal={mandatory} aria-labelledby="avatar-gate-title">
          <section className="avatar-gate-card card">
            <div className="avatar-gate-heading">
              <div>
                <span className="eyebrow">Foto profissional</span>
                <h1 id="avatar-gate-title">Inclua sua foto de perfil</h1>
              </div>
              {!mandatory && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDismissed(true)}>
                  Agora não
                </button>
              )}
            </div>
            <p className="muted">
              Sua foto identifica você para clientes e é necessária para publicar imóveis. Você pode
              tirar uma selfie agora usando a câmera deste dispositivo.
            </p>
            {mandatory ? (
              <div className="alert alert-error">
                Você já entrou {loginCount} vezes sem cadastrar uma foto. Para continuar, inclua sua foto agora.
              </div>
            ) : (
              <div className="alert">
                Aviso {loginCount} de {OPTIONAL_LOGIN_LIMIT}. Depois disso, a foto será obrigatória no acesso.
              </div>
            )}
            {cameraError && <div className="alert alert-error">{cameraError}</div>}
            {uploadError && <div className="alert alert-error">{uploadError}</div>}
            {cameraOpen ? (
              <div className="avatar-camera-stage">
                <video ref={videoRef} playsInline muted aria-label="Visualização da câmera" />
                <div className="avatar-camera-actions">
                  <button type="button" className="btn btn-primary" disabled={uploading} onClick={() => void capture()}>
                    {uploading ? 'Salvando…' : 'Capturar foto'}
                  </button>
                  <button type="button" className="btn btn-secondary" disabled={uploading} onClick={stopCamera}>
                    Cancelar câmera
                  </button>
                </div>
              </div>
            ) : (
              <div className="avatar-gate-actions">
                <button type="button" className="btn btn-primary" disabled={uploading} onClick={() => void openCamera()}>
                  Usar câmera
                </button>
                <button type="button" className="btn btn-secondary" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  {uploading ? 'Enviando…' : 'Escolher foto'}
                </button>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="user"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void upload(file)
                event.target.value = ''
              }}
            />
            <small className="muted">
              O navegador solicitará sua autorização antes de acessar a câmera. Nenhum vídeo é gravado;
              somente a foto capturada será enviada.
            </small>
          </section>
        </div>
      )}
    </>
  )
}
