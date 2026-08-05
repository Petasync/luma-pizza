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

// Plan laut lib/opening-hours.ts SCHEDULE: Abholung täglich 11:00–23:00,
// Lieferung 17:00–23:00, kein Ruhetag. 2026-05-18 ist ein Montag, der 24. ein
// Sonntag.
describe('opening-hours', () => {
  it('ist um 18:00 für beides offen und schließt um 23:00', () => {
    const d = berlinWallClock(2026, 5, 18, 18, 0)
    expect(isOpen(d)).toBe(true)
    expect(isOpen(d, 'pickup')).toBe(true)
    expect(isOpen(d, 'delivery')).toBe(true)
    const s = getOpeningStatus(d)
    expect(s.open).toBe(true)
    if (s.open) expect(s.closesAt).toBe('23:00')
  })

  // Das Kernstück der Trennung: mittags läuft die Abholung, geliefert wird nicht.
  it('ist um 12:00 nur für Abholung offen', () => {
    const d = berlinWallClock(2026, 5, 18, 12, 0)
    expect(isOpen(d, 'pickup')).toBe(true)
    expect(isOpen(d, 'delivery')).toBe(false)
    // Ohne Typ gilt der Betrieb als offen — das ist die Auskunft für den
    // Geöffnet-Indikator, nicht für die Bestellprüfung.
    expect(isOpen(d)).toBe(true)

    const lieferung = getOpeningStatus(d, 'delivery')
    expect(lieferung.open).toBe(false)
    if (!lieferung.open) {
      expect(lieferung.nextOpenLabel).toBe('Heute')
      expect(lieferung.nextOpenTime).toBe('17:00')
    }
  })

  it('öffnet die Abholung um 11:00 pünktlich, die Lieferung um 17:00', () => {
    expect(isOpen(berlinWallClock(2026, 5, 18, 11, 0), 'pickup')).toBe(true)
    expect(isOpen(berlinWallClock(2026, 5, 18, 10, 59), 'pickup')).toBe(false)
    expect(isOpen(berlinWallClock(2026, 5, 18, 17, 0), 'delivery')).toBe(true)
    expect(isOpen(berlinWallClock(2026, 5, 18, 16, 59), 'delivery')).toBe(false)
  })

  it('ist um 22:59 offen und um 23:00 zu', () => {
    expect(isOpen(berlinWallClock(2026, 5, 18, 22, 59))).toBe(true)
    const d = berlinWallClock(2026, 5, 18, 23, 0)
    expect(isOpen(d)).toBe(false)
    const s = getOpeningStatus(d)
    expect(s.open).toBe(false)
    // Nach Feierabend ist der nächste Termin die Abholung am Folgetag.
    if (!s.open) {
      expect(s.nextOpenLabel).toBe('Morgen')
      expect(s.nextOpenTime).toBe('11:00')
    }
  })

  it('ist um 10:59 komplett zu — nächste Öffnung heute 11:00', () => {
    const d = berlinWallClock(2026, 5, 18, 10, 59)
    expect(isOpen(d)).toBe(false)
    const s = getOpeningStatus(d)
    expect(s.open).toBe(false)
    if (!s.open) {
      expect(s.nextOpenLabel).toBe('Heute')
      expect(s.nextOpenTime).toBe('11:00')
    }
  })

  it('ist um 00:30 nach Mitternacht zu — nächste Öffnung heute 11:00', () => {
    const d = berlinWallClock(2026, 5, 18, 0, 30)
    expect(isOpen(d)).toBe(false)
    const s = getOpeningStatus(d)
    expect(s.open).toBe(false)
    if (!s.open) {
      expect(s.nextOpenLabel).toBe('Heute')
      expect(s.nextOpenTime).toBe('11:00')
    }
  })

  it('gilt sonntags genauso — kein Ruhetag', () => {
    expect(isOpen(berlinWallClock(2026, 5, 24, 12, 0), 'pickup')).toBe(true)
    expect(isOpen(berlinWallClock(2026, 5, 24, 18, 0), 'delivery')).toBe(true)
  })

  it('liefert die Wochentabelle Mo→So je Bestelltyp', () => {
    const lieferung = getScheduleRows('delivery')
    expect(lieferung.map(r => r.day)).toEqual([
      'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag',
    ])
    for (const row of lieferung) {
      expect(row.hours).toBe('17:00 – 23:00')
    }
    for (const row of getScheduleRows('pickup')) {
      expect(row.hours).toBe('11:00 – 23:00')
    }
  })

  // LP-11: Restaurant-JSON-LD (app/layout.tsx) braucht openingHoursSpecification,
  // damit Google "geöffnet/geschlossen" korrekt anzeigen kann. Muss dieselbe
  // SCHEDULE-Quelle nutzen wie die sichtbare Tabelle — keine eigene Wahrheit.
  // Maßgeblich ist das Abholfenster: so lange steht das Lokal Gästen offen.
  it('opening hours schema covers all 7 days with schema.org day names', () => {
    const schema = getOpeningHoursSchema()
    expect(schema).toHaveLength(7)
    expect(schema.map(s => s.dayOfWeek)).toEqual([
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
    ])
    for (const entry of schema) {
      expect(entry['@type']).toBe('OpeningHoursSpecification')
      expect(entry.opens).toBe('11:00')
      expect(entry.closes).toBe('23:00')
    }
  })
})
