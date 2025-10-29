export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { authenticator } from "otplib"
import QRCode from "qrcode"


export async function POST(req: NextRequest) {
  const { username } = await req.json()
  const result = await sql`
    SELECT twofa_activated FROM users WHERE username = ${username} LIMIT 1
  `
  const user = result[0]
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  if (user.twofa_activated) return NextResponse.json({ error: "2FA ya activado" }, { status: 403 })

  const secret = authenticator.generateSecret()
  const otpauth_url = authenticator.keyuri(username, "ELECTROLUXSTORE", secret)
  const qr = await QRCode.toDataURL(otpauth_url)

  await sql`
    UPDATE users SET twofa_secret = ${secret} WHERE username = ${username}
  `
  return NextResponse.json({ qr })
}
