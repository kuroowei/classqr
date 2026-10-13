import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAppContext } from '../lib/appContext'
import { listDepartments } from '../lib/departments'
import type { Department } from '../lib/departments'
import { describeError } from '../lib/errors'
import {
  createProgramme,
  deactivateProgramme,
  listProgrammes,
  updateProgramme,
} from '../lib/programmes'
import type { Programme } from '../lib/programmes'

interface FormState {
  departmentId: string
  name: string
  code: string
  degreeType: string
  durationYears: string
}

const emptyForm: FormState = {
  departmentId: '',
  name: '',
  code: '',
  degreeType: '',
  durationYears: '',
}

type FormMode =
  | { kind: 'create' }
  | { kind: 'edit'; programme: Programme }
  | null

const degreeSuggestions = [
  'B.Sc.',
  'B.A.',
  'B.Ed.',
  'B.Eng.',
  'B.Tech.',
  'B.Agric.',
  'B.Pharm.',
  'B.N.Sc.',
  'PGD',
  'M.Sc.',
  'M.A.',
  'M.Ed.',
  'M.Eng.',
  'Ph.D.',
]

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

function ProgrammesPage() {
  const { session, onLogout } = useAppContext()
  const token = session.accessToken

  const [programmes, setProgrammes] = useState<Programme[] | null>(null)
  const [departments, setDepartments] = useState<Department[] | null>(null)
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

    Promise.all([listProgrammes(token), listDepartments(token)])
      .then(([programmeList, departmentList]) => {
        if (cancelled) return
        setProgrammes(programmeList)
        setDepartments(departmentList)
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
    setProgrammes(null)
    setDepartments(null)
    setReloadKey((key) => key + 1)
  }

  function openCreate() {
    setMode({ kind: 'create' })
    setForm(emptyForm)
    setFormError(null)
  }

  function openEdit(programme: Programme) {
    setMode({ kind: 'edit', programme })
    setForm({
      departmentId: programme.departmentId,
      name: programme.name,
      code: programme.code,
      degreeType: programme.degreeType ?? '',
      durationYears:
        programme.durationYears !== null ? String(programme.durationYears) : '',
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

    const departmentId = form.departmentId
    const name = form.name.trim()
    const code = form.code.trim()
    const degreeType = form.degreeType.trim()
    const durationText = form.durationYears.trim()
    const durationYears = durationText ? Number(durationText) : undefined

    if (
      durationYears !== undefined &&
      (!Number.isInteger(durationYears) || durationYears < 1)
    ) {
      setFormError('Duration must be a whole number of years, such as 4.')
      return
    }

    setSaving(true)

    try {
      if (mode.kind === 'create') {
        const created = await createProgramme(token, {
          departmentId,
          name,
          code,
          ...(degreeType ? { degreeType } : {}),
          ...(durationYears !== undefined ? { durationYears } : {}),
        })
        setProgrammes((current) => [...(current ?? []), created])
      } else {
        const updated = await updateProgramme(token, mode.programme.id, {
          departmentId,
          name,
          code,
          degreeType,
          ...(durationYears !== undefined ? { durationYears } : {}),
        })
        setProgrammes((current) =>
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

  async function handleDeactivate(programme: Programme) {
    const confirmed = window.confirm(
      `Deactivate "${programme.name}"? It will be marked inactive.`,
    )
    if (!confirmed) return

    setActionError(null)
    setBusyId(programme.id)

    try {
      const updated = await deactivateProgramme(token, programme.id)
      setProgrammes((current) =>
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

  if (!programmes || !departments) {
    return <p className="text-sm text-slate-500">Loading programmes...</p>
  }

  const departmentById = new Map(
    departments.map((department) => [department.id, department]),
  )
  const hasActiveDepartment = departments.some(
    (department) => department.status === 'ACTIVE',
  )

  // Active departments, plus the programme's current department while editing.
  const departmentOptions = departments.filter(
    (department) =>
      department.status === 'ACTIVE' || department.id === form.departmentId,
  )

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Programmes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Degree programmes offered by each department.
          </p>
        </div>
        {!mode && hasActiveDepartment && (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Add programme
          </button>
        )}
      </div>

      {!hasActiveDepartment && (
        <p className="mt-4 max-w-2xl rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          You need at least one active department before you can add a programme.{' '}
          <Link to="/departments" className="font-medium underline">
            Go to Departments
          </Link>
        </p>
      )}

      {mode && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 max-w-2xl space-y-4 rounded-xl bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            {mode.kind === 'create' ? 'Add programme' : `Edit ${mode.programme.name}`}
          </h2>

          <div>
            <label htmlFor="programme-department" className="block text-sm font-medium text-slate-700">
              Department
            </label>
            <select
              id="programme-department"
              required
              value={form.departmentId}
              onChange={(e) => updateField('departmentId', e.target.value)}
              className={inputClass}
            >
              <option value="">Select a department</option>
              {departmentOptions.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name} ({department.code})
                  {department.status !== 'ACTIVE' ? ' - inactive' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="programme-name" className="block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                id="programme-name"
                type="text"
                required
                minLength={2}
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="programme-code" className="block text-sm font-medium text-slate-700">
                Code
              </label>
              <input
                id="programme-code"
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="programme-degree" className="block text-sm font-medium text-slate-700">
                Degree type (optional)
              </label>
              <input
                id="programme-degree"
                type="text"
                list="degree-suggestions"
                value={form.degreeType}
                onChange={(e) => updateField('degreeType', e.target.value)}
                className={inputClass}
              />
              <datalist id="degree-suggestions">
                {degreeSuggestions.map((degree) => (
                  <option key={degree} value={degree} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="programme-duration" className="block text-sm font-medium text-slate-700">
                Duration in years (optional)
              </label>
              <input
                id="programme-duration"
                type="number"
                min={1}
                step={1}
                value={form.durationYears}
                onChange={(e) => updateField('durationYears', e.target.value)}
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
              {saving ? 'Saving...' : mode.kind === 'create' ? 'Add programme' : 'Save changes'}
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
        {programmes.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No programmes yet.
            {hasActiveDepartment ? ' Use "Add programme" to create the first one.' : ''}
          </p>
        ) : (
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Degree</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {programmes.map((programme) => (
                <tr key={programme.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{programme.code}</td>
                  <td className="px-4 py-3 text-slate-700">{programme.name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {departmentById.get(programme.departmentId)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{programme.degreeType || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {programme.durationYears !== null
                      ? `${programme.durationYears} ${programme.durationYears === 1 ? 'year' : 'years'}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        programme.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {programme.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(programme)}
                      className="mr-3 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Edit
                    </button>
                    {programme.status === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() => handleDeactivate(programme)}
                        disabled={busyId === programme.id}
                        className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        {busyId === programme.id ? 'Working...' : 'Deactivate'}
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

export default ProgrammesPage