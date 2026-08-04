import { useEffect, useRef, useState } from 'react'

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

function setCookieHeight(px: number) {
  document.documentElement.style.setProperty('--lp-cookie-h', `${Math.max(0, px)}px`)
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const bannerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setVisible(readConsent() === null)
  }, [])

  useEffect(() => {
    if (!visible) {
      setCookieHeight(0)
      return
    }

    const el = bannerRef.current
    if (!el) return

    const sync = () => setCookieHeight(el.getBoundingClientRect().height)
    sync()

    const ro = new ResizeObserver(sync)
    ro.observe(el)
    window.addEventListener('resize', sync)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', sync)
      setCookieHeight(0)
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
    <div
      ref={bannerRef}
      className="lp-cookie"
      role="dialog"
      aria-label="Consentimento de cookies"
    >
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
