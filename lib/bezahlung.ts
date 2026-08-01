import { createSupabaseServer } from './supabase-server'
import { sendOrderConfirmationToCustomer, sendNewOrderToRestaurant } from './resend'
import { Order } from './types'

export type BezahlErgebnis =
  /** Diese Anfrage hat die Bestellung auf "bezahlt" gesetzt und die Mails verschickt. */
  | { ergebnis: 'neu'; order: Order; mailFehler?: string }
  /** Jemand anderes war schneller (Browser vs. Webhook) — nichts mehr zu tun. */
  | { ergebnis: 'schon-bezahlt'; order: Order }
  | { ergebnis: 'nicht-gefunden' }

/**
 * Setzt eine Bestellung auf "bezahlt" und verschickt die Bestätigungen —
 * **genau einmal**, auch wenn Browser und Stripe-Webhook gleichzeitig ankommen.
 *
 * Der Trick ist das bedingte UPDATE: `payment_status` wird nur dann von
 * 'pending' auf 'paid' gesetzt, wenn es noch 'pending' IST. Postgres führt das
 * atomar aus — von zwei parallelen Aufrufen bekommt genau einer eine Zeile
 * zurück, der andere geht leer aus. Nur der Gewinner verschickt die Mails.
 *
 * Ein Mailfehler wirft NICHT: die Zahlung ist bestätigt und die Bestellung im
 * Dashboard sichtbar — das ist wichtiger. Stattdessen bleibt `benachrichtigt_am`
 * leer und die nächtliche Nachtwache holt den Versand nach.
 */
export async function markiereAlsBezahlt(orderId: string): Promise<BezahlErgebnis> {
  const supabase = createSupabaseServer()

  const { data, error } = await supabase
    .from('orders')
    .update({ payment_status: 'paid' })
    .eq('id', orderId)
    .eq('payment_status', 'pending')
    .select()

  if (error) throw new Error(`Bestellung konnte nicht auf bezahlt gesetzt werden: ${error.message}`)

  if (data && data.length === 1) {
    const order = data[0] as Order
    const mailFehler = await verschickeBestaetigungen(order)
    return mailFehler ? { ergebnis: 'neu', order, mailFehler } : { ergebnis: 'neu', order }
  }

  // Kein Update → entweder schon bezahlt oder gar nicht vorhanden.
  const { data: vorhanden } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle()

  if (!vorhanden) return { ergebnis: 'nicht-gefunden' }
  return { ergebnis: 'schon-bezahlt', order: vorhanden as Order }
}

/**
 * Verschickt Kunden- und Restaurant-Mail und stempelt `benachrichtigt_am`.
 * Gibt bei Erfolg `null` zurück, sonst die Fehlermeldung (zum Protokollieren).
 */
export async function verschickeBestaetigungen(order: Order): Promise<string | null> {
  try {
    await Promise.all([
      sendOrderConfirmationToCustomer(order),
      sendNewOrderToRestaurant(order),
    ])
  } catch (e) {
    return e instanceof Error ? e.message : String(e)
  }

  const supabase = createSupabaseServer()
  const { error } = await supabase
    .from('orders')
    .update({ benachrichtigt_am: new Date().toISOString() })
    .eq('id', order.id)

  return error ? `Stempel benachrichtigt_am fehlgeschlagen: ${error.message}` : null
}
