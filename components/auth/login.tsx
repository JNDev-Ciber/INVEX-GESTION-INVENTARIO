"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Setup2FA } from "./Setup2FA"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, User, KeyRound, Lock } from "lucide-react"

export function Login({ onLogin }: { onLogin: (username: string) => void }) {
  const [step, setStep] = useState<"credentials" | "2fa">("credentials")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Trusted device: si existe y no expiró, loguea directo
  const checkTrusted2FA = (username: string) => {
    try {
      const trustedExpiry = localStorage.getItem("electrolux_trusted_2fa")
      if (trustedExpiry && parseInt(trustedExpiry) > Date.now()) {
        onLogin(username)
        return true
      }
    } catch {}
    return false
  }

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    })
    const data = await res.json()
    setLoading(false)
    if (data.ok) {
      // Si trusted device, loguea directo
      if (!checkTrusted2FA(username)) {
        setStep("2fa")
      }
    } else {
      setError("Usuario o contraseña incorrectos.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 py-8 px-2">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col items-center gap-2 mb-2">
          <Lock className="h-10 w-10 text-red-600" />
          <h1 className="text-2xl font-bold text-red-700 tracking-tight">Acceso Seguro</h1>
          <p className="text-sm text-gray-500 text-center">Sistema de Inventario Electrolux</p>
        </div>
        {step === "credentials" && (
          <form onSubmit={handleCredentials} className="flex flex-col gap-4">
            <div>
              <label htmlFor="username" className="block mb-1 text-sm font-medium text-gray-700">
                Usuario
              </label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoFocus
                  required
                  autoComplete="username"
                  className="pl-10"
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pl-10"
                />
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow"
              disabled={loading}
            >
              {loading ? "Verificando..." : "Iniciar sesión"}
            </Button>
          </form>
        )}
        {/* Si trusted device, no muestra nada acá porque ya te logueó */}
        {step === "2fa" && (
          <Setup2FA
            username={username}
            onComplete={() => onLogin(username)}
          />
        )}
        <div className="text-xs text-gray-400 text-center pt-2">
          &copy; {new Date().getFullYear()} ElectroluxStore
        </div>
      </div>
    </div>
  )
}
