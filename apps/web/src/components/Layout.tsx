import { NavLink, Outlet } from 'react-router-dom'
import type { Session } from '../lib/auth'
import type { AppContext } from '../lib/appContext'
import { roleLabel } from '../lib/format'

interface LayoutProps {
  session: Session
  onLogout: () => void
}

interface NavItem {
  to: string
  label: string
}

const adminNav: NavItem[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/faculties', label: 'Faculties' },
  { to: '/departments', label: 'Departments' },
  { to: '/programmes', label: 'Programmes' },
]

const defaultNav: NavItem[] = [{ to: '/', label: 'Dashboard' }]

function Layout({ session, onLogout }: LayoutProps) {
  const context: AppContext = { session, onLogout }
  const navItems =
    session.user.role === 'UNIVERSITY_SUPER_ADMIN' ? adminNav : defaultNav

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-60 shrink-0 flex-col bg-slate-900 text-slate-200 md:flex">
        <div className="px-6 py-5 text-2xl font-bold text-white">ClassQR</div>
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <span className="text-lg font-bold text-indigo-600 md:hidden">ClassQR</span>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-800">{session.user.email}</p>
              <p className="text-xs text-slate-500">{roleLabel(session.user.role)}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 md:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-6">
          <Outlet context={context} />
        </main>
      </div>
    </div>
  )
}

export default Layout