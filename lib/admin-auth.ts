/**
 * Admin session tokens. The old implementation stored the raw ADMIN_PASSWORD as
 * the cookie value — so the password sat in plaintext in every admin's browser
 * and any XSS / cookie leak would hand over the password itself.
 *
 * Instead we issue a short HMAC-signed token: `<expiry>.<signature>`. It proves
 * the holder knew the password at login time, expires on its own, and never
 * exposes the password. Uses Web Crypto so it runs in both the Edge middleware
 * and Node API routes.
 */

export const ADMIN_COOKIE = 'admin_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

function getSecret(): string {
  const secret = process.env.ADMIN_PASSWORD
  if (!secret) throw new Error('ADMIN_PASSWORD is not set')
  return secret
}

async function hmac(payload: string, secret: string = getSecret()): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Constant-time string comparison to avoid timing attacks on the signature. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** Creates a signed session token valid for MAX_AGE_SECONDS. */
export async function createSessionToken(): Promise<string> {
  const expiry = Date.now() + MAX_AGE_SECONDS * 1000
  const payload = String(expiry)
  const sig = await hmac(payload)
  return `${payload}.${sig}`
}

/** Returns true only for a well-formed, correctly-signed, non-expired token. */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false
  const dot = token.indexOf('.')
  if (dot <= 0) return false
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)

  const expiry = Number(payload)
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false

  const expected = await hmac(payload)
  return timingSafeEqual(sig, expected)
}

/**
 * Verifies the device login token used by the restaurant terminal (kiosk laptop).
 * It is a separate bearer secret from ADMIN_PASSWORD so it can be rotated on its
 * own — e.g. if the laptop is lost — without forcing every staff member to learn
 * a new password. Compared in constant time to avoid leaking it via timing.
 */
export function verifyDeviceToken(key: string | undefined | null): boolean {
  const expected = process.env.DASHBOARD_DEVICE_TOKEN
  if (!expected || !key) return false
  return timingSafeEqual(key, expected)
}

export const ADMIN_COOKIE_MAX_AGE = MAX_AGE_SECONDS

// -----------------------------------------------------------------------------
// Geräte-Anmeldung des Küchen-Terminals
// -----------------------------------------------------------------------------
//
// Die normale Sitzung läuft nach 7 Tagen ab — richtig so für Menschen, fatal für
// das Terminal: der Kiosk-Laptop lief mit offener Dashboard-Seite weiter, die
// Sitzung verfiel im Hintergrund und ab da lieferte /api/admin/orders nur noch
// 401. Kadir sah eine normal aussehende, aber eingefrorene Seite (26.07.2026).
//
// Lösung: Beim Kiosk-Login bekommt das Gerät zusätzlich ein langlebiges
// Geräte-Cookie. Läuft die Sitzung ab, erneuert das Dashboard sie damit
// selbstständig — ohne dass jemand etwas tippen muss.
//
// Wichtig: Im Cookie steht NICHT der Geräte-Token selbst, sondern nur eine mit
// ihm erzeugte Signatur. Wird DASHBOARD_DEVICE_TOKEN in Vercel geändert (z. B.
// weil der Laptop weg ist), sind alle Geräte-Cookies sofort ungültig.

export const DEVICE_COOKIE = 'admin_device'
const DEVICE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 // 1 Jahr
export const DEVICE_COOKIE_MAX_AGE = DEVICE_MAX_AGE_SECONDS

function getDeviceSecret(): string {
  const secret = process.env.DASHBOARD_DEVICE_TOKEN
  if (!secret) throw new Error('DASHBOARD_DEVICE_TOKEN is not set')
  return secret
}

/** Erzeugt das langlebige Geräte-Cookie (Format wie die Sitzung: `<Ablauf>.<Signatur>`). */
export async function createDeviceCookie(): Promise<string> {
  const expiry = Date.now() + DEVICE_MAX_AGE_SECONDS * 1000
  const payload = String(expiry)
  return `${payload}.${await hmac(payload, getDeviceSecret())}`
}

/**
 * Liest den eingebetteten Ablaufzeitpunkt (ms seit Epoch) aus einem Token der
 * Form `<Ablauf>.<Signatur>`, OHNE die Signatur zu prüfen. Nur zur Anzeige
 * "läuft in X Tagen ab" gedacht — der Aufrufer muss die Echtheit vorher schon
 * per verifySessionToken()/verifyDeviceCookie() festgestellt haben.
 */
export function getTokenExpiryMs(token: string | undefined | null): number | null {
  if (!token) return null
  const dot = token.indexOf('.')
  if (dot <= 0) return null
  const expiry = Number(token.slice(0, dot))
  return Number.isFinite(expiry) ? expiry : null
}

/** Prüft das Geräte-Cookie gegen den aktuellen DASHBOARD_DEVICE_TOKEN. */
export async function verifyDeviceCookie(token: string | undefined | null): Promise<boolean> {
  if (!token) return false
  if (!process.env.DASHBOARD_DEVICE_TOKEN) return false

  const dot = token.indexOf('.')
  if (dot <= 0) return false
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)

  const expiry = Number(payload)
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false

  return timingSafeEqual(sig, await hmac(payload, getDeviceSecret()))
}
