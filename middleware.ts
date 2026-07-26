import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, DEVICE_COOKIE, verifySessionToken } from '@/lib/admin-auth'

export async function middleware(req: NextRequest) {
  const isLoginPage = req.nextUrl.pathname === '/admin/login'
  if (req.nextUrl.pathname.startsWith('/admin') && !isLoginPage) {
    const token = req.cookies.get(ADMIN_COOKIE)?.value
    const valid = await verifySessionToken(token)
    if (!valid) {
      const url = req.nextUrl.clone()
      // Das Küchen-Terminal erkennt man am langlebigen Geräte-Cookie. Statt es
      // vor eine Passwortmaske zu setzen, die dort nie jemand bedient, erneuern
      // wir die Sitzung und schicken es zurück auf die gewünschte Seite.
      // Ob das Cookie echt ist, prüft /api/admin/refresh — hier zählt nur, ob
      // überhaupt eines vorliegt.
      if (req.cookies.get(DEVICE_COOKIE)?.value) {
        url.pathname = '/api/admin/refresh'
        url.search = `?weiter=${encodeURIComponent(req.nextUrl.pathname)}`
      } else {
        url.pathname = '/admin/login'
      }
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
