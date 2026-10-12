import { useOutletContext } from 'react-router-dom'
import type { Session } from './auth'

export interface AppContext {
  session: Session
  onLogout: () => void
}

export function useAppContext(): AppContext {
  return useOutletContext<AppContext>()
}