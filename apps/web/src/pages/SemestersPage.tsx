import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAppContext } from '../lib/appContext'
import { describeError } from '../lib/errors'
import {
  createSemester,
  deleteSemester,
  listSemesters,
  updateSemester,
} from '../lib/semesters'
import type { Semester } from '../lib/semesters'

interface FormState {
  name: string
  sortOrder: string
}

const emptyForm: FormState = { name: '', sortOrder: '' }

type FormMode =
  | { kind: 'create' }
  | { kind: 'edit'; semester: Semester }
  | null

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

function sortSemesters(semesters: Semester[]): Semester[] {
  return [...semesters].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  )
}

function SemestersPage() {
  const { session, onLogout } = useAppContext()
  const token = session.accessToken

  const [semesters, setSemesters] = useState<Semester[] | null>(null)
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

    listSemesters(token)
      .then((result) => {
        if (!cancelled) setSemesters(result)
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
    setSemesters(null)
    setReloadKey((key) => key + 1)
  }

  function openCreate() {
    setMode({ kind: 'create' })
    setForm({
      name: '',
      // Suggest the next order number after the highest existing one.
      sortOrder: String(
        (semesters ?? []).reduce(
          (max, semester) => Math.max(max, semester.sortOrder),
          0,
        ) + 1,
      ),
    })
    setFormError(null)
  }

  function openEdit(semester: Semester) {
    setMode({ kind: 'edit', semester })
    setForm({ name: semester.name, sortOrder: String(semester.sortOrder) })
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
    const orderText = form.sortOrder.trim()
    const sortOrder = orderText ? Number(orderText) : undefined

    if (sortOrder !== undefined && !Number.isInteger(sortOrder)) {
      setFormError('Order must be a whole number, such as 1.')
      return
    }

    setSaving(true)

    try {
      const input = {
        name,
        ...(sortOrder !== undefined ? { sortOrder } : {}),
      }

      if (mode.kind === 'create') {
        const created = await createSemester(token, input)
        setSemesters((current) => [...(current ?? []), created])
      } else {
        const updated = await updateSemester(token, mode.semester.id, input)
        setSemesters((current) =>
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

  async function handleDelete(semester: Semester) {
    const confirmed = window.confirm(
      `Delete "${semester.name}"? This cannot be undone. A semester that is in use by courses, registrations or attendance sessions cannot be deleted.`,
    )
    if (!confirmed) return

    setActionError(null)
    setBusyId(semester.id)

    try {
      await deleteSemester(token, semester.id)
      setSemesters((current) =>
        (current ?? []).filter((item) => item.id !== semester.id),
      )
    } catch (err) {
      const { unauthorized, message } = describeError(err)
      if (unauthorized) {
        onLogout()
        return
      }
      setActionError(
        `${message} If this semester is in use, it cannot be deleted.`,
      )
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

  if (!semesters) {
    return <p className="text-sm text-slate-500">Loading semesters...</p>
  }

  const sorted = sortSemesters(semesters)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Semesters</h1>
          <p className="mt-1 text-sm text-slate-500">
            Terms within an academic year, such as First Semester and Second Semester. The order number decides how they are listed.
          </p>
        </div>
        {!mode && (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Add semester
          </button>
        )}
      </div>

      {mode && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 max-w-xl space-y-4 rounded-xl bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            {mode.kind === 'create' ? 'Add semester' : `Edit ${mode.semester.name}`}
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="semester-name" className="block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                id="semester-name"
                type="text"
                required
                placeholder="First Semester"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="semester-order" className="block text-sm font-medium text-slate-700">
                Order
              </label>
              <input
                id="semester-order"
                type="number"
                step={1}
                value={form.sortOrder}
                onChange={(e) => updateField('sortOrder', e.target.value)}
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
              {saving ? 'Saving...' : mode.kind === 'create' ? 'Add semester' : 'Save changes'}
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

      <div className="mt-6 max-w-3xl overflow-x-auto rounded-xl bg-white shadow-sm">
        {sorted.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No semesters yet. Use "Add semester" to create the first one, for example First Semester with order 1.
          </p>
        ) : (
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((semester) => (
                <tr key={semester.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{semester.sortOrder}</td>
                  <td className="px-4 py-3 text-slate-700">{semester.name}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(semester)}
                      className="mr-3 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(semester)}
                      disabled={busyId === semester.id}
                      className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      {busyId === semester.id ? 'Working...' : 'Delete'}
                    </button>
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

export default SemestersPage