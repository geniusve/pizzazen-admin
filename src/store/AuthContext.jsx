import { createContext, useContext, useState, useEffect } from 'react'
import api from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [utente, setUtente]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('pizzapax_admin_token')
    const saved = localStorage.getItem('pizzapax_admin_utente')
    if (token && saved) setUtente(JSON.parse(saved))
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    const res = await api.post('/auth/admin/login', { username, password })
    const { token, utente } = res.data
    localStorage.setItem('pizzapax_admin_token', token)
    localStorage.setItem('pizzapax_admin_utente', JSON.stringify(utente))
    setUtente(utente)
    return utente
  }

  const logout = () => {
    localStorage.removeItem('pizzapax_admin_token')
    localStorage.removeItem('pizzapax_admin_utente')
    setUtente(null)
  }

  return (
    <AuthContext.Provider value={{ utente, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
