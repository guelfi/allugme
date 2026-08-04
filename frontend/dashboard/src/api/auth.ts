import { get, post } from './http'
import type { LoginResponse, MeResponse, User } from '../types'

export async function login(email: string, password: string): Promise<LoginResponse> {
  return post<LoginResponse>('/auth/login', { email, password }, { skipAuth: true })
}

export async function logout(): Promise<void> {
  try {
    await post<void>('/auth/logout')
  } catch {
    /* best effort */
  }
}

export async function fetchMe(): Promise<User> {
  const me = await get<MeResponse>('/me')
  return me.user
}

export function persistToken(token: string): void {
  localStorage.setItem('authToken', token)
}

export function clearToken(): void {
  localStorage.removeItem('authToken')
}

export function readToken(): string | null {
  return localStorage.getItem('authToken')
}
