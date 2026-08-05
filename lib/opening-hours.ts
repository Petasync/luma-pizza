/**
 * Öffnungszeiten — eine Quelle der Wahrheit. Wird sowohl auf der Seite angezeigt
 * als auch serverseitig genutzt, um Bestellungen außerhalb der Öffnungszeiten
 * abzulehnen. Alle Zeiten in lokaler Berliner Zeit (Sommer-/Winterzeit-sicher).
 *
 * Abholung und Lieferung haben UNTERSCHIEDLICHE Fenster (bestätigt mit Kadir am
 * 05.08.2026): abgeholt werden kann ab 11:00, geliefert wird erst ab 17:00.
 * Deshalb nehmen die Funktionen hier optional einen `OrderType`. Ohne Angabe
 * gilt "irgendetwas ist möglich" — das ist die richtige Auskunft für den
 * Geöffnet-Indikator im Kopf und Fuß der Seite, aber NICHT für die Bestellung:
 * dort muss der Typ mitgegeben werden, sonst gingen um 12:00 Lieferungen durch.
 */
import { OrderType } from './types'

export interface TimeWindow {
  /** Format 'HH:MM' (24 h). */
  open: string
  close: string
}

export interface DaySchedule {
  pickup: TimeWindow
  delivery: TimeWindow
}

// Aktuell an allen sieben Tagen identisch, kein Ruhetag. Als eigene Konstante,
// damit eine Änderung nicht an sieben Stellen nachgezogen werden muss — die
// Tage bleiben einzeln aufgeführt, damit abweichende Tage jederzeit möglich sind.
const STANDARDTAG: DaySchedule = {
  pickup: { open: '11:00', close: '23:00' },
  delivery: { open: '17:00', close: '23:00' },
}

// Wochentage nach JS-Konvention: 0 = Sonntag, 1 = Montag, …, 6 = Samstag.
export const SCHEDULE: Record<number, DaySchedule | null> = {
  1: STANDARDTAG, // Montag
  2: STANDARDTAG, // Dienstag
  3: STANDARDTAG, // Mittwoch
  4: STANDARDTAG, // Donnerstag
  5: STANDARDTAG, // Freitag
  6: STANDARDTAG, // Samstag
  0: STANDARDTAG, // Sonntag
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

/**
 * Die relevanten Zeitfenster eines Tages: eines bei festem Bestelltyp, sonst
 * beide (dann zählt der Tag als offen, sobald irgendetwas möglich ist).
 */
function fensterFuer(tag: DaySchedule, type?: OrderType): TimeWindow[] {
  if (type) return [tag[type]]
  return [tag.pickup, tag.delivery]
}

const frueheresOeffnen = (a: TimeWindow, b: TimeWindow) => (toMinutes(b.open) < toMinutes(a.open) ? b : a)

/**
 * Aktueller Status — geöffnet (mit Schließzeit) oder geschlossen (mit nächster
 * Öffnung). Ohne `type` bezogen auf den Betrieb insgesamt, mit `type` auf
 * Abholung bzw. Lieferung.
 */
export function getOpeningStatus(date: Date = new Date(), type?: OrderType): OpeningStatus {
  const { weekday, minutes } = berlinNow(date)
  const today = SCHEDULE[weekday]
  if (today) {
    const fenster = fensterFuer(today, type)

    // Läuft gerade eines? Dann gilt der SPÄTESTE Schluss der offenen Fenster.
    const offen = fenster.filter(f => minutes >= toMinutes(f.open) && minutes < toMinutes(f.close))
    if (offen.length > 0) {
      const spaetester = offen.reduce((a, f) => (toMinutes(f.close) > toMinutes(a.close) ? f : a))
      return { open: true, closesAt: spaetester.close }
    }

    // Kommt heute noch eines? Dann das nächstgelegene.
    const spaeter = fenster.filter(f => minutes < toMinutes(f.open))
    if (spaeter.length > 0) {
      return { open: false, nextOpenLabel: 'Heute', nextOpenTime: spaeter.reduce(frueheresOeffnen).open }
    }
  }

  for (let i = 1; i <= 7; i++) {
    const d = (weekday + i) % 7
    const s = SCHEDULE[d]
    if (s) {
      return {
        open: false,
        nextOpenLabel: i === 1 ? 'Morgen' : DAY_LABELS[d],
        nextOpenTime: fensterFuer(s, type).reduce(frueheresOeffnen).open,
      }
    }
  }
  return { open: false, nextOpenLabel: '–', nextOpenTime: '–' }
}

/**
 * Reine Boolesche Variante für serverseitige Checks. `type` sollte dort immer
 * mitgegeben werden — ohne ihn gälte eine Lieferung um 12:00 als zulässig.
 */
export function isOpen(date: Date = new Date(), type?: OrderType): boolean {
  return getOpeningStatus(date, type).open
}

export interface ScheduleRow {
  day: string
  hours: string
}

/**
 * Liefert die Wochentabelle Mo–So zum Rendern. Der Typ ist Pflicht, weil eine
 * Tabelle ohne ihn nicht mehr eindeutig wäre — die Seiten zeigen an allen
 * Stellen ausdrücklich Liefer- ODER Abholzeiten.
 */
export function getScheduleRows(type: OrderType): ScheduleRow[] {
  const order = [1, 2, 3, 4, 5, 6, 0]
  return order.map(d => {
    const s = SCHEDULE[d]
    return { day: DAY_LABELS[d], hours: s ? `${s[type].open} – ${s[type].close}` : 'Geschlossen' }
  })
}

// schema.org erwartet die englischen Wochentagsnamen für dayOfWeek.
const SCHEMA_DAY_NAMES: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
}

export interface OpeningHoursSpecification {
  '@type': 'OpeningHoursSpecification'
  dayOfWeek: string
  opens: string
  closes: string
}

/**
 * Liefert die Öffnungszeiten im schema.org-Format für das Restaurant-JSON-LD —
 * aus derselben SCHEDULE-Quelle wie die sichtbare Tabelle (getScheduleRows()),
 * damit sich nie zwei unterschiedliche Wahrheiten auseinanderentwickeln
 * können. Geschlossene Tage (SCHEDULE[d] === null) werden ausgelassen.
 *
 * Bewusst das ABHOL-Fenster: `openingHours` beschreibt in schema.org, wann das
 * Lokal für Gäste offen ist — und das ist ab 11:00 der Fall. Die spätere
 * Lieferzeit ist eine Service-Einschränkung, keine Öffnungszeit; stünde hier
 * 17:00, zeigte Google das Lokal mittags fälschlich als geschlossen an.
 */
export function getOpeningHoursSchema(): OpeningHoursSpecification[] {
  const result: OpeningHoursSpecification[] = []
  for (let d = 0; d <= 6; d++) {
    const s = SCHEDULE[d]
    if (!s) continue
    result.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: SCHEMA_DAY_NAMES[d],
      opens: s.pickup.open,
      closes: s.pickup.close,
    })
  }
  return result
}
