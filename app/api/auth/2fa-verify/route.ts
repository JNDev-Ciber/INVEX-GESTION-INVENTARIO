import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"

// Convierte secreto base32 a Uint8Array
function base32ToBytes(base32: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  const cleaned = base32.replace(/=+$/, "").toUpperCase()
  const bytes = new Uint8Array((cleaned.length * 5) / 8)
  let buffer = 0, bitsLeft = 0, index = 0
  for (const char of cleaned) {
    const val = alphabet.indexOf(char)
    if (val === -1) continue
    buffer = (buffer << 5) | val
    bitsLeft += 5
    if (bitsLeft >= 8) {
      bitsLeft -= 8
      bytes[index++] = (buffer >> bitsLeft) & 0xff
    }
  }
  return bytes
}

// Genera TOTP con Web Crypto
async function generateTOTP(secret: string, time = Date.now()) {
  const key = base32ToBytes(secret)
  const counter = Math.floor(time / 30000)
  const counterBytes = new ArrayBuffer(8)
  const view = new DataView(counterBytes)
  view.setUint32(4, counter)
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-1" }, false, ["sign"])
  const hmac = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, counterBytes))
  const offset = hmac[hmac.length - 1] & 0xf
  const code = ((hmac[offset] & 0x7f) << 24) |
               ((hmac[offset + 1] & 0xff) << 16) |
               ((hmac[offset + 2] & 0xff) << 8) |
               (hmac[offset + 3] & 0xff)
  return (code % 1000000).toString().padStart(6, "0")
}

export const runtime = "edge"

export async function POST(req: NextRequest) {
  const { username, code } = await req.json()
  if (!username || !code) return NextResponse.json({ ok: false }, { status: 400 })

  const result = await sql`
    SELECT twofa_secret, twofa_activated FROM users WHERE username = ${username} LIMIT 1
  `
  const user = result[0]
  if (!user || !user.twofa_secret) return NextResponse.json({ ok: false }, { status: 400 })

  const validCode = await generateTOTP(user.twofa_secret)
  if (validCode === code) {
    if (!user.twofa_activated) {
      await sql`
        UPDATE users SET twofa_activated = true, twofa_activated_at = NOW() WHERE username = ${username}
      `
    }
    return NextResponse.json({ ok: true })
  } else {
    return NextResponse.json({ ok: false })
  }
}
