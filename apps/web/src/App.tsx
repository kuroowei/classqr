import { useCallback, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ComingSoonPage from './pages/ComingSoonPage'
import DashboardPage from './pages/DashboardPage'
import DepartmentsPage from './pages/DepartmentsPage'
import FacultiesPage from './pages/FacultiesPage'
import LevelsPage from './pages/LevelsPage'
import LoginPage from './pages/LoginPage'
import ProgrammesPage from './pages/ProgrammesPage'
import { clearSession, loadSession } from './lib/auth'
import type { Session } from './lib/auth'

function App() {
  const [session, setSession] = useState<Session | null>(() => loadSession())

  const handleLogout = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  if (!session) {
    return <LoginPage onLoggedIn={setSession} />
  }

  const isUniversityAdmin = session.user.role === 'UNIVERSITY_SUPER_ADMIN'

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout session={session} onLogout={handleLogout} />}>
          <Route
            index
            element={
              isUniversityAdmin ? (
                <DashboardPage />
              ) : (
                <ComingSoonPage role={session.user.role} />
              )
            }
          />
          <Route
            path="faculties"
            element={isUniversityAdmin ? <FacultiesPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="departments"
            element={isUniversityAdmin ? <DepartmentsPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="programmes"
            element={isUniversityAdmin ? <ProgrammesPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="levels"
            element={isUniversityAdmin ? <LevelsPage /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App