import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { setAccessToken } from '../api/client'
import { connectSocket, disconnectSocket } from '../socket/socket'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const didRestore            = useRef(false)

  // On mount: silently try to restore session via refresh token cookie
  useEffect(() => {
    if (didRestore.current) return
    didRestore.current = true

    fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then(async r => {
        if (!r.ok) return
        const { accessToken } = await r.json()
        setAccessToken(accessToken)
        const me = await fetch(`${BASE}/users/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
        })
        if (me.ok) {
          setUser(await me.json())
          connectSocket()
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Login failed')
    }
    const { accessToken, user: u } = await res.json()
    setAccessToken(accessToken)
    setUser(u)
    connectSocket()
    return u
  }

  async function logout() {
    await fetch(`${BASE}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {})
    disconnectSocket()
    setAccessToken(null)
    setUser(null)
  }

  function updateUser(fields) {
    setUser(prev => ({ ...prev, ...fields }))
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
