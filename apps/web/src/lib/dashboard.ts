import { apiRequest } from './api'

export interface AdminDashboard {
  facultyCount: number
  departmentCount: number
  programmeCount: number
  studentCount: number
  lecturerCount: number
  courseCount: number
  activeAttendanceSessions: number
  overallAttendancePercentage: number
}

export function fetchAdminDashboard(token: string): Promise<AdminDashboard> {
  return apiRequest<AdminDashboard>('/api/dashboard/admin', { token })
}