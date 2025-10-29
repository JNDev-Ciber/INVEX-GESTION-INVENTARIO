export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username")!
  const result = await sql`
    SELECT twofa_activated FROM users WHERE username = ${username} LIMIT 1
  `
  const user = result[0]
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  return NextResponse.json({ twofa_activated: user.twofa_activated })
}
