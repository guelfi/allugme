import { get, post, put, upload } from './http'
import type { ThemeConfig } from '../types'

export interface ThemeSubmission {
  id: string
  tenantId: string
  tenantName: string
  version: number
  status: 'pending' | 'approved' | 'rejected' | string
  themeKey: string
  originalFileName: string
  reviewNotes?: string | null
  submittedAt: string
  reviewedAt?: string | null
}

export interface ThemeModel {
  officialKeys: string[]
  requiredFiles: string[]
  requiredPages: string[]
  requiredPlaceholders: string[]
  notes: string
}

interface ThemeApi {
  themeKey?: string
  themeId?: string
  submissions?: ThemeSubmission[]
}

function toConfig(raw: ThemeApi): ThemeConfig {
  return {
    themeId: raw.themeId ?? raw.themeKey ?? 'moderno',
    submissions: raw.submissions ?? [],
  }
}

export async function getTheme(): Promise<ThemeConfig> {
  return toConfig(await get<ThemeApi>('/tenants/me/theme'))
}

export async function updateTheme(payload: ThemeConfig): Promise<ThemeConfig> {
  return toConfig(await put<ThemeApi>('/tenants/me/theme', { themeId: payload.themeId }))
}

export function getThemeModel(): Promise<ThemeModel> {
  return get<ThemeModel>('/tenants/me/theme/model')
}

export function submitCustomTheme(file: File): Promise<ThemeSubmission> {
  const data = new FormData()
  data.append('package', file)
  return upload<ThemeSubmission>('/tenants/me/theme/submissions', data)
}

export function listAdminThemeSubmissions(status?: string): Promise<ThemeSubmission[]> {
  return get<ThemeSubmission[]>('/admin/theme-submissions', { query: { status } })
}

export function reviewThemeSubmission(
  id: string,
  decision: 'approve' | 'reject',
  notes?: string,
): Promise<ThemeSubmission> {
  return post<ThemeSubmission>(`/admin/theme-submissions/${id}/review`, { decision, notes })
}

export const OFFICIAL_THEMES = [
  { id: 'moderno', label: 'Moderno' },
  { id: 'urbano', label: 'Urbano' },
  { id: 'classico', label: 'Clássico' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'porto', label: 'Porto' },
]
