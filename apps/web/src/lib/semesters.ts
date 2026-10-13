import { apiRequest } from './api'

export interface Semester {
  id: string
  name: string
  sortOrder: number
}

export interface SemesterInput {
  name: string
  sortOrder?: number
}

export function listSemesters(token: string): Promise<Semester[]> {
  return apiRequest<Semester[]>('/api/semesters', { token })
}

export function createSemester(
  token: string,
  input: SemesterInput,
): Promise<Semester> {
  return apiRequest<Semester>('/api/semesters', {
    method: 'POST',
    body: input,
    token,
  })
}

export function updateSemester(
  token: string,
  id: string,
  input: SemesterInput,
): Promise<Semester> {
  return apiRequest<Semester>(`/api/semesters/${id}`, {
    method: 'PUT',
    body: input,
    token,
  })
}

export function deleteSemester(token: string, id: string): Promise<unknown> {
  return apiRequest<unknown>(`/api/semesters/${id}`, {
    method: 'DELETE',
    token,
  })
}