'use client'
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'

interface Props {
  amount: number
  onSuccess: (orderId: string) => void
  onError: (msg: string) => void
}

export default function PayPalButton({ amount, onSuccess, onError }: Props) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb'
  return (
    <PayPalScriptProvider options={{ clientId, currency: 'EUR', disableFunding: 'sepa' }}>
      <PayPalButtons
        style={{ layout: 'vertical', shape: 'rect' }}
        createOrder={(_, actions) =>
          actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [{ amount: { currency_code: 'EUR', value: amount.toFixed(2) } }],
          })
        }
        onApprove={async (_, actions) => {
          const order = await actions.order!.capture()
          if (order.status === 'COMPLETED' && order.id) {
            onSuccess(order.id)
          }
        }}
        onError={() => onError('PayPal-Zahlung fehlgeschlagen.')}
      />
    </PayPalScriptProvider>
  )
}
