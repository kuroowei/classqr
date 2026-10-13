import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAppContext } from '../lib/appContext'
import { describeError } from '../lib/errors'
import {
  createLevel,
  deleteLevel,
  listLevels,
  updateLevel,
} from '../lib/levels'
import type { Level } from '../lib/levels'

interface FormState {
  name: string
  sortOrder: string
}

const emptyForm: FormState = { name: '', sortOrder: '' }

type FormMode = { kind: 'create' } | { kind: 'edit'; level: Level } | null

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

function sortLevels(levels: Level[]): Level[] {
  return [...levels].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  )
}

function LevelsPage() {
  const { session, onLogout } = useAppContext()
  const token = session.accessToken

  const [levels, setLevels] = useState<Level[] | null>(null)
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

    listLevels(token)
      .then((result) => {
        if (!cancelled) setLevels(result)
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
    setLevels(null)
    setReloadKey((key) => key + 1)
  }

  function openCreate() {
    setMode({ kind: 'create' })
    setForm({
      name: '',
      // Suggest the next order number after the highest existing one.
      sortOrder: String(
        (levels ?? []).reduce((max, level) => Math.max(max, level.sortOrder), 0) + 1,
      ),
    })
    setFormError(null)
  }

  function openEdit(level: Level) {
    setMode({ kind: 'edit', level })
    setForm({ name: level.name, sortOrder: String(level.sortOrder) })
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
        const created = await createLevel(token, input)
        setLevels((current) => [...(current ?? []), created])
      } else {
        const updated = await updateLevel(token, mode.level.id, input)
        setLevels((current) =>
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

  async function handleDelete(level: Level) {
    const confirmed = window.confirm(
      `Delete "${level.name}"? This cannot be undone. A level that is in use by students or courses cannot be deleted.`,
    )
    if (!confirmed) return

    setActionError(null)
    setBusyId(level.id)

    try {
      await deleteLevel(token, level.id)
      setLevels((current) => (current ?? []).filter((item) => item.id !== level.id))
    } catch (err) {
      const { unauthorized, message } = describeError(err)
      if (unauthorized) {
        onLogout()
        return
      }
      setActionError(
        `${message} If this level is in use by students or courses, it cannot be deleted.`,
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

  if (!levels) {
    return <p className="text-sm text-slate-500">Loading levels...</p>
  }

  const sorted = sortLevels(levels)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Levels</h1>
          <p className="mt-1 text-sm text-slate-500">
            Year groups such as 100 Level and 200 Level. The order number decides how they are listed.
          </p>
        </div>
        {!mode && (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Add level
          </button>
        )}
      </div>

      {mode && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 max-w-xl space-y-4 rounded-xl bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            {mode.kind === 'create' ? 'Add level' : `Edit ${mode.level.name}`}
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="level-name" className="block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                id="level-name"
                type="text"
                required
                placeholder="100 Level"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="level-order" className="block text-sm font-medium text-slate-700">
                Order
              </label>
              <input
                id="level-order"
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
              {saving ? 'Saving...' : mode.kind === 'create' ? 'Add level' : 'Save changes'}
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
            No levels yet. Use "Add level" to create the first one, for example 100 Level with order 1.
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
              {sorted.map((level) => (
                <tr key={level.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{level.sortOrder}</td>
                  <td className="px-4 py-3 text-slate-700">{level.name}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(level)}
                      className="mr-3 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(level)}
                      disabled={busyId === level.id}
                      className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      {busyId === level.id ? 'Working...' : 'Delete'}
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

export default LevelsPage