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

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
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

export const ADMIN_COOKIE_MAX_AGE = MAX_AGE_SECONDS
