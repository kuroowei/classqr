import { apiRequest } from './api'

export interface SessionUser {
  id: string
  email: string
  role: string
  institutionId: string | null
}

export interface Session {
  accessToken: string
  user: SessionUser
}

interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: SessionUser
}

const STORAGE_KEY = 'classqr.session'

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function saveSession(session: Session): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export async function login(email: string, password: string): Promise<Session> {
  const data = await apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  })

  const session: Session = { accessToken: data.accessToken, user: data.user }
  saveSession(session)
  return session
}