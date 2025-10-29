"use client"
import { useState, useEffect } from 'react'
import { Login } from "../components/auth/login"
import { Dashboard } from "../components/dashboard"

interface User {
  username: string
  has2FA: boolean
  role?: string
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // ✅ VERIFICAR SESIÓN DE 15 DÍAS AL CARGAR
  useEffect(() => {
    const checkSession = () => {
      try {
        const sessionExpiry = localStorage.getItem('electrolux_session_expiry')
        const savedUser = localStorage.getItem('electrolux_user')
        const logged = localStorage.getItem('electrolux_logged')
        
        if (logged === 'true' && sessionExpiry && savedUser) {
          const expiryDate = new Date(sessionExpiry)
          const now = new Date()
          
          if (now < expiryDate) {
            // Sesión de 15 días aún válida
            const userData = JSON.parse(savedUser)
            setCurrentUser(userData)
            setIsLoggedIn(true)
          } else {
            // Sesión expirada, limpiar solo el estado de login
            localStorage.removeItem('electrolux_logged')
            localStorage.removeItem('electrolux_user')
            localStorage.removeItem('electrolux_session_expiry')
            // ✅ MANTENER: electrolux_2fa_secret para próximo login
          }
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error)
        // Si hay error al parsear, limpiar datos de sesión
        localStorage.removeItem('electrolux_logged')
        localStorage.removeItem('electrolux_user')
        localStorage.removeItem('electrolux_session_expiry')
      } finally {
        setLoading(false)
      }
    }

    // Verificar solo si estamos en el cliente
    if (typeof window !== 'undefined') {
      checkSession()
    } else {
      setLoading(false)
    }
  }, [])

  // Ahora handleLogin recibe el username (string)
  const handleLogin = (username: string) => {
    // Si quieres, puedes obtener has2FA y role del backend, aquí ejemplo simple:
    const user: User = {
      username,
      has2FA: true, // puedes actualizar esto según tu lógica real
      role: "admin"
    }
    setCurrentUser(user)
    setIsLoggedIn(true)
    // (Opcional) Guarda la sesión para 15 días:
    const expiry = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    localStorage.setItem('electrolux_logged', 'true')
    localStorage.setItem('electrolux_user', JSON.stringify(user))
    localStorage.setItem('electrolux_session_expiry', expiry.toISOString())
  }

  const handleLogout = () => {
    // ✅ LIMPIAR SESIÓN PERO MANTENER 2FA
    localStorage.removeItem('electrolux_logged')
    localStorage.removeItem('electrolux_user')
    localStorage.removeItem('electrolux_session_expiry')
    // ✅ NO borrar electrolux_2fa_secret para mantener configuración 2FA
    
    setIsLoggedIn(false)
    setCurrentUser(null)
  }

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="h-12 w-12 rounded-lg bg-red-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-extrabold text-xl">E</span>
          </div>
          <p className="text-muted-foreground">Cargando ELECTROLUXSTORE...</p>
          <div className="mt-2 flex justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
          </div>
        </div>
      </div>
    )
  }

  // Si no está logueado, mostrar login
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />
  }

  // Si está logueado, mostrar dashboard
  return <Dashboard onLogout={handleLogout} currentUser={currentUser} />
}
