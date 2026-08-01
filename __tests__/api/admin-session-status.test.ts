/**
 * @jest-environment node
 *
 * Testet GET /api/admin/session-status (LP-06-Nachzieher): Das Dashboard soll
 * VOR dem Ablauf der Geräte-Anmeldung warnen können, nicht erst danach. Diese
 * Route liefert dafür nur die verbleibenden Tage — ohne selbst irgendetwas zu
 * verändern.
 */
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/admin/session-status/route'
import {
  ADMIN_COOKIE,
  DEVICE_COOKIE,
  createSessionToken,
  createDeviceCookie,
} from '@/lib/admin-auth'

function requestMitCookies(cookies: Record<string, string>): NextRequest {
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
  return new NextRequest('http://localhost/api/admin/session-status', {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  })
}

describe('GET /api/admin/session-status', () => {
  const ORIGINAL_ADMIN_PW = process.env.ADMIN_PASSWORD
  const ORIGINAL_DEVICE_TOKEN = process.env.DASHBOARD_DEVICE_TOKEN

  beforeAll(() => {
    process.env.ADMIN_PASSWORD = 'test-admin-password'
    process.env.DASHBOARD_DEVICE_TOKEN = 'test-device-token'
  })
  afterAll(() => {
    process.env.ADMIN_PASSWORD = ORIGINAL_ADMIN_PW
    process.env.DASHBOARD_DEVICE_TOKEN = ORIGINAL_DEVICE_TOKEN
  })

  it('rejects without a valid admin session', async () => {
    const res = await GET(requestMitCookies({}))
    expect(res.status).toBe(401)
  })

  it('returns null when the terminal has no device cookie (normal browser login)', async () => {
    const session = await createSessionToken()
    const res = await GET(requestMitCookies({ [ADMIN_COOKIE]: session }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.deviceExpiresInDays).toBeNull()
  })

  it('returns ~365 days for a freshly issued device cookie', async () => {
    const session = await createSessionToken()
    const device = await createDeviceCookie()
    const res = await GET(requestMitCookies({ [ADMIN_COOKIE]: session, [DEVICE_COOKIE]: device }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.deviceExpiresInDays).toBeGreaterThanOrEqual(364)
    expect(body.deviceExpiresInDays).toBeLessThanOrEqual(365)
  })

  it('ignores a tampered device cookie (falls back to null, no crash)', async () => {
    const session = await createSessionToken()
    const device = await createDeviceCookie()
    const tampered = device.slice(0, -1) + (device.endsWith('a') ? 'b' : 'a')
    const res = await GET(requestMitCookies({ [ADMIN_COOKIE]: session, [DEVICE_COOKIE]: tampered }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.deviceExpiresInDays).toBeNull()
  })
})
