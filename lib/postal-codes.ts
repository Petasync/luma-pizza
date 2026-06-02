// Liefergebiet rund um Dietenhofen 90599 — bis ca. 15–18 km (Luftlinie).
// Distanzen via OpenStreetMap geprüft; sortiert grob nach Entfernung. Falls
// Orte ergänzt/entfernt werden müssen, nur diese Datei anpassen — Marquee
// und PLZ-Check ziehen automatisch nach.

export interface DeliveryArea {
  postalCode: string
  name: string
}

export const DELIVERY_AREAS: DeliveryArea[] = [
  { postalCode: '90599', name: 'Dietenhofen' },          //  0,5 km
  { postalCode: '91590', name: 'Bruckberg' },            //  5,2 km
  { postalCode: '90613', name: 'Großhabersdorf' },       //  7,4 km
  { postalCode: '91580', name: 'Petersaurach' },         //  8,9 km
  { postalCode: '91560', name: 'Heilsbronn' },           //  9,8 km
  { postalCode: '90614', name: 'Ammerndorf' },           // 12,2 km
  { postalCode: '91459', name: 'Markt Erlbach' },        // 12,4 km
  { postalCode: '91623', name: 'Sachsen b. Ansbach' },   // 12,6 km
  { postalCode: '90556', name: 'Cadolzburg' },           // 13,5 km
  { postalCode: '90574', name: 'Roßtal' },               // 14,3 km
  { postalCode: '91611', name: 'Lehrberg' },             // 14,4 km
  { postalCode: '91586', name: 'Lichtenau' },            // 14,7 km
  { postalCode: '91564', name: 'Neuendettelsau' },       // 14,9 km
]

const POSTAL_SET = new Set(DELIVERY_AREAS.map(a => a.postalCode))

export function isDeliverable(postalCode: string): boolean {
  return POSTAL_SET.has(postalCode.trim())
}

export function getAreaName(postalCode: string): string | null {
  const area = DELIVERY_AREAS.find(a => a.postalCode === postalCode.trim())
  return area?.name ?? null
}
