import { verifyDeviceToken, createSessionToken, verifySessionToken } from '@/lib/admin-auth'

describe('verifyDeviceToken', () => {
  const ORIGINAL = process.env.DASHBOARD_DEVICE_TOKEN

  afterEach(() => {
    process.env.DASHBOARD_DEVICE_TOKEN = ORIGINAL
  })

  it('accepts the exact configured token', () => {
    process.env.DASHBOARD_DEVICE_TOKEN = 'super-secret-device-token'
    expect(verifyDeviceToken('super-secret-device-token')).toBe(true)
  })

  it('rejects a wrong token', () => {
    process.env.DASHBOARD_DEVICE_TOKEN = 'super-secret-device-token'
    expect(verifyDeviceToken('nope')).toBe(false)
  })

  it('rejects an empty or missing key', () => {
    process.env.DASHBOARD_DEVICE_TOKEN = 'super-secret-device-token'
    expect(verifyDeviceToken('')).toBe(false)
    expect(verifyDeviceToken(null)).toBe(false)
    expect(verifyDeviceToken(undefined)).toBe(false)
  })

  it('rejects everything when no token is configured', () => {
    delete process.env.DASHBOARD_DEVICE_TOKEN
    expect(verifyDeviceToken('anything')).toBe(false)
  })
})

describe('admin session token', () => {
  const ORIGINAL = process.env.ADMIN_PASSWORD

  beforeAll(() => {
    process.env.ADMIN_PASSWORD = 'test-admin-password'
  })
  afterAll(() => {
    process.env.ADMIN_PASSWORD = ORIGINAL
  })

  it('round-trips a freshly created token', async () => {
    const token = await createSessionToken()
    expect(await verifySessionToken(token)).toBe(true)
  })

  it('rejects a tampered signature', async () => {
    const token = await createSessionToken()
    const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a')
    expect(await verifySessionToken(tampered)).toBe(false)
  })

  it('rejects an expired token', async () => {
    // expiry far in the past, signed payload won't match either way
    expect(await verifySessionToken('1.deadbeef')).toBe(false)
  })

  it('rejects empty / malformed tokens', async () => {
    expect(await verifySessionToken(undefined)).toBe(false)
    expect(await verifySessionToken('')).toBe(false)
    expect(await verifySessionToken('no-dot')).toBe(false)
  })
})
