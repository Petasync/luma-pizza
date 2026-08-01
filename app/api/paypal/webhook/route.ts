import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { markiereAlsBezahlt } from '@/lib/bezahlung'
import { verifiziertePayPalWebhookSignatur } from '@/lib/paypal'
import { sendeZahlungOhneBestellung } from '@/lib/resend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Das Sicherheitsnetz für PayPal — Pendant zu `/api/stripe/webhook`.
 *
 * PayPal meldet den Zahlungsabschluss direkt an diesen Server, unabhängig
 * davon, ob der Browser des Kunden `/api/bestellung/bestaetigen` überhaupt
 * noch erreicht (Tab zu, Netz weg, genau in dem Moment nach
 * `actions.order.capture()`). Damit ist der Fall vom 26.07.2026 — Geld
 * kassiert, Bestellung verschwindet — auch für PayPal ausgeschlossen.
 */
export async function POST(req: NextRequest) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) {
    console.error('PAYPAL_WEBHOOK_ID fehlt — Webhook kann nicht geprüft werden.')
    return NextResponse.json({ error: 'Webhook nicht konfiguriert.' }, { status: 500 })
  }

  // Die Signatur wird über den ROHEN Text berechnet — nicht über geparstes JSON.
  const rohText = await req.text()

  const gueltig = await verifiziertePayPalWebhookSignatur(req.headers, rohText, webhookId)
  if (!gueltig) {
    // Ungültige Signatur: das kommt nicht von PayPal. 400, kein erneuter Versuch.
    console.error('PayPal-Webhook-Signatur ungültig.')
    return NextResponse.json({ error: 'Signatur ungültig.' }, { status: 400 })
  }

  let event: PayPalWebhookEvent
  try {
    event = JSON.parse(rohText)
  } catch {
    return NextResponse.json({ error: 'Ungültiger Inhalt.' }, { status: 400 })
  }

  try {
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await verarbeiteErfolg(event)
        break
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED':
        await verarbeiteFehlschlag(event)
        break
      default:
        break
    }
  } catch (e) {
    // Datenbank/Netz hakt: 500 → PayPal stellt später erneut zu.
    console.error(`PayPal-Webhook ${event.event_type} fehlgeschlagen:`, e)
    return NextResponse.json({ error: 'Verarbeitung fehlgeschlagen.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

interface PayPalWebhookEvent {
  event_type: string
  create_time?: string
  resource: {
    id: string
    status?: string
    amount?: { currency_code: string; value: string }
    payer?: { email_address?: string }
    supplementary_data?: { related_ids?: { order_id?: string } }
  }
}

/**
 * Die PayPal-Bestell-ID (die, die wir beim Vormerken in `paypal_order_id`
 * gespeichert haben) steckt bei `PAYMENT.CAPTURE.*`-Events unter
 * `resource.supplementary_data.related_ids.order_id` — NICHT in `resource.id`
 * (das ist die Capture-ID, eine andere ID).
 */
function ermittlePayPalOrderId(event: PayPalWebhookEvent): string | null {
  return event.resource.supplementary_data?.related_ids?.order_id ?? null
}

async function findeBestellungsId(paypalOrderId: string | null): Promise<string | null> {
  if (!paypalOrderId) return null
  const supabase = createSupabaseServer()
  const { data } = await supabase
    .from('orders')
    .select('id')
    .eq('paypal_order_id', paypalOrderId)
    .maybeSingle()
  return (data?.id as string) ?? null
}

async function verarbeiteErfolg(event: PayPalWebhookEvent) {
  const paypalOrderId = ermittlePayPalOrderId(event)
  const orderId = await findeBestellungsId(paypalOrderId)

  if (!orderId) {
    // Geld da, aber keine Bestellung. Genau wie bei Stripe: sofort Alarm statt
    // stiller Stille.
    console.error(`PayPal-Zahlung ${paypalOrderId ?? event.resource.id} ohne zugehörige Bestellung!`)
    const betrag = event.resource.amount
    await sendeZahlungOhneBestellung({
      anbieter: 'PayPal',
      zahlungsId: paypalOrderId ?? event.resource.id,
      betragCent: betrag ? Math.round(parseFloat(betrag.value) * 100) : 0,
      email: event.resource.payer?.email_address ?? null,
      zeitpunkt: event.create_time ? new Date(event.create_time) : new Date(),
    })
    return
  }

  const ergebnis = await markiereAlsBezahlt(orderId)
  if (ergebnis.ergebnis === 'neu' && ergebnis.mailFehler) {
    console.error('Bestätigungsmail fehlgeschlagen:', ergebnis.mailFehler)
  }
}

async function verarbeiteFehlschlag(event: PayPalWebhookEvent) {
  const paypalOrderId = ermittlePayPalOrderId(event)
  const orderId = await findeBestellungsId(paypalOrderId)
  if (!orderId) return

  // Nur eine noch offene Vormerkung darf auf "failed" fallen — eine bereits
  // bezahlte Bestellung niemals anfassen.
  const supabase = createSupabaseServer()
  const { error } = await supabase
    .from('orders')
    .update({ payment_status: 'failed' })
    .eq('id', orderId)
    .eq('payment_status', 'pending')
  if (error) throw new Error(error.message)
}
