import { apiRequest } from './api'

export interface Faculty {
  id: string
  name: string
  code: string
  description: string | null
  headOfFaculty: string | null
  status: string
  createdAt: string
}

export interface FacultyInput {
  name: string
  code: string
  description?: string
  headOfFaculty?: string
}

export function listFaculties(token: string): Promise<Faculty[]> {
  return apiRequest<Faculty[]>('/api/faculties', { token })
}

export function createFaculty(token: string, input: FacultyInput): Promise<Faculty> {
  return apiRequest<Faculty>('/api/faculties', {
    method: 'POST',
    body: input,
    token,
  })
}

export function updateFaculty(
  token: string,
  id: string,
  input: FacultyInput,
): Promise<Faculty> {
  return apiRequest<Faculty>(`/api/faculties/${id}`, {
    method: 'PUT',
    body: input,
    token,
  })
}

export function deactivateFaculty(token: string, id: string): Promise<Faculty> {
  return apiRequest<Faculty>(`/api/faculties/${id}/deactivate`, {
    method: 'PATCH',
    token,
  })
}