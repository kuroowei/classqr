import { apiRequest } from './api'

export interface Level {
  id: string
  name: string
  sortOrder: number
  createdAt: string
}

export interface LevelInput {
  name: string
  sortOrder?: number
}

export function listLevels(token: string): Promise<Level[]> {
  return apiRequest<Level[]>('/api/levels', { token })
}

export function createLevel(token: string, input: LevelInput): Promise<Level> {
  return apiRequest<Level>('/api/levels', {
    method: 'POST',
    body: input,
    token,
  })
}

export function updateLevel(
  token: string,
  id: string,
  input: LevelInput,
): Promise<Level> {
  return apiRequest<Level>(`/api/levels/${id}`, {
    method: 'PUT',
    body: input,
    token,
  })
}

export function deleteLevel(token: string, id: string): Promise<unknown> {
  return apiRequest<unknown>(`/api/levels/${id}`, {
    method: 'DELETE',
    token,
  })
}