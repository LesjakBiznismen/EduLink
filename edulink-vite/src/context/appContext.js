import { createContext, useContext } from 'react'

export const AppContext = createContext(null)

export function useApp() {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp mora biti uporabljen znotraj AppProvider.')
  return value
}
