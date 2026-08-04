import { get, put } from './http'
import type { ThemeConfig } from '../types'

export async function getTheme(): Promise<ThemeConfig> {
  return get<ThemeConfig>('/tenants/me/theme')
}

export async function updateTheme(payload: ThemeConfig): Promise<ThemeConfig> {
  return put<ThemeConfig>('/tenants/me/theme', payload)
}

export const OFFICIAL_THEMES = [
  { id: 'moderno', label: 'Moderno' },
  { id: 'classico', label: 'Clássico' },
  { id: 'urbano', label: 'Urbano' },
  { id: 'minimal', label: 'Minimal' },
]
