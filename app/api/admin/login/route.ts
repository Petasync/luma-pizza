import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE, createSessionToken } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ADMIN_COOKIE_MAX_AGE,
    path: '/',
  })
  return res
}
