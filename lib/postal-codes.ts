// Liefergebiet rund um Dietenhofen 90599 — ca. 25 km Radius.
// Sortiert grob nach Entfernung. Falls Orte ergänzt/entfernt werden müssen,
// nur diese Datei anpassen; Marquee und PLZ-Check ziehen automatisch nach.

export interface DeliveryArea {
  postalCode: string
  name: string
}

export const DELIVERY_AREAS: DeliveryArea[] = [
  { postalCode: '90599', name: 'Dietenhofen' },
  { postalCode: '91560', name: 'Heilsbronn' },
  { postalCode: '91580', name: 'Petersaurach' },
  { postalCode: '91590', name: 'Bruckberg' },
  { postalCode: '91564', name: 'Neuendettelsau' },
  { postalCode: '91586', name: 'Lichtenau' },
  { postalCode: '91623', name: 'Sachsen b. Ansbach' },
  { postalCode: '91611', name: 'Lehrberg' },
  { postalCode: '91575', name: 'Windsbach' },
  { postalCode: '91639', name: 'Wolframs-Eschenbach' },
  { postalCode: '91459', name: 'Markt Erlbach' },
  { postalCode: '90613', name: 'Großhabersdorf' },
  { postalCode: '90574', name: 'Roßtal' },
  { postalCode: '90556', name: 'Cadolzburg' },
  { postalCode: '90614', name: 'Ammerndorf' },
  { postalCode: '91522', name: 'Ansbach' },
  { postalCode: '91550', name: 'Dinkelsbühl' },
  { postalCode: '91541', name: 'Rothenburg o.d.T.' },
]

const POSTAL_SET = new Set(DELIVERY_AREAS.map(a => a.postalCode))

export function isDeliverable(postalCode: string): boolean {
  return POSTAL_SET.has(postalCode.trim())
}

export function getAreaName(postalCode: string): string | null {
  const area = DELIVERY_AREAS.find(a => a.postalCode === postalCode.trim())
  return area?.name ?? null
}
