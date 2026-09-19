/**
 * @jest-environment node
 */
// jsdom (das Standard-testEnvironment dieses Repos) kennt AbortSignal.timeout
// nicht — die Implementierung braucht die echte Node-Umgebung.
import { ablaufPing } from '@/lib/ablauf-ping'

describe('ablaufPing', () => {
  it('tut ohne HC_PING_KEY nichts und ruft fetch nie auf', async () => {
    const fetchFn = jest.fn()
    const ergebnis = await ablaufPing('luma-nachtwache', undefined, {
      env: { HC_PING_URL: 'https://hc.test/ping' },
      fetchFn,
    })
    expect(ergebnis).toBe('kein-key')
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('meldet einen erfolgreichen Lauf an die Ablauf-URL', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ ok: true })
    const ergebnis = await ablaufPing('luma-nachtwache', undefined, {
      env: { HC_PING_URL: 'https://hc.test/ping', HC_PING_KEY: 'k' },
      fetchFn,
    })
    expect(ergebnis).toBe('gesendet')
    expect(fetchFn).toHaveBeenCalledWith(
      'https://hc.test/ping/k/luma-nachtwache',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('meldet einen Fehlschlag über /fail', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ ok: true })
    const ergebnis = await ablaufPing('luma-nachtwache', 'Datenbank nicht erreichbar', {
      env: { HC_PING_URL: 'https://hc.test/ping', HC_PING_KEY: 'k' },
      fetchFn,
    })
    expect(ergebnis).toBe('gesendet')
    expect(fetchFn).toHaveBeenCalledWith(
      'https://hc.test/ping/k/luma-nachtwache/fail',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('wirft nie, sondern meldet einen Netzwerkfehler als ping-fehler', async () => {
    const fetchFn = jest.fn().mockRejectedValue(new Error('Netzwerk down'))
    const ergebnis = await ablaufPing('luma-nachtwache', undefined, {
      env: { HC_PING_URL: 'https://hc.test/ping', HC_PING_KEY: 'k' },
      fetchFn,
    })
    expect(ergebnis).toBe('ping-fehler')
  })
})
