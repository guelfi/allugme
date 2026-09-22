export function vitrineHomeUrl(slug: string): string {
  const hostname = window.location.hostname.toLowerCase()
  if (hostname === 'allugme.online' || hostname.endsWith('.allugme.online')) {
    return `https://${slug}.allugme.online/`
  }
  return `/loja/${slug}/`
}

export function vitrinePropertyUrl(slug: string, propertyId: string): string {
  const home = vitrineHomeUrl(slug).replace(/\/?$/, '/')
  return `${home}property.html?id=${encodeURIComponent(propertyId)}`
}

export function vitrineScheduleUrl(slug: string, propertyId: string): string {
  const home = vitrineHomeUrl(slug).replace(/\/?$/, '/')
  return `${home}schedule.html?id=${encodeURIComponent(propertyId)}`
}
