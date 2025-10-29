import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import QRCode from "qrcode"

// Función para generar secreto base32
function generateSecret(length = 20) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  let secret = ""
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  for (let i = 0; i < length; i++) secret += charset[array[i] % 32]
  return secret
}

// Función para crear URL OTP Auth
function getOtpAuthUrl(user: string, service: string, secret: string) {
  return `otpauth://totp/${service}:${user}?secret=${secret}&issuer=${service}&algorithm=SHA1&digits=6&period=30`
}

export const runtime = "edge"

export async function POST(req: NextRequest) {
  const { username } = await req.json()
  if (!username) return NextResponse.json({ error: "Falta username" }, { status: 400 })

  const result = await sql`
    SELECT twofa_activated FROM users WHERE username = ${username} LIMIT 1
  `
  const user = result[0]
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  if (user.twofa_activated) return NextResponse.json({ error: "2FA ya activado" }, { status: 403 })

  const secret = generateSecret()
  const otpauth_url = getOtpAuthUrl(username, "ELECTROLUXSTORE", secret)
  const qr = await QRCode.toDataURL(otpauth_url)

  await sql`
    UPDATE users SET twofa_secret = ${secret} WHERE username = ${username}
  `
  return NextResponse.json({ qr })
}
