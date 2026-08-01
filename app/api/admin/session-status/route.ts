import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_COOKIE,
  DEVICE_COOKIE,
  verifySessionToken,
  verifyDeviceCookie,
  getTokenExpiryMs,
} from '@/lib/admin-auth'

/**
 * Wie viele Tage die Geräte-Anmeldung des Küchen-Terminals noch gültig ist —
 * damit das Dashboard rechtzeitig warnen kann, BEVOR sie abläuft.
 *
 * Hintergrund: Die normale 7-Tage-Sitzung erneuert sich seit dem Vorfall vom
 * 26.07.2026 selbstständig über das langlebige Geräte-Cookie (siehe
 * /api/admin/refresh, docs/ZAHLUNG-ABSICHERUNG.md Abschnitt 3). Das
 * Geräte-Cookie selbst läuft aber nach einem Jahr aus und erneuert sich nur,
 * wenn der Kiosk-Laptop neu bootet (erneuter Aufruf von /api/admin/device).
 * Bleibt der Laptop länger durchgehend an, würde das Terminal irgendwann doch
 * wieder blind — diesmal ohne, dass ein Neustart die Ursache wäre. Diese
 * Route macht die verbleibende Gültigkeit sichtbar, statt das erst beim
 * tatsächlichen Ausfall zu bemerken.
 */
export async function GET(req: NextRequest) {
  const sessionValid = await verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value)
  if (!sessionValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const deviceToken = req.cookies.get(DEVICE_COOKIE)?.value
  const deviceValid = await verifyDeviceCookie(deviceToken)
  if (!deviceValid) {
    // Kein (gültiges) Geräte-Cookie vorhanden — z. B. normaler Browser-Login
    // per Passwort statt Kiosk-Terminal. Keine Vorwarnung nötig/möglich.
    return NextResponse.json({ deviceExpiresInDays: null })
  }

  const expiryMs = getTokenExpiryMs(deviceToken)
  const deviceExpiresInDays = expiryMs === null
    ? null
    : Math.floor((expiryMs - Date.now()) / (1000 * 60 * 60 * 24))

  return NextResponse.json({ deviceExpiresInDays })
}
