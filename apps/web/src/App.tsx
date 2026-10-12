import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import { clearSession, loadSession } from './lib/auth'
import type { Session } from './lib/auth'

function App() {
  const [session, setSession] = useState<Session | null>(() => loadSession())

  function handleLogout() {
    clearSession()
    setSession(null)
  }

  if (!session) {
    return <LoginPage onLoggedIn={setSession} />
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 text-center shadow-md">
        <h1 className="text-2xl font-bold text-indigo-600">Signed in</h1>
        <p className="mt-3 text-sm text-slate-700">{session.user.email}</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
          {session.user.role}
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Sign out
        </button>
      </div>
    </main>
  )
}

export default App