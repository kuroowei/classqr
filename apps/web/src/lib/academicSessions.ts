import { apiRequest } from './api'

export interface AcademicSession {
  id: string
  name: string
  startDate: string
  endDate: string
  status: string
}

export interface AcademicSessionInput {
  name: string
  startDate: string
  endDate: string
}

export function listAcademicSessions(token: string): Promise<AcademicSession[]> {
  return apiRequest<AcademicSession[]>('/api/academic-sessions', { token })
}

export function createAcademicSession(
  token: string,
  input: AcademicSessionInput,
): Promise<AcademicSession> {
  return apiRequest<AcademicSession>('/api/academic-sessions', {
    method: 'POST',
    body: input,
    token,
  })
}

export function updateAcademicSession(
  token: string,
  id: string,
  input: AcademicSessionInput,
): Promise<AcademicSession> {
  return apiRequest<AcademicSession>(`/api/academic-sessions/${id}`, {
    method: 'PUT',
    body: input,
    token,
  })
}

export function deactivateAcademicSession(
  token: string,
  id: string,
): Promise<AcademicSession> {
  return apiRequest<AcademicSession>(`/api/academic-sessions/${id}/deactivate`, {
    method: 'PATCH',
    token,
  })
}