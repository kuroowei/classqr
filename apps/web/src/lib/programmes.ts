import { apiRequest } from './api'

export interface Programme {
  id: string
  departmentId: string
  name: string
  code: string
  degreeType: string | null
  durationYears: number | null
  status: string
  createdAt: string
}

export interface ProgrammeInput {
  departmentId: string
  name: string
  code: string
  degreeType?: string
  durationYears?: number
}

export function listProgrammes(token: string): Promise<Programme[]> {
  return apiRequest<Programme[]>('/api/programmes', { token })
}

export function createProgramme(
  token: string,
  input: ProgrammeInput,
): Promise<Programme> {
  return apiRequest<Programme>('/api/programmes', {
    method: 'POST',
    body: input,
    token,
  })
}

export function updateProgramme(
  token: string,
  id: string,
  input: ProgrammeInput,
): Promise<Programme> {
  return apiRequest<Programme>(`/api/programmes/${id}`, {
    method: 'PUT',
    body: input,
    token,
  })
}

export function deactivateProgramme(
  token: string,
  id: string,
): Promise<Programme> {
  return apiRequest<Programme>(`/api/programmes/${id}/deactivate`, {
    method: 'PATCH',
    token,
  })
}