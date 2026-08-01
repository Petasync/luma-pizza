import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createSupabaseServer } from '@/lib/supabase-server'
import { markiereAlsBezahlt } from '@/lib/bezahlung'
import { sendeZahlungOhneBestellung } from '@/lib/resend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Das Sicherheitsnetz. Stripe meldet jede erfolgreiche Zahlung direkt an diesen
 * Server — unabhängig davon, was der Browser des Kunden gerade macht.
 *
 * Damit ist der Fall vom 26.07.2026 ausgeschlossen: Kunde bezahlt, Browser
 * bricht ab, Bestellung verschwindet. Stripe versucht es bei einem Fehler bis zu
 * drei Tage lang erneut, deshalb antworten wir bei vorübergehenden Problemen
 * bewusst mit 500 statt den Fehler zu schlucken.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET fehlt — Webhook kann nicht geprüft werden.')
    return NextResponse.json({ error: 'Webhook nicht konfiguriert.' }, { status: 500 })
  }

  const signatur = req.headers.get('stripe-signature')
  if (!signatur) {
    return NextResponse.json({ error: 'Signatur fehlt.' }, { status: 400 })
  }

  // Die Signatur wird über den ROHEN Text berechnet — nicht über geparstes JSON.
  const rohText = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rohText, signatur, secret)
  } catch (e) {
    // Ungültige Signatur: das kommt nicht von Stripe. 400, kein erneuter Versuch.
    console.error('Webhook-Signatur ungültig:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Signatur ungültig.' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await verarbeiteErfolg(event.data.object)
        break
      case 'payment_intent.payment_failed':
        await verarbeiteFehlschlag(event.data.object)
        break
      default:
        break
    }
  } catch (e) {
    // Datenbank/Netz hakt: 500 → Stripe stellt später erneut zu.
    console.error(`Webhook ${event.type} fehlgeschlagen:`, e)
    return NextResponse.json({ error: 'Verarbeitung fehlgeschlagen.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function findeBestellungsId(intent: Stripe.PaymentIntent): Promise<string | null> {
  const ausMetadaten = intent.metadata?.order_id
  if (ausMetadaten) return ausMetadaten

  // Ersatzweg, falls das Setzen der Metadaten beim Vormerken gehakt hat.
  const supabase = createSupabaseServer()
  const { data } = await supabase
    .from('orders')
    .select('id')
    .eq('stripe_payment_intent_id', intent.id)
    .maybeSingle()
  return (data?.id as string) ?? null
}

async function verarbeiteErfolg(intent: Stripe.PaymentIntent) {
  const orderId = await findeBestellungsId(intent)

  if (!orderId) {
    // Geld da, aber keine Bestellung. Das darf mit dem neuen Ablauf nicht mehr
    // vorkommen — falls doch, erfahren Restaurant und Phillip sofort davon,
    // statt dass es wie am 26.07. unbemerkt bleibt.
    console.error(`Zahlung ${intent.id} ohne zugehörige Bestellung!`)
    await sendeZahlungOhneBestellung({
      anbieter: 'Stripe',
      zahlungsId: intent.id,
      betragCent: intent.amount,
      email: intent.receipt_email ?? null,
      zeitpunkt: new Date(intent.created * 1000),
    })
    return
  }

  const ergebnis = await markiereAlsBezahlt(orderId)
  if ((ergebnis.ergebnis === 'neu' || ergebnis.ergebnis === 'korrigiert') && ergebnis.mailFehler) {
    console.error('Bestätigungsmail fehlgeschlagen:', ergebnis.mailFehler)
  }
}

async function verarbeiteFehlschlag(intent: Stripe.PaymentIntent) {
  const orderId = await findeBestellungsId(intent)
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
