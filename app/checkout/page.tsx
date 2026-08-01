'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/navbar'
import { useCart } from '@/components/cart/cart-context'
import DeliveryToggle from '@/components/checkout/delivery-toggle'
import PostalCheck from '@/components/checkout/postal-check'
import ContactForm, { ContactData } from '@/components/checkout/contact-form'
import StripePayment from '@/components/checkout/stripe-payment'
import PayPalButton from '@/components/checkout/paypal-button'
import ClosedBanner from '@/components/closed-banner'
import { useIsOpen } from '@/components/opening-status'
import { OrderType, PaymentMethod } from '@/lib/types'
import {
  DELIVERY_ETA_MINUTES,
  PICKUP_ETA_MINUTES,
  getMinOrderForPostalCode,
  formatEta,
} from '@/lib/business'
import Link from 'next/link'

type Step = 'delivery' | 'contact' | 'payment'

const EMPTY_CONTACT: ContactData = { name: '', email: '', phone: '', street: '', notes: '' }

export default function CheckoutPage() {
  const router = useRouter()
  const { state, total, dispatch } = useCart()
  const [step, setStep] = useState<Step>('delivery')
  const [orderType, setOrderType] = useState<OrderType>('delivery')
  const [plzConfirmed, setPlzConfirmed] = useState(false)
  const [postalCode, setPostalCode] = useState('')
  const [contact, setContact] = useState<ContactData>(EMPTY_CONTACT)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isOpen = useIsOpen()
  // null = noch nicht festgestellt; behandeln wie "offen", damit der Button
  // beim Server-Render nicht fälschlich deaktiviert wirkt.
  const closed = isOpen === false
  // Ortsabhängiger Mindestbestellwert: greift erst, wenn die PLZ feststeht.
  const minOrder = orderType === 'delivery' ? getMinOrderForPostalCode(postalCode) : 0
  const belowMinOrder = orderType === 'delivery' && plzConfirmed && total < minOrder
  const missingForDelivery = Math.max(0, minOrder - total)
  const eta = formatEta(orderType === 'delivery' ? DELIVERY_ETA_MINUTES : PICKUP_ETA_MINUTES)

  // Rückkehr von einer Zahlart mit Weiterleitung (z. B. Klarna). Stripe hängt
  // unsere Bestell-ID an die Rücksprung-URL — damit landet der Kunde auf seiner
  // Bestätigungsseite statt wieder in der leeren Kasse.
  // Bewusst über window.location statt useSearchParams: das erspart eine
  // Suspense-Grenze und funktioniert hier genauso zuverlässig.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('bestellung')
    if (id) void bestaetigeZahlung(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Die Bestelldaten, so wie der Server sie erwartet — an mehreren Stellen gebraucht. */
  function bestelldaten(payment?: { stripeIntentId?: string; paypalOrderId?: string }) {
    return {
      type: orderType,
      customer_name: contact.name,
      customer_email: contact.email,
      customer_phone: contact.phone,
      delivery_address: orderType === 'delivery' ? contact.street : undefined,
      postal_code: orderType === 'delivery' ? postalCode : undefined,
      items: state.items,
      total_price: total,
      payment_method: paymentMethod,
      notes: contact.notes,
      stripe_payment_intent_id: payment?.stripeIntentId,
      paypal_order_id: payment?.paypalOrderId,
    }
  }

  async function createOrder(payment?: { stripeIntentId?: string; paypalOrderId?: string }) {
    setIsSubmitting(true)
    setError('')
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bestelldaten(payment)),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Fehler beim Erstellen der Bestellung.'); setIsSubmitting(false); return }
    dispatch({ type: 'CLEAR' })
    router.push(`/bestellung/${data.id}`)
  }

  /**
   * Kartenzahlung, Schritt 1 von 2: Bestellung anlegen, BEVOR Geld fließt.
   * Alle Regeln (Öffnungszeiten, PLZ, Mindestbestellwert, Preise) werden hier
   * geprüft — schlägt etwas fehl, wird gar nicht erst bezahlt.
   */
  async function merkeBestellungVor(stripeIntentId: string): Promise<string> {
    setError('')
    const res = await fetch('/api/bestellung/vormerken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bestelldaten({ stripeIntentId })),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Bestellung konnte nicht angelegt werden.')
    return data.id as string
  }

  /**
   * PayPal, Schritt 1 von 2: Bestellung anlegen, BEVOR `actions.order.capture()`
   * das Geld einzieht. Genau derselbe Ablauf wie bei Karte, nur mit der
   * PayPal-Bestell-ID statt der Stripe-Payment-Intent-ID.
   */
  async function merkeBestellungVorPayPal(paypalOrderId: string): Promise<string> {
    setError('')
    const res = await fetch('/api/bestellung/vormerken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bestelldaten({ paypalOrderId })),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Bestellung konnte nicht angelegt werden.')
    return data.id as string
  }

  /**
   * Schritt 2 von 2 (Karte UND PayPal): dem Server melden, dass bezahlt wurde.
   * Nur die Abkürzung für eine schnelle Bestätigungsseite — falls dieser Aufruf
   * scheitert, erledigt der jeweilige Webhook (Stripe/PayPal) bzw. ersatzweise
   * die nächtliche Nachtwache dasselbe serverseitig.
   */
  async function bestaetigeZahlung(orderId: string) {
    setIsSubmitting(true)
    try {
      await fetch('/api/bestellung/bestaetigen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      })
    } catch {
      /* Der Webhook fängt es auf — der Kunde soll trotzdem seine Seite sehen. */
    }
    dispatch({ type: 'CLEAR' })
    router.push(`/bestellung/${orderId}`)
  }

  if (state.items.length === 0) {
    return (
      <>
        <Navbar />
        <main className="pt-20 min-h-screen flex items-center justify-center">
          <div className="text-center px-6">
            <p className="eyebrow mb-4">Warenkorb leer</p>
            <h1 className="heading-serif text-3xl text-charcoal-900 mb-3">Dein Warenkorb ist leer.</h1>
            <p className="text-charcoal-600 mb-8">Wähle ein paar leckere Gerichte aus unserer Karte.</p>
            <Link href="/bestellen" className="btn-primary">Zur Speisekarte</Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-cream-100">
        <section className="bg-charcoal-900 text-cream-50 py-12 px-4 sm:px-6 lg:px-12">
          <div className="container-narrow text-center">
            <p className="eyebrow text-gold-400 mb-3">Kasse</p>
            <h1 className="heading-serif text-4xl">Fast geschafft.</h1>
          </div>
        </section>

        <div className="container-narrow px-4 sm:px-6 lg:px-12 py-12 grid lg:grid-cols-3 gap-8">
          {/* Steps */}
          <div className="lg:col-span-2 space-y-6">
            <ClosedBanner />
            {/* Step 1 */}
            <section className="bg-cream-50 border border-charcoal-900/10 p-8">
              <DeliveryToggle value={orderType} onChange={v => { setOrderType(v); setPlzConfirmed(false); setStep('delivery') }} />
              {orderType === 'delivery' && !plzConfirmed && (
                <PostalCheck onConfirm={plz => { setPostalCode(plz); setPlzConfirmed(true); setStep('contact') }} />
              )}
              {(orderType === 'pickup' || plzConfirmed) && (
                <p className="mt-6 pt-6 border-t border-charcoal-900/10 text-sm text-gold-600 font-medium flex items-center gap-2">
                  <span className="inline-block w-4 h-px bg-gold-600" />
                  {orderType === 'pickup' ? 'Abholung in unserem Restaurant' : `Lieferung an PLZ ${postalCode}`}
                </p>
              )}
            </section>

            {/* Step 2 */}
            {(orderType === 'pickup' || plzConfirmed) && (
              <section className="bg-cream-50 border border-charcoal-900/10 p-8">
                <ContactForm data={contact} onChange={setContact} showAddress={orderType === 'delivery'} />
                {step !== 'payment' && (
                  <>
                    <button
                      onClick={() => {
                        if (!contact.name || !contact.email || !contact.phone) { setError('Bitte alle Pflichtfelder ausfüllen.'); return }
                        if (orderType === 'delivery' && !contact.street) { setError('Bitte Straße angeben.'); return }
                        if (belowMinOrder) {
                          setError(`Mindestbestellwert für Lieferung: ${minOrder},00 €. Noch ${missingForDelivery.toFixed(2).replace('.', ',')} € fehlen.`)
                          return
                        }
                        setError('')
                        setStep('payment')
                      }}
                      disabled={belowMinOrder}
                      className="mt-6 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Weiter zur Zahlung
                    </button>
                    {error && <p className="text-wine-600 text-sm mt-3">{error}</p>}
                  </>
                )}
              </section>
            )}

            {/* Step 3 */}
            {step === 'payment' && (
              <section className="bg-cream-50 border border-charcoal-900/10 p-8 space-y-6">
                <div>
                  <p className="eyebrow mb-3">Schritt 3</p>
                  <h2 className="font-serif text-2xl text-charcoal-900 mb-5">Zahlungsmethode</h2>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {([
                    { m: 'card' as const, label: 'Karte / Klarna' },
                    { m: 'paypal' as const, label: 'PayPal' },
                    { m: 'cash' as const, label: 'Bar' },
                  ]).map(({ m, label }) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`py-4 px-3 text-xs uppercase tracking-widest border transition-all ${
                        paymentMethod === m
                          ? 'bg-charcoal-900 text-cream-50 border-charcoal-900'
                          : 'bg-cream-50 text-charcoal-700 border-charcoal-900/15 hover:border-charcoal-900/40'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Rechtlich notwendige Hinweise direkt vor der Zahlung - gelten für
                    alle drei Zahlarten gleichermaßen, deshalb hier vor der
                    Methoden-Verzweigung statt in den einzelnen Payment-Komponenten. */}
                <div className="text-xs text-charcoal-500 leading-relaxed space-y-2 pt-1">
                  <p>
                    Mit dem Absenden deiner Bestellung verarbeiten wir deine Kontakt- und
                    Bestelldaten zur Abwicklung. Mehr dazu in unserer{' '}
                    <Link href="/datenschutz" className="underline hover:text-gold-700">
                      Datenschutzerklärung
                    </Link>.
                  </p>
                  <p>
                    Alle Preise sind Endpreise inklusive der gesetzlichen Mehrwertsteuer.
                  </p>
                  <p>
                    Da es sich um frische, schnell verderbliche Speisen mit vereinbartem
                    Liefer- bzw. Abholtermin handelt, besteht gemäß § 312g Abs. 2 Nr. 2 BGB
                    kein gesetzliches Widerrufsrecht.
                  </p>
                </div>

                <div className="pt-2">
                  {closed ? (
                    <div className="bg-charcoal-900/5 border border-charcoal-900/15 px-5 py-6 text-center">
                      <p className="text-sm text-charcoal-700">
                        Bestellungen sind aktuell außerhalb unserer Lieferzeiten nicht möglich.
                      </p>
                    </div>
                  ) : (
                    <>
                      {paymentMethod === 'card' && (
                        <StripePayment
                          amount={total}
                          onBeforeConfirm={merkeBestellungVor}
                          onSuccess={bestaetigeZahlung}
                          onError={msg => setError(msg)}
                        />
                      )}
                      {paymentMethod === 'paypal' && (
                        <PayPalButton
                          amount={total}
                          onBeforeConfirm={merkeBestellungVorPayPal}
                          onSuccess={bestaetigeZahlung}
                          onError={msg => setError(msg)}
                        />
                      )}
                      {paymentMethod === 'cash' && (
                        <button
                          onClick={() => createOrder()}
                          disabled={isSubmitting}
                          className="btn-primary w-full disabled:opacity-50"
                        >
                          {isSubmitting ? 'Wird übermittelt …' : 'Bestellung aufgeben (Bar bezahlen)'}
                        </button>
                      )}
                    </>
                  )}
                </div>

                {error && <p className="text-wine-600 text-sm">{error}</p>}
              </section>
            )}
          </div>

          {/* Order summary */}
          <aside className="lg:sticky lg:top-24 h-fit bg-cream-50 border border-charcoal-900/10">
            <div className="p-5 border-b border-charcoal-900/10">
              <p className="eyebrow mb-1">Deine Bestellung</p>
              <p className="text-xs text-charcoal-500">{state.items.length} Artikel</p>
              <p className="text-[11px] uppercase tracking-widest text-gold-600 mt-3">
                {orderType === 'delivery' ? 'Lieferung in ca.' : 'Abholung in ca.'}{' '}
                <span className="tabular-nums font-medium">{eta}</span>
              </p>
            </div>
            <div className="p-5 space-y-2 max-h-96 overflow-y-auto">
              {state.items.map(i => (
                <div key={`${i.menuItemId}__${i.size}`} className="flex justify-between gap-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="text-charcoal-900 truncate">
                      <span className="text-gold-600">{i.quantity}×</span> {i.name}
                    </p>
                    {i.size && <p className="text-xs text-charcoal-500">{i.size}</p>}
                  </div>
                  <p className="font-serif text-charcoal-900 whitespace-nowrap">
                    {(i.price * i.quantity).toFixed(2)} €
                  </p>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-charcoal-900/10 bg-cream-100 space-y-2">
              <div className="flex justify-between text-sm text-charcoal-600">
                <span>Zwischensumme</span>
                <span>{total.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm text-charcoal-600">
                <span>Liefergebühr</span>
                <span className="text-gold-600">0,00 €</span>
              </div>
              {belowMinOrder && (
                <div className="text-xs text-wine-600 pt-2 border-t border-wine-600/20">
                  Mindestbestellwert für Lieferung {minOrder},00 € — noch{' '}
                  <span className="font-medium">{missingForDelivery.toFixed(2).replace('.', ',')} €</span> fehlen.
                </div>
              )}
              <div className="flex justify-between font-serif text-xl text-charcoal-900 pt-3 border-t border-charcoal-900/10">
                <span>Gesamt</span>
                <span>{total.toFixed(2)} €</span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  )
}
