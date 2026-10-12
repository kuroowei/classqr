import { apiRequest } from './api'

export interface Department {
  id: string
  facultyId: string
  name: string
  code: string
  headOfDept: string | null
  status: string
  createdAt: string
}

export interface DepartmentInput {
  facultyId: string
  name: string
  code: string
  headOfDept?: string
}

export function listDepartments(token: string): Promise<Department[]> {
  return apiRequest<Department[]>('/api/departments', { token })
}

export function createDepartment(
  token: string,
  input: DepartmentInput,
): Promise<Department> {
  return apiRequest<Department>('/api/departments', {
    method: 'POST',
    body: input,
    token,
  })
}

export function updateDepartment(
  token: string,
  id: string,
  input: DepartmentInput,
): Promise<Department> {
  return apiRequest<Department>(`/api/departments/${id}`, {
    method: 'PUT',
    body: input,
    token,
  })
}

export function deactivateDepartment(
  token: string,
  id: string,
): Promise<Department> {
  return apiRequest<Department>(`/api/departments/${id}/deactivate`, {
    method: 'PATCH',
    token,
  })
}