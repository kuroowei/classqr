import { useEffect, useState } from 'react'
import { ApiError } from '../lib/api'
import { useAppContext } from '../lib/appContext'
import { fetchAdminDashboard } from '../lib/dashboard'
import type { AdminDashboard } from '../lib/dashboard'

interface StatCardProps {
  label: string
  value: number
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

function DashboardPage() {
  const { session, onLogout } = useAppContext()
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    fetchAdminDashboard(session.accessToken)
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          onLogout()
          return
        }
        setError(
          err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
        )
      })

    return () => {
      cancelled = true
    }
  }, [session.accessToken, onLogout, reloadKey])

  function handleRetry() {
    setError(null)
    setData(null)
    setReloadKey((key) => key + 1)
  }

  if (error) {
    return (
      <div className="max-w-md rounded-xl bg-white p-6 shadow-sm">
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!data) {
    return <p className="text-sm text-slate-500">Loading dashboard...</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        A summary of your institution's academic structure and attendance.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Faculties" value={data.facultyCount} />
        <StatCard label="Departments" value={data.departmentCount} />
        <StatCard label="Programmes" value={data.programmeCount} />
        <StatCard label="Students" value={data.studentCount} />
        <StatCard label="Lecturers" value={data.lecturerCount} />
        <StatCard label="Courses" value={data.courseCount} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <StatCard label="Active attendance sessions" value={data.activeAttendanceSessions} />

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Overall attendance</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {data.overallAttendancePercentage}%
          </p>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-indigo-600"
              style={{ width: `${Math.min(data.overallAttendancePercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage