'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/navbar'
import { useCart } from '@/components/cart/cart-context'
import DeliveryToggle from '@/components/checkout/delivery-toggle'
import PostalCheck from '@/components/checkout/postal-check'
import ContactForm, { ContactData } from '@/components/checkout/contact-form'
import StripePayment from '@/components/checkout/stripe-payment'
import PayPalButton from '@/components/checkout/paypal-button'
import { OrderType, PaymentMethod } from '@/lib/types'

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

  async function createOrder(paymentIntentId?: string) {
    setIsSubmitting(true)
    setError('')
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
        stripe_payment_intent_id: paymentIntentId,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Fehler beim Erstellen der Bestellung.'); setIsSubmitting(false); return }
    dispatch({ type: 'CLEAR' })
    router.push(`/bestellung/${data.id}`)
  }

  if (state.items.length === 0) {
    return (
      <>
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-500">Dein Warenkorb ist leer.</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl font-black text-gray-900">Kasse</h1>

        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <DeliveryToggle value={orderType} onChange={v => { setOrderType(v); setPlzConfirmed(false); setStep('delivery') }} />
          {orderType === 'delivery' && !plzConfirmed && (
            <div className="mt-4">
              <PostalCheck onConfirm={plz => { setPostalCode(plz); setPlzConfirmed(true); setStep('contact') }} />
            </div>
          )}
          {(orderType === 'pickup' || plzConfirmed) && (
            <p className="mt-3 text-sm text-green-600 font-medium">
              {orderType === 'pickup' ? '✓ Abholung ausgewählt' : `✓ Lieferung nach ${postalCode}`}
            </p>
          )}
        </section>

        {(orderType === 'pickup' || plzConfirmed) && (
          <section className="bg-white border border-gray-200 rounded-lg p-6">
            <ContactForm data={contact} onChange={setContact} showAddress={orderType === 'delivery'} />
            <button
              onClick={() => {
                if (!contact.name || !contact.email || !contact.phone) { setError('Bitte alle Pflichtfelder ausfüllen.'); return }
                if (orderType === 'delivery' && !contact.street) { setError('Bitte Straße angeben.'); return }
                setError('')
                setStep('payment')
              }}
              className="mt-4 bg-primary text-white font-semibold px-6 py-2 rounded hover:bg-primary-dark transition-colors"
            >
              Weiter zur Zahlung →
            </button>
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </section>
        )}

        {step === 'payment' && (
          <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Zahlung</h2>

            <div className="bg-gray-50 rounded p-4 text-sm space-y-1">
              {state.items.map(i => (
                <div key={`${i.menuItemId}__${i.size}`} className="flex justify-between text-gray-600">
                  <span>{i.quantity}× {i.name}{i.size ? ` (${i.size})` : ''}</span>
                  <span>{(i.price * i.quantity).toFixed(2)} €</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Gesamt</span><span>{total.toFixed(2)} €</span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {(['card', 'paypal', 'cash'] as PaymentMethod[]).map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`px-4 py-2 rounded border text-sm font-medium transition-colors ${
                    paymentMethod === m
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
                  }`}
                >
                  {m === 'card' ? '💳 Karte / Klarna' : m === 'paypal' ? '🔵 PayPal' : '💵 Bar'}
                </button>
              ))}
            </div>

            {paymentMethod === 'card' && (
              <StripePayment
                amount={total}
                onSuccess={pid => createOrder(pid)}
                onError={msg => setError(msg)}
              />
            )}
            {paymentMethod === 'paypal' && (
              <PayPalButton
                amount={total}
                onSuccess={() => createOrder()}
                onError={msg => setError(msg)}
              />
            )}
            {paymentMethod === 'cash' && (
              <button
                onClick={() => createOrder()}
                disabled={isSubmitting}
                className="w-full bg-primary text-white font-bold py-3 rounded hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Wird übermittelt...' : 'Bestellung abschicken (Bar zahlen)'}
              </button>
            )}
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </section>
        )}
      </main>
    </>
  )
}
