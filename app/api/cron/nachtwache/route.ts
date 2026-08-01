import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'
import { verschickeBestaetigungen } from '@/lib/bezahlung'
import { sendeNachtwacheBericht } from '@/lib/resend'
import { formatEuro } from '@/lib/business'
import { Order } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Nächtlicher Rundgang. Läuft einmal täglich über einen Vercel-Cron
 * (siehe vercel.json) und erledigt vier Dinge:
 *
 *  1. **Wecker** — eine echte Datenbank-Abfrage. Supabase pausiert Projekte im
 *     Gratis-Tarif nach 7 Tagen zu geringer Aktivität; danach wäre keine
 *     Bestellung mehr speicherbar. Der tägliche Zugriff verhindert das.
 *  2. **Nachversand** — bezahlte Bestellungen, bei denen der Mailversand
 *     gehakt hat (`benachrichtigt_am` leer), bekommen ihre Mails nachträglich.
 *  3. **Abgleich mit Stripe** — jede erfolgreiche Zahlung der letzten 48 h muss
 *     eine bezahlte Bestellung haben. Fehlt eine, gibt es sofort eine Mail.
 *  4. **Aufräumen** — Vormerkungen, zu denen nie eine Zahlung kam, werden nach
 *     24 h auf "failed" gesetzt (nie gelöscht — Daten bleiben nachvollziehbar).
 *
 * Gemeldet wird nur, wenn es etwas zu melden gibt. Keine Mail = alles in Ordnung.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    // Fail closed: ohne Geheimnis wäre die Route öffentlich aufrufbar.
    console.error('CRON_SECRET fehlt — Nachtwache abgelehnt.')
    return NextResponse.json({ error: 'Nicht konfiguriert.' }, { status: 500 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const meldungen: string[] = []
  const supabase = createSupabaseServer()

  // --- 1. Wecker ---------------------------------------------------------
  const { count, error: weckerFehler } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })

  if (weckerFehler) {
    // Die Datenbank ist nicht erreichbar — das ist der Ernstfall, sofort melden.
    await sendeNachtwacheBericht('🚨 Datenbank nicht erreichbar', [
      'Die nächtliche Prüfung konnte die Datenbank nicht abfragen.',
      '',
      `Fehler: ${weckerFehler.message}`,
      '',
      'Bitte im Supabase-Dashboard nachsehen, ob das Projekt pausiert ist.',
      'Solange das so ist, kann KEINE Bestellung gespeichert werden.',
    ])
    return NextResponse.json({ error: 'Datenbank nicht erreichbar.' }, { status: 500 })
  }

  // --- 2. Nachversand nicht verschickter Bestätigungen -------------------
  const vorSiebenTagen = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: ohneMail } = await supabase
    .from('orders')
    .select('*')
    .eq('payment_status', 'paid')
    .is('benachrichtigt_am', null)
    .gte('created_at', vorSiebenTagen)

  for (const roh of ohneMail ?? []) {
    const order = roh as Order
    const fehler = await verschickeBestaetigungen(order)
    meldungen.push(
      fehler
        ? `Mail für Bestellung ${order.id.slice(0, 8).toUpperCase()} erneut fehlgeschlagen: ${fehler}`
        : `Bestätigung für Bestellung ${order.id.slice(0, 8).toUpperCase()} nachträglich verschickt.`,
    )
  }

  // --- 3. Abgleich mit Stripe -------------------------------------------
  const seit = Math.floor((Date.now() - 48 * 60 * 60 * 1000) / 1000)
  try {
    const zahlungen = await stripe.paymentIntents.list({ created: { gte: seit }, limit: 100 })

    for (const zahlung of zahlungen.data) {
      if (zahlung.status !== 'succeeded') continue

      const { data: treffer } = await supabase
        .from('orders')
        .select('id, payment_status')
        .eq('stripe_payment_intent_id', zahlung.id)
        .maybeSingle()

      if (!treffer) {
        meldungen.push(
          `🚨 Zahlung OHNE Bestellung: ${formatEuro(zahlung.amount / 100)} · ${zahlung.id} · ` +
            `${new Date(zahlung.created * 1000).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}`,
        )
      } else if (treffer.payment_status !== 'paid') {
        meldungen.push(
          `🚨 Bezahlt, aber in der Datenbank als "${treffer.payment_status}": ` +
            `Bestellung ${String(treffer.id).slice(0, 8).toUpperCase()} · ${zahlung.id}`,
        )
      }
    }
  } catch (e) {
    meldungen.push(`Abgleich mit Stripe fehlgeschlagen: ${e instanceof Error ? e.message : e}`)
  }

  // --- 4. Verwaiste Vormerkungen aufräumen -------------------------------
  // Nur solche, die älter als 24 h sind — dann ist auch der letzte Stripe-Versuch
  // längst durch. Es wird nie gelöscht, nur markiert.
  const vorEinemTag = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: aufgeraeumt } = await supabase
    .from('orders')
    .update({ payment_status: 'failed' })
    .eq('payment_status', 'pending')
    .neq('payment_method', 'cash')
    .lt('created_at', vorEinemTag)
    .select('id')

  if (aufgeraeumt && aufgeraeumt.length > 0) {
    meldungen.push(`${aufgeraeumt.length} abgebrochene Zahlung(en) als "failed" abgelegt.`)
  }

  // --- Bericht — nur bei Auffälligkeiten ---------------------------------
  const alarm = meldungen.some(m => m.startsWith('🚨'))
  if (alarm) {
    await sendeNachtwacheBericht('🚨 Nachtwache: bitte prüfen', [
      'Die nächtliche Prüfung hat Auffälligkeiten gefunden:',
      '',
      ...meldungen,
    ])
  }

  return NextResponse.json({
    ok: true,
    bestellungenGesamt: count ?? 0,
    meldungen,
  })
}
