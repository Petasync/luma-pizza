'use client'
import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

interface FormProps {
  onSuccess: (paymentIntentId: string) => void
  onError: (msg: string) => void
  isSubmitting: boolean
  setIsSubmitting: (v: boolean) => void
}

function PaymentForm({ onSuccess, onError, isSubmitting, setIsSubmitting }: FormProps) {
  const stripe = useStripe()
  const elements = useElements()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setIsSubmitting(true)
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })
    if (error) {
      onError(error.message ?? 'Zahlung fehlgeschlagen.')
      setIsSubmitting(false)
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent.id)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || isSubmitting}
        className="w-full bg-primary text-white font-bold py-3 rounded hover:bg-primary-dark transition-colors disabled:opacity-50"
      >
        {isSubmitting ? 'Wird verarbeitet...' : 'Jetzt bezahlen'}
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/stripe/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    })
      .then(r => r.json())
      .then(data => setClientSecret(data.clientSecret))
      .catch(() => onError('Stripe konnte nicht initialisiert werden.'))
  }, [amount, onError])

  if (!clientSecret) return <p className="text-sm text-gray-400">Lade Zahlungsformular...</p>

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, locale: 'de' }}>
      <PaymentForm
        onSuccess={onSuccess}
        onError={onError}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
      />
    </Elements>
  )
}
