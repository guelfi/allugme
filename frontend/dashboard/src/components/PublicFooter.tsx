import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { contactEmail, contactMailto, contactWhatsAppUrl } from '../contact'

const productMessages = [
  'Seus imóveis, clientes e visitas em um só lugar.',
  'Transforme imóveis em oportunidades e visitas em negócios.',
  'Sua imobiliária conectada do anúncio à visita.',
  'Mais presença, mais visitas, mais negócios.',
  'Sua vitrine imobiliária pronta para gerar oportunidades.',
  'Divulgue imóveis, organize visitas e conquiste clientes.',
  'Sua operação imobiliária simples, conectada e sob controle.',
  'Imóveis, clientes e visitas em um só lugar.',
  'Transforme imóveis em oportunidades e visitas em negócios.',
] as const

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="1.15em"
      height="1.15em"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.91.51 3.77 1.48 5.4L2 22l4.93-1.58a10 10 0 0 0 5.11 1.41h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2m0 17.94h-.01a8.1 8.1 0 0 1-4.13-1.13l-.3-.17-2.92.94.98-2.85-.19-.3a8.08 8.08 0 0 1-1.25-4.3c0-4.47 3.67-8.1 8.18-8.1s8.18 3.63 8.18 8.1-3.67 8.11-8.18 8.11m4.49-6.07c-.25-.12-1.46-.72-1.69-.8-.22-.08-.39-.12-.55.12-.16.25-.63.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.38-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.43.06-.66.31-.22.25-.87.85-.87 2.07s.89 2.4 1.01 2.56c.12.16 1.75 2.67 4.24 3.74 1.49.64 2.07.7 2.81.59.45-.07 1.46-.6 1.67-1.17.2-.58.2-1.07.14-1.17-.06-.11-.22-.17-.47-.29"
      />
    </svg>
  )
}

export function PublicFooter() {
  const footerRef = useRef<HTMLElement | null>(null)
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reducedMotion.matches) return

    const timer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % productMessages.length)
    }, 4500)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const footer = footerRef.current
    if (!footer) return

    const syncHeight = () => {
      document.documentElement.style.setProperty('--public-footer-h', `${footer.getBoundingClientRect().height}px`)
    }

    syncHeight()
    const observer = new ResizeObserver(syncHeight)
    observer.observe(footer)
    window.addEventListener('resize', syncHeight)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncHeight)
      document.documentElement.style.setProperty('--public-footer-h', '0px')
    }
  }, [])

  return (
    <footer ref={footerRef} className="public-footer">
      <div className="public-footer-inner">
        <div className="public-footer-brand">
          <strong>Allugme</strong>
          <span className="public-footer-message" aria-label="Destaques do produto">
            <span key={messageIndex}>{productMessages[messageIndex]}</span>
          </span>
        </div>
        <nav className="public-footer-links" aria-label="Links do rodapé">
          <Link to="/login">Entrar no painel</Link>
          <Link to="/privacy">Privacidade</Link>
          <Link to="/#privacidade">Cookies</Link>
          <a href={contactWhatsAppUrl} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon />
            <span>Falem conosco</span>
          </a>
          <a href={contactMailto}>{contactEmail}</a>
        </nav>
      </div>
    </footer>
  )
}
