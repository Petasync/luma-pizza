import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
  DEVICE_COOKIE,
  DEVICE_COOKIE_MAX_AGE,
  createDeviceCookie,
  createSessionToken,
  verifyDeviceToken,
} from '@/lib/admin-auth'

/**
 * Device login for the restaurant kiosk terminal. The laptop opens
 *   /api/admin/device?key=<DASHBOARD_DEVICE_TOKEN>
 * on every boot; on a valid token we mint the normal admin session cookie and
 * redirect to the dashboard, so the terminal is always logged in without anyone
 * typing the password. This route lives under /api/admin/* and is therefore not
 * gated by the middleware (which only matches /admin/:path*).
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (!verifyDeviceToken(key)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const url = req.nextUrl.clone()
  url.pathname = '/admin'
  url.search = ''
  const res = NextResponse.redirect(url)
  const cookieBasis = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  }
  res.cookies.set(ADMIN_COOKIE, await createSessionToken(), {
    ...cookieBasis,
    maxAge: ADMIN_COOKIE_MAX_AGE,
  })
  // Langlebiges Geräte-Cookie: damit kann das Terminal seine 7-Tage-Sitzung
  // selbst erneuern, wenn sie mitten im Betrieb abläuft (siehe /api/admin/refresh).
  res.cookies.set(DEVICE_COOKIE, await createDeviceCookie(), {
    ...cookieBasis,
    maxAge: DEVICE_COOKIE_MAX_AGE,
  })
  return res
}
