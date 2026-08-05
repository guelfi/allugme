import { useEffect, useState } from 'react'

/** true quando a viewport está abaixo do breakpoint (mobile), usado para alternar entre o
 * fluxo de cadastro em etapas (mobile) e o fluxo combinado (desktop). */
export function useIsMobile(breakpointPx = 720): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpointPx : false,
  )

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`)
    const handler = () => setIsMobile(mql.matches)
    handler()
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpointPx])

  return isMobile
}
