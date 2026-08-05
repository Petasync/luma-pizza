/**
 * Testet die Ablauf-Logik von <PayPalButton>: Erst vormerken
 * (`onBeforeConfirm`), DANACH kassieren (`actions.order.capture()`). Schlägt
 * das Vormerken fehl, darf `capture()` niemals aufgerufen werden — sonst
 * bestünde bei PayPal weiterhin das Verlustrisiko vom 26.07.2026.
 *
 * `@paypal/react-paypal-js` wird komplett gemockt: `PayPalButtons` rendert
 * nichts Sichtbares, hält aber die übergebenen Props (u. a. `onApprove`) fest,
 * damit der Test sie wie ein echter PayPal-Klick direkt aufrufen kann.
 */
import { render } from '@testing-library/react'

let letztePayPalButtonsProps: any

jest.mock('@paypal/react-paypal-js', () => ({
  PayPalScriptProvider: ({ children }: { children: React.ReactNode }) => children,
  PayPalButtons: (props: any) => {
    letztePayPalButtonsProps = props
    return null
  },
}))

import PayPalButton from '@/components/checkout/paypal-button'

describe('PayPalButton', () => {
  const onBeforeConfirm = jest.fn()
  const onSuccess = jest.fn()
  const onError = jest.fn()
  const urspruenglicheKennung = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

  beforeEach(() => {
    onBeforeConfirm.mockReset()
    onSuccess.mockReset()
    onError.mockReset()
    letztePayPalButtonsProps = undefined
    // Der Knopf erscheint nur mit gesetzter Kennung — für die Ablauf-Tests
    // simulieren wir ein eingerichtetes PayPal-Konto.
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID = 'test-kennung'
  })

  afterAll(() => {
    if (urspruenglicheKennung === undefined) delete process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    else process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID = urspruenglicheKennung
  })

  it('zeigt ohne hinterlegte Kennung keinen Knopf, sondern einen Hinweis', () => {
    // Früher fiel die Komponente auf PayPals Testumgebung ('sb') zurück: Der Knopf
    // sah funktionsfähig aus, echte Kunden konnten damit aber nicht bezahlen.
    delete process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    const { getByText } = render(
      <PayPalButton amount={17} onBeforeConfirm={onBeforeConfirm} onSuccess={onSuccess} onError={onError} />,
    )
    expect(getByText(/steht derzeit nicht zur Verfügung/)).toBeInTheDocument()
    expect(letztePayPalButtonsProps).toBeUndefined()
  })

  function renderButton() {
    render(<PayPalButton amount={17} onBeforeConfirm={onBeforeConfirm} onSuccess={onSuccess} onError={onError} />)
  }

  it('PayPal-Zahlung erfolgreich: merkt vor, kassiert danach erst, meldet dann Erfolg', async () => {
    onBeforeConfirm.mockResolvedValue('best-123')
    const capture = jest.fn().mockResolvedValue({ status: 'COMPLETED' })
    renderButton()

    await letztePayPalButtonsProps.onApprove({ orderID: 'PAYPAL-1' }, { order: { capture } })

    // Reihenfolge ist der Kern der Absicherung: vormerken (mit der PayPal-
    // Bestell-ID) MUSS vor capture() passieren.
    expect(onBeforeConfirm).toHaveBeenCalledWith('PAYPAL-1')
    expect(capture).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith('best-123')
    expect(onError).not.toHaveBeenCalled()
  })

  it('PayPal-Zahlung schlägt fehl (Vormerken abgelehnt): capture() wird NIE aufgerufen', async () => {
    onBeforeConfirm.mockRejectedValue(new Error('Betrag stimmt nicht mit dem Warenkorb überein.'))
    const capture = jest.fn().mockResolvedValue({ status: 'COMPLETED' })
    renderButton()

    await letztePayPalButtonsProps.onApprove({ orderID: 'PAYPAL-1' }, { order: { capture } })

    expect(capture).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith('Betrag stimmt nicht mit dem Warenkorb überein.')
  })

  it('PayPal-Zahlung schlägt fehl (Kaptur liefert keinen COMPLETED-Status): kein Erfolg gemeldet', async () => {
    onBeforeConfirm.mockResolvedValue('best-123')
    const capture = jest.fn().mockResolvedValue({ status: 'PENDING' })
    renderButton()

    await letztePayPalButtonsProps.onApprove({ orderID: 'PAYPAL-1' }, { order: { capture } })

    expect(onSuccess).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith('PayPal-Zahlung fehlgeschlagen.')
  })

  it('PayPal-Zahlung schlägt fehl (capture() wirft, z. B. Netzwerkfehler): kein Absturz, onError greift', async () => {
    onBeforeConfirm.mockResolvedValue('best-123')
    const capture = jest.fn().mockRejectedValue(new Error('network down'))
    renderButton()

    await letztePayPalButtonsProps.onApprove({ orderID: 'PAYPAL-1' }, { order: { capture } })

    expect(onSuccess).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith('PayPal-Zahlung fehlgeschlagen.')
  })

  it('reicht einen PayPal-eigenen Fehler (onError des SDK) unverändert durch', () => {
    renderButton()
    letztePayPalButtonsProps.onError(new Error('sdk error'))
    expect(onError).toHaveBeenCalledWith('PayPal-Zahlung fehlgeschlagen.')
  })
})
