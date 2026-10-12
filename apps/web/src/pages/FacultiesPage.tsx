import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAppContext } from '../lib/appContext'
import { describeError } from '../lib/errors'
import {
  createFaculty,
  deactivateFaculty,
  listFaculties,
  updateFaculty,
} from '../lib/faculties'
import type { Faculty } from '../lib/faculties'

interface FormState {
  name: string
  code: string
  description: string
  headOfFaculty: string
}

const emptyForm: FormState = {
  name: '',
  code: '',
  description: '',
  headOfFaculty: '',
}

type FormMode = { kind: 'create' } | { kind: 'edit'; faculty: Faculty } | null

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

function FacultiesPage() {
  const { session, onLogout } = useAppContext()
  const token = session.accessToken

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

    listFaculties(token)
      .then((result) => {
        if (!cancelled) setFaculties(result)
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
    setFaculties(null)
    setReloadKey((key) => key + 1)
  }

  function openCreate() {
    setMode({ kind: 'create' })
    setForm(emptyForm)
    setFormError(null)
  }

  function openEdit(faculty: Faculty) {
    setMode({ kind: 'edit', faculty })
    setForm({
      name: faculty.name,
      code: faculty.code,
      description: faculty.description ?? '',
      headOfFaculty: faculty.headOfFaculty ?? '',
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

    const name = form.name.trim()
    const code = form.code.trim()
    const description = form.description.trim()
    const headOfFaculty = form.headOfFaculty.trim()

    try {
      if (mode.kind === 'create') {
        const created = await createFaculty(token, {
          name,
          code,
          ...(description ? { description } : {}),
          ...(headOfFaculty ? { headOfFaculty } : {}),
        })
        setFaculties((current) => [...(current ?? []), created])
      } else {
        const updated = await updateFaculty(token, mode.faculty.id, {
          name,
          code,
          description,
          headOfFaculty,
        })
        setFaculties((current) =>
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

  async function handleDeactivate(faculty: Faculty) {
    const confirmed = window.confirm(
      `Deactivate "${faculty.name}"? It will be marked inactive.`,
    )
    if (!confirmed) return

    setActionError(null)
    setBusyId(faculty.id)

    try {
      const updated = await deactivateFaculty(token, faculty.id)
      setFaculties((current) =>
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

  if (!faculties) {
    return <p className="text-sm text-slate-500">Loading faculties...</p>
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Faculties</h1>
          <p className="mt-1 text-sm text-slate-500">
            The top level of your institution's academic structure.
          </p>
        </div>
        {!mode && (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Add faculty
          </button>
        )}
      </div>

      {mode && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 max-w-2xl space-y-4 rounded-xl bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            {mode.kind === 'create' ? 'Add faculty' : `Edit ${mode.faculty.name}`}
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="faculty-name" className="block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                id="faculty-name"
                type="text"
                required
                minLength={2}
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="faculty-code" className="block text-sm font-medium text-slate-700">
                Code
              </label>
              <input
                id="faculty-code"
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
            <label htmlFor="faculty-head" className="block text-sm font-medium text-slate-700">
              Head of faculty (optional)
            </label>
            <input
              id="faculty-head"
              type="text"
              value={form.headOfFaculty}
              onChange={(e) => updateField('headOfFaculty', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="faculty-description" className="block text-sm font-medium text-slate-700">
              Description (optional)
            </label>
            <textarea
              id="faculty-description"
              rows={3}
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
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
              {saving ? 'Saving...' : mode.kind === 'create' ? 'Add faculty' : 'Save changes'}
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
        {faculties.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No faculties yet. Use "Add faculty" to create the first one.
          </p>
        ) : (
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Head of faculty</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {faculties.map((faculty) => (
                <tr key={faculty.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{faculty.code}</td>
                  <td className="px-4 py-3 text-slate-700">{faculty.name}</td>
                  <td className="px-4 py-3 text-slate-600">{faculty.headOfFaculty || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        faculty.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {faculty.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(faculty)}
                      className="mr-3 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Edit
                    </button>
                    {faculty.status === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() => handleDeactivate(faculty)}
                        disabled={busyId === faculty.id}
                        className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        {busyId === faculty.id ? 'Working...' : 'Deactivate'}
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

export default FacultiesPage