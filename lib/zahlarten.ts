import { PaymentMethod } from './types'

/**
 * Welche Zahlarten der Kunde tatsächlich benutzen kann.
 *
 * ---------------------------------------------------------------------------
 * PAYPAL IST AUS (Stand 05.08.2026)
 * ---------------------------------------------------------------------------
 * Kadirs PayPal-Geschäftskonto wurde abgelehnt — es gibt kein Konto, auf dem
 * Geld ankommen könnte. Der PayPal-Knopf war trotzdem im Bezahlschritt zu
 * sehen: Kunden wählten eine Zahlart, die nicht funktionieren kann, und brachen
 * die Bestellung ab.
 *
 * Der PayPal-Code bleibt vollständig erhalten (Knopf, Webhook, nächtlicher
 * Abgleich, Tests). Kommt ein Konto zustande, sind es zwei Handgriffe:
 *   1. `PAYPAL_AKTIV` hier auf true setzen
 *   2. In Vercel `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_ID`,
 *      `PAYPAL_CLIENT_SECRET` und `PAYPAL_WEBHOOK_ID` setzen, dann neu
 *      ausliefern (PUBLIC-Variablen werden beim Bauen eingebacken)
 */
export const PAYPAL_AKTIV = false

/**
 * Die Prüfung gilt auch serverseitig: Ohne sie könnte eine abgeschaltete
 * Zahlart über einen selbst gebauten Aufruf trotzdem eine Bestellung anlegen.
 */
export function istZahlartVerfuegbar(methode: PaymentMethod): boolean {
  if (methode === 'paypal') return PAYPAL_AKTIV
  return methode === 'card' || methode === 'cash'
}

/** Auswahl im Bezahlschritt — Reihenfolge ist die Anzeigereihenfolge. */
export const VERFUEGBARE_ZAHLARTEN: { m: PaymentMethod; label: string }[] = (
  [
    { m: 'card' as const, label: 'Karte / Klarna' },
    { m: 'paypal' as const, label: 'PayPal' },
    { m: 'cash' as const, label: 'Bar' },
  ]
).filter(z => istZahlartVerfuegbar(z.m))
