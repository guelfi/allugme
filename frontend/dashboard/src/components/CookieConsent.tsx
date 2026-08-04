import { useEffect, useState } from 'react'

const STORAGE_KEY = 'allugme.cookieConsent'

type ConsentValue = 'accepted' | 'declined'

function readConsent(): ConsentValue | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'accepted' || value === 'declined') return value
  } catch {
    /* ignore */
  }
  return null
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(readConsent() === null)
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--lp-cookie-h',
      visible ? '5.75rem' : '0px',
    )
    return () => {
      document.documentElement.style.setProperty('--lp-cookie-h', '0px')
    }
  }, [visible])

  function choose(value: ConsentValue) {
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      /* ignore */
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="lp-cookie" role="dialog" aria-label="Consentimento de cookies">
      <div className="lp-cookie-inner">
        <p>
          Usamos cookies necessários para o funcionamento do site e, com o seu consentimento,
          cookies para melhorar a experiência. Veja a{' '}
          <a href="#privacidade">Política de Privacidade</a>.
        </p>
        <div className="lp-cookie-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => choose('declined')}>
            Recusar
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => choose('accepted')}>
            Aceitar
          </button>
        </div>
      </div>
    </div>
  )
}
