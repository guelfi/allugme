export function toSafePortalPath(returnUrl: string | null | undefined): string | null {
  if (!returnUrl) return null

  try {
    const url = new URL(returnUrl, window.location.origin)
    if (url.origin !== window.location.origin) return null

    const basename = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
    let path = url.pathname
    if (basename && (path === basename || path.startsWith(`${basename}/`))) {
      path = path.slice(basename.length) || '/'
    }

    if (path !== '/portal' && !path.startsWith('/portal/')) return null
    return `${path}${url.search}${url.hash}`
  } catch {
    return null
  }
}
