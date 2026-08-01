import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
  DEVICE_COOKIE,
  createSessionToken,
  verifyDeviceCookie,
} from '@/lib/admin-auth'

/**
 * Erneuert die abgelaufene Sitzung des Küchen-Terminals — ohne dass jemand ein
 * Passwort tippen muss.
 *
 * Das Dashboard ruft das automatisch auf, sobald `/api/admin/orders` mit 401
 * antwortet. Grundlage ist das langlebige Geräte-Cookie aus dem Kiosk-Login.
 * Ein normaler Browser ohne dieses Cookie bekommt hier nichts.
 */
async function erneuere(req: NextRequest): Promise<NextResponse | null> {
  const gueltig = await verifyDeviceCookie(req.cookies.get(DEVICE_COOKIE)?.value)
  if (!gueltig) return null

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

export async function POST(req: NextRequest) {
  const res = await erneuere(req)
  return res ?? NextResponse.json({ error: 'Kein gültiges Gerät.' }, { status: 401 })
}

/**
 * GET-Variante für den Seitenaufruf: Die Middleware schickt ein Terminal mit
 * abgelaufener Sitzung hierher statt auf die Login-Maske. Nach dem Erneuern
 * geht es direkt zurück auf die gewünschte Seite.
 */
export async function GET(req: NextRequest) {
  const erneuert = await erneuere(req)
  const ziel = req.nextUrl.searchParams.get('weiter')
  // Nur seiteninterne Ziele zulassen — sonst ließe sich hierüber auf fremde
  // Adressen weiterleiten.
  const pfad = ziel && ziel.startsWith('/') && !ziel.startsWith('//') ? ziel : '/admin'

  const url = req.nextUrl.clone()
  url.search = ''
  url.pathname = erneuert ? pfad : '/admin/login'

  const res = NextResponse.redirect(url)
  if (erneuert) {
    const cookie = erneuert.cookies.get(ADMIN_COOKIE)
    if (cookie) res.cookies.set(cookie)
  }
  return res
}
