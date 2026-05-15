import { getOpeningStatus, isOpen, getScheduleRows } from '@/lib/opening-hours'

// Helper: build a Date that, when formatted in Europe/Berlin, gives the desired
// local wall-clock time. We do this by trying CET (+01:00) and DST (+02:00) and
// returning whichever lands on the requested wall-clock — Intl handles DST
// correctly when we format back.
function berlinWallClock(year: number, month: number, day: number, hour: number, minute: number): Date {
  // Try +01:00 first
  const cet = new Date(Date.UTC(year, month - 1, day, hour - 1, minute))
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(cet)
  const map: Record<string, string> = {}
  parts.forEach(p => { map[p.type] = p.value })
  if (parseInt(map.hour, 10) === hour && parseInt(map.minute, 10) === minute) return cet
  // Otherwise +02:00 (DST)
  return new Date(Date.UTC(year, month - 1, day, hour - 2, minute))
}

describe('opening-hours', () => {
  // Mo 2026-05-18, Monday open is 17:00–23:15
  it('is open on Monday at 18:00', () => {
    const d = berlinWallClock(2026, 5, 18, 18, 0)
    expect(isOpen(d)).toBe(true)
    const s = getOpeningStatus(d)
    expect(s.open).toBe(true)
    if (s.open) expect(s.closesAt).toBe('23:15')
  })

  it('is closed on Monday at 16:59 — next opening is today 17:00', () => {
    const d = berlinWallClock(2026, 5, 18, 16, 59)
    expect(isOpen(d)).toBe(false)
    const s = getOpeningStatus(d)
    expect(s.open).toBe(false)
    if (!s.open) {
      expect(s.nextOpenLabel).toBe('Heute')
      expect(s.nextOpenTime).toBe('17:00')
    }
  })

  it('is closed on Monday at 23:15 sharp', () => {
    const d = berlinWallClock(2026, 5, 18, 23, 15)
    expect(isOpen(d)).toBe(false)
  })

  it('is closed on Monday at 23:30 — next opening is tomorrow 17:30 (Tuesday)', () => {
    const d = berlinWallClock(2026, 5, 18, 23, 30)
    const s = getOpeningStatus(d)
    expect(s.open).toBe(false)
    if (!s.open) {
      expect(s.nextOpenLabel).toBe('Morgen')
      expect(s.nextOpenTime).toBe('17:30')
    }
  })

  it('uses the special Thursday 15:00 opening', () => {
    // Thursday 2026-05-21 at 15:00
    const d = berlinWallClock(2026, 5, 21, 15, 0)
    expect(isOpen(d)).toBe(true)
  })

  it('uses the special Sunday 14:00 opening', () => {
    // Sunday 2026-05-24 at 14:30
    const d = berlinWallClock(2026, 5, 24, 14, 30)
    expect(isOpen(d)).toBe(true)
  })

  it('schedule rows are Mon→Sun in order', () => {
    const rows = getScheduleRows()
    expect(rows.map(r => r.day)).toEqual([
      'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag',
    ])
    expect(rows[0].hours).toBe('17:00 – 23:15')
    expect(rows[3].hours).toBe('15:00 – 23:15')
    expect(rows[6].hours).toBe('14:00 – 23:15')
  })
})
