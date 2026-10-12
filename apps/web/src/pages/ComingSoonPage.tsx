import { roleLabel } from '../lib/format'

interface ComingSoonPageProps {
  role: string
}

function ComingSoonPage({ role }: ComingSoonPageProps) {
  return (
    <div className="max-w-md rounded-xl bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-slate-900">Coming soon</h1>
      <p className="mt-2 text-sm text-slate-600">
        Screens for the {roleLabel(role)} role have not been built yet.
      </p>
    </div>
  )
}

export default ComingSoonPage