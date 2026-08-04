const raw =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  (import.meta.env.VITE_API_URL as string | undefined) ||
  ''

export const API_BASE = raw.replace(/\/$/, '')

function readToken(): string | null {
  try {
    return localStorage.getItem('authToken')
  } catch {
    return null
  }
}

export class ApiHttpError extends Error {
  status: number
  body: unknown

  constructor(status: number, body: unknown, message?: string) {
    super(message || `HTTP ${status}`)
    this.status = status
    this.body = body
  }
}

type QueryValue = string | number | boolean | null | undefined

type HttpOptions = {
  token?: string | null
  skipAuth?: boolean
  query?: Record<string, QueryValue>
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const base = API_BASE || window.location.origin
  const url = new URL(`${base}${normalized}`)
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value))
    }
  })
  return url.toString()
}

function errorMessage(status: number, body: unknown): string {
  if (typeof body === 'string' && body.trim()) return body
  if (body && typeof body === 'object') {
    const value = body as Record<string, unknown>
    if (typeof value.error === 'string' && value.error) return value.error
    if (typeof value.title === 'string' && value.title) return value.title
    if (typeof value.message === 'string' && value.message) return value.message
  }
  return `Erro HTTP ${status}`
}

function clearToken(): void {
  try {
    localStorage.removeItem('authToken')
  } catch {
    /* ignore */
  }
}

export async function http<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: HttpOptions,
): Promise<T> {
  if (!API_BASE && !options?.skipAuth) {
    throw new Error('VITE_API_BASE_URL não configurada')
  }

  const token = options?.token ?? readToken()
  const headers: Record<string, string> = { Accept: 'application/json' }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (!options?.skipAuth && token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(buildUrl(path, options?.query), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  let parsed: unknown = null
  if (text) {
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = text
    }
  }

  if (!response.ok) {
    if (response.status === 401) clearToken()
    throw new ApiHttpError(response.status, parsed, errorMessage(response.status, parsed))
  }

  return parsed as T
}

export const get = <T>(path: string, options?: HttpOptions) =>
  http<T>('GET', path, undefined, options)
export const post = <T>(path: string, body?: unknown, options?: HttpOptions) =>
  http<T>('POST', path, body, options)
export const put = <T>(path: string, body?: unknown, options?: HttpOptions) =>
  http<T>('PUT', path, body, options)
export const patch = <T>(path: string, body?: unknown, options?: HttpOptions) =>
  http<T>('PATCH', path, body, options)
export const del = <T>(path: string, options?: HttpOptions) =>
  http<T>('DELETE', path, undefined, options)
