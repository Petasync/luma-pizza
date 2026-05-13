const DELIVERY_POSTAL_CODES = new Set([
  '90599', // Dietenhofen
])

export function isDeliverable(postalCode: string): boolean {
  return DELIVERY_POSTAL_CODES.has(postalCode.trim())
}
