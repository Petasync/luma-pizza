'use client'
import { useState, useEffect, useRef } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

interface FormProps {
  onSuccess: (paymentIntentId: string) => void
  onError: (msg: string) => void
}

function PaymentForm({ onSuccess, onError }: FormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setIsSubmitting(true)
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/checkout`,
      },
    })
    if (error) {
      onError(error.message ?? 'Zahlung fehlgeschlagen.')
      setIsSubmitting(false)
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent.id)
    } else {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement options={{ layout: 'tabs' }} />
      <button
        type="submit"
        disabled={!stripe || isSubmitting}
        className="btn-primary w-full disabled:opacity-50"
      >
        {isSubmitting ? 'Wird verarbeitet …' : 'Jetzt bezahlen'}
      </button>
    </form>
  )
}

interface Props {
  amount: number
  onSuccess: (paymentIntentId: string) => void
  onError: (msg: string) => void
}

export default function StripePayment({ amount, onSuccess, onError }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [initError, setInitError] = useState<string | null>(null)
  // Stabilize callbacks via refs to avoid effect re-runs that would mutate clientSecret.
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError
  // Round amount to cents so React-state changes don't trip re-fetches on float jitter.
  const amountCents = Math.round(amount * 100)

  useEffect(() => {
    let cancelled = false
    fetch('/api/stripe/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amountCents / 100 }),
    })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
        } else {
          setInitError(data.error ?? 'Stripe konnte nicht initialisiert werden.')
          onErrorRef.current(data.error ?? 'Stripe konnte nicht initialisiert werden.')
        }
      })
      .catch(() => {
        if (cancelled) return
        const msg = 'Stripe konnte nicht erreicht werden.'
        setInitError(msg)
        onErrorRef.current(msg)
      })
    return () => { cancelled = true }
  }, [amountCents])

  if (initError) {
    return <p className="text-wine-600 text-sm">{initError}</p>
  }
  if (!clientSecret) {
    return <p className="text-sm text-charcoal-500">Zahlungsformular wird geladen …</p>
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        locale: 'de',
        appearance: {
          theme: 'flat',
          variables: {
            colorPrimary: '#1A1612',
            colorBackground: '#FBF8F1',
            colorText: '#1A1612',
            colorDanger: '#7A2E2A',
            fontFamily: 'system-ui, sans-serif',
            borderRadius: '0px',
            spacingUnit: '4px',
          },
        },
      }}
    >
      <PaymentForm onSuccess={onSuccess} onError={onError} />
    </Elements>
  )
}
