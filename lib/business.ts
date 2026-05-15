/**
 * Zentrale Stellschrauben fürs Geschäft. Alles, was Kadir später
 * vielleicht anpassen möchte (Lieferzeit, Mindestbestellwert,
 * Liefergebühr), steht hier — nicht im UI verteilt.
 */

export const DELIVERY_ETA_MINUTES = { min: 30, max: 45 } as const
export const PICKUP_ETA_MINUTES = { min: 20, max: 30 } as const

/** Mindestbestellwert für Lieferung in Euro. Pickup hat keinen. */
export const MIN_ORDER_VALUE_DELIVERY = 15

/** Liefergebühr in Euro. Aktuell gratis im gesamten Liefergebiet. */
export const DELIVERY_FEE = 0

export interface EtaRange {
  min: number
  max: number
}

export function formatEta(eta: EtaRange): string {
  return `${eta.min}–${eta.max} Min.`
}

export function formatEuro(value: number): string {
  return `${value.toFixed(2).replace('.', ',')} €`
}
