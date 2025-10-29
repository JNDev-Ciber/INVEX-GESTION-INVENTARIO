import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { authenticator } from "otplib"

export const runtime = "edge"  

export async function POST(req: NextRequest) {
  const { username, code } = await req.json()
  
  const result = await sql`
    SELECT twofa_secret, twofa_activated FROM users WHERE username = ${username} LIMIT 1
  `
  const user = result[0]
  
  if (!user || !user.twofa_secret) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const isValid = authenticator.verify({ token: code, secret: user.twofa_secret })

  if (isValid) {
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
