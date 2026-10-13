import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createAcademicSession,
  deactivateAcademicSession,
  listAcademicSessions,
  updateAcademicSession,
} from '../lib/academicSessions'
import type { AcademicSession } from '../lib/academicSessions'
import { useAppContext } from '../lib/appContext'
import { formatDate, toDateInput } from '../lib/dates'
import { describeError } from '../lib/errors'

interface FormState {
  name: string
  startDate: string
  endDate: string
}

const emptyForm: FormState = { name: '', startDate: '', endDate: '' }

type FormMode =
  | { kind: 'create' }
  | { kind: 'edit'; session: AcademicSession }
  | null

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

function newestFirst(sessions: AcademicSession[]): AcademicSession[] {
  return [...sessions].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  )
}

function AcademicSessionsPage() {
  const { session, onLogout } = useAppContext()
  const token = session.accessToken

  const [sessions, setSessions] = useState<AcademicSession[] | null>(null)
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

    listAcademicSessions(token)
      .then((result) => {
        if (!cancelled) setSessions(result)
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
    setSessions(null)
    setReloadKey((key) => key + 1)
  }

  function openCreate() {
    setMode({ kind: 'create' })
    setForm(emptyForm)
    setFormError(null)
  }

  function openEdit(item: AcademicSession) {
    setMode({ kind: 'edit', session: item })
    setForm({
      name: item.name,
      startDate: toDateInput(item.startDate),
      endDate: toDateInput(item.endDate),
    })
    setFormError(null)
  }

  function closeForm() {
    setMode(null)
    setFormError(null)
    setForm(emptyForm)
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!mode) return

    setFormError(null)

    const name = form.name.trim()

    if (form.endDate <= form.startDate) {
      setFormError('The end date must be after the start date.')
      return
    }

    setSaving(true)

    try {
      const input = { name, startDate: form.startDate, endDate: form.endDate }

      if (mode.kind === 'create') {
        const created = await createAcademicSession(token, input)
        setSessions((current) => [...(current ?? []), created])
      } else {
        const updated = await updateAcademicSession(token, mode.session.id, input)
        setSessions((current) =>
          (current ?? []).map((item) => (item.id === updated.id ? updated : item)),
        )
      }
      setMode(null)
      setForm(emptyForm)
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

  async function handleDeactivate(item: AcademicSession) {
    const confirmed = window.confirm(
      `Deactivate "${item.name}"? It will be marked inactive.`,
    )
    if (!confirmed) return

    setActionError(null)
    setBusyId(item.id)

    try {
      const updated = await deactivateAcademicSession(token, item.id)
      setSessions((current) =>
        (current ?? []).map((entry) => (entry.id === updated.id ? updated : entry)),
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

  if (!sessions) {
    return <p className="text-sm text-slate-500">Loading academic sessions...</p>
  }

  const sorted = newestFirst(sessions)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Academic sessions</h1>
          <p className="mt-1 text-sm text-slate-500">
            Academic years such as 2025/2026. Semesters belong to a session.
          </p>
        </div>
        {!mode && (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Add session
          </button>
        )}
      </div>

      {mode && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 max-w-2xl space-y-4 rounded-xl bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            {mode.kind === 'create' ? 'Add session' : `Edit ${mode.session.name}`}
          </h2>

          <div>
            <label htmlFor="session-name" className="block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="session-name"
              type="text"
              required
              placeholder="2025/2026"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="session-start" className="block text-sm font-medium text-slate-700">
                Start date
              </label>
              <input
                id="session-start"
                type="date"
                required
                value={form.startDate}
                onChange={(e) => updateField('startDate', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="session-end" className="block text-sm font-medium text-slate-700">
                End date
              </label>
              <input
                id="session-end"
                type="date"
                required
                value={form.endDate}
                onChange={(e) => updateField('endDate', e.target.value)}
                className={inputClass}
              />
            </div>
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
              {saving ? 'Saving...' : mode.kind === 'create' ? 'Add session' : 'Save changes'}
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
        <p role="alert" className="mt-4 max-w-2xl rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm">
        {sorted.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No academic sessions yet. Use "Add session" to create the first one.
          </p>
        ) : (
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Starts</th>
                <th className="px-4 py-3 font-medium">Ends</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(item.startDate)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(item.endDate)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {item.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="mr-3 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Edit
                    </button>
                    {item.status === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() => handleDeactivate(item)}
                        disabled={busyId === item.id}
                        className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        {busyId === item.id ? 'Working...' : 'Deactivate'}
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

export default AcademicSessionsPage