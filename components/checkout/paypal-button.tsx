'use client'
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'

interface Props {
  amount: number
  /**
   * Läuft NACH der Freigabe durch den Kunden bei PayPal, aber VOR dem
   * eigentlichen Einzug des Geldes (`actions.order.capture()`). Legt die
   * Bestellung serverseitig vor — genau wie `onBeforeConfirm` bei der
   * Kartenzahlung. Wirft diese Funktion, wird NICHT kapturiert: kein
   * Geldabzug ohne Bestellung.
   */
  onBeforeConfirm: (paypalOrderId: string) => Promise<string>
  onSuccess: (orderId: string) => void
  onError: (msg: string) => void
}

export default function PayPalButton({ amount, onBeforeConfirm, onSuccess, onError }: Props) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  // Früher stand hier als Rückfall `'sb'` — PayPals Testumgebung. Ohne gesetzte
  // Kennung erschien dadurch ein funktionsfähig aussehender Knopf, über den echte
  // Kunden nicht bezahlen können und über den eine Testzahlung eine Bestellung
  // als bezahlt markiert hätte. Ohne Kennung gibt es jetzt keinen Knopf.
  if (!clientId) {
    return (
      <p className="text-sm text-charcoal-600">
        PayPal steht derzeit nicht zur Verfügung. Bitte wähle Karte oder Barzahlung.
      </p>
    )
  }

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
        onApprove={async (data, actions) => {
          // Erst die Bestellung sichern, dann kassieren — wie beim Kartenweg.
          // Andersherum könnte PayPal das Geld einziehen, ohne dass irgendwo
          // eine Bestellung entsteht (siehe 26.07.2026).
          let orderId: string
          try {
            orderId = await onBeforeConfirm(data.orderID)
          } catch (e) {
            onError(e instanceof Error ? e.message : 'Bestellung konnte nicht angelegt werden.')
            return
          }

          let capture
          try {
            capture = await actions.order!.capture()
          } catch {
            onError('PayPal-Zahlung fehlgeschlagen.')
            return
          }

          if (capture.status === 'COMPLETED') {
            onSuccess(orderId)
          } else {
            onError('PayPal-Zahlung fehlgeschlagen.')
          }
        }}
        onError={() => onError('PayPal-Zahlung fehlgeschlagen.')}
      />
    </PayPalScriptProvider>
  )
}
