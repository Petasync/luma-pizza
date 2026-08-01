import { getOpeningStatus, isOpen, getScheduleRows, getOpeningHoursSchema } from '@/lib/opening-hours'

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

// Einheitlicher Plan: täglich 15:00–24:00 (siehe lib/opening-hours.ts SCHEDULE).
describe('opening-hours', () => {
  it('is open on Monday at 18:00 — closes at 24:00', () => {
    const d = berlinWallClock(2026, 5, 18, 18, 0)
    expect(isOpen(d)).toBe(true)
    const s = getOpeningStatus(d)
    expect(s.open).toBe(true)
    if (s.open) expect(s.closesAt).toBe('24:00')
  })

  it('is open at 15:00 sharp', () => {
    const d = berlinWallClock(2026, 5, 18, 15, 0)
    expect(isOpen(d)).toBe(true)
  })

  it('is open at 23:59 (just before midnight)', () => {
    const d = berlinWallClock(2026, 5, 18, 23, 59)
    expect(isOpen(d)).toBe(true)
  })

  it('is closed at 14:59 — next opening is today 15:00', () => {
    const d = berlinWallClock(2026, 5, 18, 14, 59)
    expect(isOpen(d)).toBe(false)
    const s = getOpeningStatus(d)
    expect(s.open).toBe(false)
    if (!s.open) {
      expect(s.nextOpenLabel).toBe('Heute')
      expect(s.nextOpenTime).toBe('15:00')
    }
  })

  it('is closed at 00:30 after midnight — next opening is today 15:00', () => {
    const d = berlinWallClock(2026, 5, 18, 0, 30)
    expect(isOpen(d)).toBe(false)
    const s = getOpeningStatus(d)
    expect(s.open).toBe(false)
    if (!s.open) {
      expect(s.nextOpenLabel).toBe('Heute')
      expect(s.nextOpenTime).toBe('15:00')
    }
  })

  it('is open on Sunday at 15:30', () => {
    const d = berlinWallClock(2026, 5, 24, 15, 30)
    expect(isOpen(d)).toBe(true)
  })

  it('schedule rows are Mon→Sun in order, all 15:00 – 24:00', () => {
    const rows = getScheduleRows()
    expect(rows.map(r => r.day)).toEqual([
      'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag',
    ])
    for (const row of rows) {
      expect(row.hours).toBe('15:00 – 24:00')
    }
  })

  // LP-11: Restaurant-JSON-LD (app/layout.tsx) braucht openingHoursSpecification,
  // damit Google "geöffnet/geschlossen" korrekt anzeigen kann. Muss dieselbe
  // SCHEDULE-Quelle nutzen wie die sichtbare Tabelle — keine eigene Wahrheit.
  it('opening hours schema covers all 7 days with schema.org day names', () => {
    const schema = getOpeningHoursSchema()
    expect(schema).toHaveLength(7)
    expect(schema.map(s => s.dayOfWeek)).toEqual([
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
    ])
    for (const entry of schema) {
      expect(entry['@type']).toBe('OpeningHoursSpecification')
      expect(entry.opens).toBe('15:00')
      expect(entry.closes).toBe('24:00')
    }
  })
})
