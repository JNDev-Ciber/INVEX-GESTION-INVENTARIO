export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  const result = await sql`
    SELECT * FROM users WHERE username = ${username} LIMIT 1
  `
  const user = result[0]
  if (!user || user.password !== password) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  return NextResponse.json({ ok: true })
}
