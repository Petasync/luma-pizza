/**
 * Lieferzeiten — eine Quelle der Wahrheit. Wird sowohl auf der Seite angezeigt
 * als auch serverseitig genutzt, um Bestellungen außerhalb der Öffnungszeiten
 * abzulehnen. Alle Zeiten in lokaler Berliner Zeit (Sommer-/Winterzeit-sicher).
 */

export interface DaySchedule {
  /** Format 'HH:MM' (24 h). */
  open: string
  close: string
}

// Wochentage nach JS-Konvention: 0 = Sonntag, 1 = Montag, …, 6 = Samstag.
export const SCHEDULE: Record<number, DaySchedule | null> = {
  1: { open: '15:00', close: '24:00' }, // Montag
  2: { open: '15:00', close: '24:00' }, // Dienstag
  3: { open: '15:00', close: '24:00' }, // Mittwoch
  4: { open: '15:00', close: '24:00' }, // Donnerstag
  5: { open: '15:00', close: '24:00' }, // Freitag
  6: { open: '15:00', close: '24:00' }, // Samstag
  0: { open: '15:00', close: '24:00' }, // Sonntag
}

const DAY_LABELS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

/** Liefert Wochentag (0–6) und Minuten-seit-Mitternacht in Europe/Berlin. */
function berlinNow(date: Date = new Date()): { weekday: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const map: Record<string, string> = {}
  for (const p of parts) map[p.type] = p.value
  const wdMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return {
    weekday: wdMap[map.weekday] ?? 0,
    // '24' kann bei Intl an Mitternacht auftauchen — auf 0 normalisieren.
    minutes: (parseInt(map.hour, 10) % 24) * 60 + parseInt(map.minute, 10),
  }
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export type OpeningStatus =
  | { open: true; closesAt: string }
  | { open: false; nextOpenLabel: string; nextOpenTime: string }

/** Aktueller Status — geöffnet (mit Schließzeit) oder geschlossen (mit nächster Öffnung). */
export function getOpeningStatus(date: Date = new Date()): OpeningStatus {
  const { weekday, minutes } = berlinNow(date)
  const today = SCHEDULE[weekday]
  if (today) {
    const o = toMinutes(today.open)
    const c = toMinutes(today.close)
    if (minutes >= o && minutes < c) return { open: true, closesAt: today.close }
    if (minutes < o) return { open: false, nextOpenLabel: 'Heute', nextOpenTime: today.open }
  }
  for (let i = 1; i <= 7; i++) {
    const d = (weekday + i) % 7
    const s = SCHEDULE[d]
    if (s) {
      return {
        open: false,
        nextOpenLabel: i === 1 ? 'Morgen' : DAY_LABELS[d],
        nextOpenTime: s.open,
      }
    }
  }
  return { open: false, nextOpenLabel: '–', nextOpenTime: '–' }
}

/** Reine Boolesche Variante für serverseitige Checks. */
export function isOpen(date: Date = new Date()): boolean {
  return getOpeningStatus(date).open
}

export interface ScheduleRow {
  day: string
  hours: string
}

/** Liefert die Wochentabelle Mo–So zum Rendern. */
export function getScheduleRows(): ScheduleRow[] {
  const order = [1, 2, 3, 4, 5, 6, 0]
  return order.map(d => {
    const s = SCHEDULE[d]
    return { day: DAY_LABELS[d], hours: s ? `${s.open} – ${s.close}` : 'Geschlossen' }
  })
}
