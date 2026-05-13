import { isDeliverable } from '@/lib/postal-codes'

describe('isDeliverable', () => {
  it('returns true for 90599', () => {
    expect(isDeliverable('90599')).toBe(true)
  })
  it('returns false for unknown PLZ', () => {
    expect(isDeliverable('10115')).toBe(false)
  })
  it('trims whitespace', () => {
    expect(isDeliverable(' 90599 ')).toBe(true)
  })
})
