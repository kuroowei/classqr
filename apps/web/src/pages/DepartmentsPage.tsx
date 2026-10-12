import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAppContext } from '../lib/appContext'
import {
  createDepartment,
  deactivateDepartment,
  listDepartments,
  updateDepartment,
} from '../lib/departments'
import type { Department } from '../lib/departments'
import { describeError } from '../lib/errors'
import { listFaculties } from '../lib/faculties'
import type { Faculty } from '../lib/faculties'

interface FormState {
  facultyId: string
  name: string
  code: string
  headOfDept: string
}

const emptyForm: FormState = {
  facultyId: '',
  name: '',
  code: '',
  headOfDept: '',
}

type FormMode =
  | { kind: 'create' }
  | { kind: 'edit'; department: Department }
  | null

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

function DepartmentsPage() {
  const { session, onLogout } = useAppContext()
  const token = session.accessToken

  const [departments, setDepartments] = useState<Department[] | null>(null)
  const [faculties, setFaculties] = useState<Faculty[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [mode, setMode] = useState<FormMode>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [actionError, setActionError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([listDepartments(token), listFaculties(token)])
      .then(([departmentList, facultyList]) => {
        if (cancelled) return
        setDepartments(departmentList)
        setFaculties(facultyList)
      })
      .catch((err) => {
        if (cancelled) return
        const { unauthorized, message } = describeError(err)
        if (unauthorized) {
          onLogout()
          return
        }
        setLoadError(message)
      })

    return () => {
      cancelled = true
    }
  }, [token, onLogout, reloadKey])

  function handleRetry() {
    setLoadError(null)
    setDepartments(null)
    setFaculties(null)
    setReloadKey((key) => key + 1)
  }

  function openCreate() {
    setMode({ kind: 'create' })
    setForm(emptyForm)
    setFormError(null)
  }

  function openEdit(department: Department) {
    setMode({ kind: 'edit', department })
    setForm({
      facultyId: department.facultyId,
      name: department.name,
      code: department.code,
      headOfDept: department.headOfDept ?? '',
    })
    setFormError(null)
  }

  function closeForm() {
    setMode(null)
    setFormError(null)
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!mode) return

    setFormError(null)
    setSaving(true)

    const facultyId = form.facultyId
    const name = form.name.trim()
    const code = form.code.trim()
    const headOfDept = form.headOfDept.trim()

    try {
      if (mode.kind === 'create') {
        const created = await createDepartment(token, {
          facultyId,
          name,
          code,
          ...(headOfDept ? { headOfDept } : {}),
        })
        setDepartments((current) => [...(current ?? []), created])
      } else {
        const updated = await updateDepartment(token, mode.department.id, {
          facultyId,
          name,
          code,
          headOfDept,
        })
        setDepartments((current) =>
          (current ?? []).map((item) => (item.id === updated.id ? updated : item)),
        )
      }
      setMode(null)
    } catch (err) {
      const { unauthorized, message } = describeError(err)
      if (unauthorized) {
        onLogout()
        return
      }
      setFormError(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(department: Department) {
    const confirmed = window.confirm(
      `Deactivate "${department.name}"? It will be marked inactive.`,
    )
    if (!confirmed) return

    setActionError(null)
    setBusyId(department.id)

    try {
      const updated = await deactivateDepartment(token, department.id)
      setDepartments((current) =>
        (current ?? []).map((item) => (item.id === updated.id ? updated : item)),
      )
    } catch (err) {
      const { unauthorized, message } = describeError(err)
      if (unauthorized) {
        onLogout()
        return
      }
      setActionError(message)
    } finally {
      setBusyId(null)
    }
  }

  if (loadError) {
    return (
      <div className="max-w-md rounded-xl bg-white p-6 shadow-sm">
        <p role="alert" className="text-sm text-red-700">
          {loadError}
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

  if (!departments || !faculties) {
    return <p className="text-sm text-slate-500">Loading departments...</p>
  }

  const facultyById = new Map(faculties.map((faculty) => [faculty.id, faculty]))
  const hasActiveFaculty = faculties.some((faculty) => faculty.status === 'ACTIVE')

  // Active faculties, plus the department's current faculty while editing
  // (so the dropdown can still show it if that faculty was deactivated).
  const facultyOptions = faculties.filter(
    (faculty) => faculty.status === 'ACTIVE' || faculty.id === form.facultyId,
  )

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
          <p className="mt-1 text-sm text-slate-500">
            Each department belongs to one faculty.
          </p>
        </div>
        {!mode && hasActiveFaculty && (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Add department
          </button>
        )}
      </div>

      {!hasActiveFaculty && (
        <p className="mt-4 max-w-2xl rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          You need at least one active faculty before you can add a department.{' '}
          <Link to="/faculties" className="font-medium underline">
            Go to Faculties
          </Link>
        </p>
      )}

      {mode && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 max-w-2xl space-y-4 rounded-xl bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            {mode.kind === 'create' ? 'Add department' : `Edit ${mode.department.name}`}
          </h2>

          <div>
            <label htmlFor="department-faculty" className="block text-sm font-medium text-slate-700">
              Faculty
            </label>
            <select
              id="department-faculty"
              required
              value={form.facultyId}
              onChange={(e) => updateField('facultyId', e.target.value)}
              className={inputClass}
            >
              <option value="">Select a faculty</option>
              {facultyOptions.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name} ({faculty.code})
                  {faculty.status !== 'ACTIVE' ? ' - inactive' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="department-name" className="block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                id="department-name"
                type="text"
                required
                minLength={2}
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="department-code" className="block text-sm font-medium text-slate-700">
                Code
              </label>
              <input
                id="department-code"
                type="text"
                required
                minLength={2}
                maxLength={20}
                value={form.code}
                onChange={(e) => updateField('code', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="department-head" className="block text-sm font-medium text-slate-700">
              Head of department (optional)
            </label>
            <input
              id="department-head"
              type="text"
              value={form.headOfDept}
              onChange={(e) => updateField('headOfDept', e.target.value)}
              className={inputClass}
            />
          </div>

          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : mode.kind === 'create' ? 'Add department' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {actionError && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm">
        {departments.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No departments yet.
            {hasActiveFaculty ? ' Use "Add department" to create the first one.' : ''}
          </p>
        ) : (
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Faculty</th>
                <th className="px-4 py-3 font-medium">Head of department</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departments.map((department) => (
                <tr key={department.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{department.code}</td>
                  <td className="px-4 py-3 text-slate-700">{department.name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {facultyById.get(department.facultyId)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{department.headOfDept || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        department.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {department.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(department)}
                      className="mr-3 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Edit
                    </button>
                    {department.status === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() => handleDeactivate(department)}
                        disabled={busyId === department.id}
                        className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        {busyId === department.id ? 'Working...' : 'Deactivate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default DepartmentsPage