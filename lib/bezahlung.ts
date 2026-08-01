import { createSupabaseServer } from './supabase-server'
import { sendOrderConfirmationToCustomer, sendNewOrderToRestaurant, sendeBezahlungKorrigiert } from './resend'
import { Order } from './types'

export type BezahlErgebnis =
  /** Diese Anfrage hat die Bestellung auf "bezahlt" gesetzt und die Mails verschickt. */
  | { ergebnis: 'neu'; order: Order; mailFehler?: string }
  /**
   * Die Bestellung stand fälschlich auf "failed" (z. B. weil eine frühere
   * PayPal-/Stripe-Prüfung irrtümlich "nicht bezahlt" ergab) und wurde jetzt
   * durch einen bestätigten Zahlungseingang auf "bezahlt" korrigiert. Das darf
   * nicht unbemerkt bleiben — hier ist vorher etwas schiefgelaufen.
   */
  | { ergebnis: 'korrigiert'; order: Order; mailFehler?: string }
  /** Jemand anderes war schneller (Browser vs. Webhook vs. Nachtwache) — nichts mehr zu tun. */
  | { ergebnis: 'schon-bezahlt'; order: Order }
  | { ergebnis: 'nicht-gefunden' }

/**
 * Setzt eine Bestellung auf "bezahlt" und verschickt die Bestätigungen —
 * **genau einmal**, auch wenn Browser, Webhook und Nachtwache gleichzeitig
 * ankommen.
 *
 * Der Trick ist das bedingte UPDATE: `payment_status` wird nur dann von
 * 'pending' auf 'paid' gesetzt, wenn es noch 'pending' IST. Postgres führt das
 * atomar aus — von zwei parallelen Aufrufen bekommt genau einer eine Zeile
 * zurück, der andere geht leer aus. Nur der Gewinner verschickt die Mails.
 *
 * Ein Mailfehler wirft NICHT: die Zahlung ist bestätigt und die Bestellung im
 * Dashboard sichtbar — das ist wichtiger. Stattdessen bleibt `benachrichtigt_am`
 * leer und die nächtliche Nachtwache holt den Versand nach.
 *
 * Steht die Bestellung bereits auf "failed" (z. B. weil die Nachtwache oder
 * ein früherer Aufruf sie fälschlich dorthin gesetzt hatte), wird das NICHT
 * stillschweigend als "schon erledigt" behandelt: Ein jetzt bestätigter
 * Zahlungseingang ist ein stärkeres Signal als ein früheres "failed" und
 * korrigiert die Bestellung auf "bezahlt" — mit demselben atomaren
 * bedingten UPDATE (jetzt `WHERE payment_status='failed'`), damit auch hier
 * von zwei gleichzeitigen Korrekturversuchen nur genau einer gewinnt und
 * weder doppelt gemailt noch doppelt korrigiert wird.
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

  // Kein Update über "pending" → nachsehen, was der aktuelle Status ist.
  const { data: vorhanden } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle()

  if (!vorhanden) return { ergebnis: 'nicht-gefunden' }

  if ((vorhanden as Order).payment_status === 'failed') {
    return korrigiereFaelschlichFailed(supabase, orderId)
  }

  return { ergebnis: 'schon-bezahlt', order: vorhanden as Order }
}

/**
 * Korrigiert eine Bestellung, die auf "failed" stand, auf "bezahlt" —
 * atomar über dasselbe bedingte-UPDATE-Muster wie beim Normalfall, nur mit
 * `WHERE payment_status='failed'` statt `'pending'`. So kann ein später
 * eintreffender echter Zahlungsnachweis (Webhook, Nachtwache) eine zuvor
 * fälschlich abgestempelte Bestellung noch retten, ohne die
 * Mehrfach-Absicherung zu verlieren.
 */
async function korrigiereFaelschlichFailed(
  supabase: ReturnType<typeof createSupabaseServer>,
  orderId: string,
): Promise<BezahlErgebnis> {
  const { data: korrigiert, error } = await supabase
    .from('orders')
    .update({ payment_status: 'paid' })
    .eq('id', orderId)
    .eq('payment_status', 'failed')
    .select()

  if (error) {
    throw new Error(`Bestellung konnte nicht von "failed" auf "bezahlt" korrigiert werden: ${error.message}`)
  }

  if (korrigiert && korrigiert.length === 1) {
    const order = korrigiert[0] as Order
    const mailFehler = await verschickeBestaetigungen(order)
    // Ausdrücklich melden: eine "failed"-Bestellung nachträglich zu
    // korrigieren bedeutet, dass vorher etwas schiefgelaufen ist.
    try {
      await sendeBezahlungKorrigiert(order)
    } catch (e) {
      console.error('Alarm-Mail für korrigierte Bestellung fehlgeschlagen:', e)
    }
    return mailFehler ? { ergebnis: 'korrigiert', order, mailFehler } : { ergebnis: 'korrigiert', order }
  }

  // Ein anderer gleichzeitiger Aufruf hat die Korrektur gerade gewonnen
  // (oder jemand hat sie inzwischen anders verändert) — Endzustand neu lesen.
  const { data: nachKorrektur } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle()
  if (!nachKorrektur) return { ergebnis: 'nicht-gefunden' }
  return { ergebnis: 'schon-bezahlt', order: nachKorrektur as Order }
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
