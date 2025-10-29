"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, QrCode, Smartphone } from "lucide-react"

interface Setup2FAProps {
  username: string
  onComplete: () => void
}

export function Setup2FA({ username, onComplete }: Setup2FAProps) {
  const [qr, setQr] = useState<string | null>(null)
  const [activated, setActivated] = useState<boolean>(false)
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)

  // Contador para el código TOTP
  useEffect(() => {
    const updateTime = () => {
      const now = Math.floor(Date.now() / 1000)
      setTimeLeft(30 - (now % 30))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetch(`/api/auth/2fa-status?username=${encodeURIComponent(username)}`)
      .then(res => res.json())
      .then(data => {
        if (data.twofa_activated) {
          setActivated(true)
        } else {
          fetch('/api/auth/2fa-generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
          })
            .then(res => res.json())
            .then(data => {
              if (data.qr) setQr(data.qr)
              else setError(data.error || "No se pudo generar el QR.")
            })
        }
      })
  }, [username])

  const handleVerify = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    const res = await fetch("/api/auth/2fa-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, code })
    })
    const data = await res.json()
    setLoading(false)
    if (data.ok) {
      setSuccess(true)
      // Guardar "trusted device" en localStorage por 30 días
      const trustedExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000
      localStorage.setItem("electrolux_trusted_2fa", trustedExpiry.toString())
      onComplete()
    } else {
      setError("Código incorrecto o expirado.")
    }
  }

  return (
    <div className="flex flex-col gap-5 items-center w-full">
      {!activated && qr && (
        <div className="w-full text-center">
          <div className="flex flex-col items-center gap-2 mb-2">
            <QrCode className="h-8 w-8 text-red-600" />
            <p className="text-base font-medium text-gray-700">
              Escanea este QR con tu autenticador
            </p>
            <p className="text-xs text-gray-500 mb-2">
              Usa Google Authenticator, Authy, Microsoft Authenticator, etc.
            </p>
          </div>
          <img src={qr} alt="QR 2FA" className="mx-auto border-2 border-red-200 rounded-lg shadow-lg w-44 h-44 bg-white" />
        </div>
      )}
      <div className="w-full">
        <label className="block mb-1 text-sm font-medium text-gray-700">
          Código de 6 dígitos
        </label>
        <div className="relative">
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
            autoFocus
            className="pl-10 text-center tracking-widest text-lg"
          />
          <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
        <div className="flex items-center justify-between w-full mt-1">
          <span className="text-xs text-gray-500">Código de tu autenticador</span>
          <span
            className={`text-xs font-semibold ${
              timeLeft <= 5 ? "text-red-600" : "text-gray-700"
            }`}
            title="Tiempo hasta el próximo código"
          >
            {timeLeft}s
          </span>
        </div>
      </div>
      {error && (
        <Alert variant="destructive" className="w-full">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="w-full">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>¡2FA Activado y verificado!</AlertDescription>
        </Alert>
      )}
      <Button
        onClick={handleVerify}
        disabled={code.length !== 6 || loading}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow"
      >
        {loading ? "Verificando..." : "Verificar"}
      </Button>
    </div>
  )
}
