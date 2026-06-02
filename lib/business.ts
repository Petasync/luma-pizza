/**
 * Zentrale Stellschrauben fürs Geschäft. Alles, was Kadir später
 * vielleicht anpassen möchte (Lieferzeit, Mindestbestellwert,
 * Liefergebühr), steht hier — nicht im UI verteilt.
 */

export const DELIVERY_ETA_MINUTES = { min: 30, max: 45 } as const
export const PICKUP_ETA_MINUTES = { min: 20, max: 30 } as const

/**
 * Mindestbestellwert für Lieferung in Euro (Pickup hat keinen).
 * Ortsabhängig: in Dietenhofen (PLZ 90599) gilt ein niedrigerer Wert,
 * alle übrigen Orte im Liefergebiet haben den höheren.
 */
export const MIN_ORDER_DIETENHOFEN = 15
export const MIN_ORDER_OTHER = 30

/** PLZ von Dietenhofen — der Standort des Restaurants. */
const PLZ_DIETENHOFEN = '90599'

/** Liefert den Mindestbestellwert für eine PLZ. Unbekannt/leer → höherer Wert. */
export function getMinOrderForPostalCode(postalCode?: string | null): number {
  return postalCode?.trim() === PLZ_DIETENHOFEN ? MIN_ORDER_DIETENHOFEN : MIN_ORDER_OTHER
}

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

// ---------------------------------------------------------------------------
// USt-Sätze (Deutschland, Gastronomie außer Haus)
// ---------------------------------------------------------------------------
//
// Unsere Online-Bestellung kennt nur Lieferung & Abholung — beide gelten als
// "Speisen außer Haus" und unterliegen damit dem ermäßigten Satz von 7 %.
// Getränke werden in der Gastronomie generell mit 19 % besteuert (auch wenn
// sie außer Haus verkauft werden), Wasser ausgenommen — der Übersichtlichkeit
// halber fassen wir alle Getränke unter 19 % zusammen.

export const VAT_RATES = {
  food: 0.07,
  drinks: 0.19,
} as const

export type VatCategory = keyof typeof VAT_RATES

/** Menü-Kategorie → Steuerbucket. Default ist 'food' (sicherer für Pizza-Lieferdienst). */
const CATEGORY_TO_VAT: Record<string, VatCategory> = {
  'Pizza': 'food',
  'Burger': 'food',
  'Pasta': 'food',
  'Fisch Gerichte': 'food',
  'Schnitzel Gerichte': 'food',
  'Snacks': 'food',
  'Beilagen': 'food',
  'Salate': 'food',
  'Nachspeisen': 'food',
  'Alkoholische Getränke': 'drinks',
  'Alkoholfreie Getränke': 'drinks',
}

export function getVatCategory(menuCategory: string): VatCategory {
  return CATEGORY_TO_VAT[menuCategory] ?? 'food'
}

export interface VatBucket {
  /** Bruttobetrag in Cent (was der Kunde bezahlt). */
  grossCents: number
  /** Nettobetrag in Cent (vor MwSt). */
  netCents: number
  /** MwSt-Betrag in Cent. */
  vatCents: number
}

export type VatBreakdown = Record<VatCategory, VatBucket>

export function emptyVatBreakdown(): VatBreakdown {
  return {
    food:   { grossCents: 0, netCents: 0, vatCents: 0 },
    drinks: { grossCents: 0, netCents: 0, vatCents: 0 },
  }
}

/**
 * Rechnet auf Basis der pro Bucket aufsummierten Bruttobeträge die Netto-
 * und MwSt-Anteile aus (kaufmännisch gerundet auf den Cent). Wir rechnen
 * absichtlich erst am Ende — Position-für-Position-Rundung würde Cent-
 * Differenzen erzeugen, die in einer Rechnung schlecht aussehen.
 */
export function finalizeVatBreakdown(b: VatBreakdown): VatBreakdown {
  for (const cat of ['food', 'drinks'] as const) {
    const rate = VAT_RATES[cat]
    const gross = b[cat].grossCents
    if (gross === 0) continue
    const net = Math.round(gross / (1 + rate))
    b[cat].netCents = net
    b[cat].vatCents = gross - net
  }
  return b
}
