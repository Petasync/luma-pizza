import { priceCart, PricingError } from '@/lib/pricing'
import { CartItem } from '@/lib/types'

// pizza-margherita: priceSmall 10.50 (33 cm), priceLarge 17.00 (45 cm)
// burger-cheese: price 12.50 (no size)
// dessert-baklava: available: false

describe('priceCart', () => {
  it('computes the total from the canonical menu, ignoring client prices', () => {
    const items: CartItem[] = [
      { menuItemId: 'pizza-margherita', name: 'whatever', size: '45cm', price: 0.01, quantity: 2 },
      { menuItemId: 'burger-cheese', name: 'x', size: null, price: 999, quantity: 1 },
    ]
    const result = priceCart(items)
    // 2 × 17.00 + 1 × 12.50 = 46.50
    expect(result.totalCents).toBe(4650)
    expect(result.total).toBe(46.5)
    expect(result.items[0].price).toBe(17)
    expect(result.items[1].price).toBe(12.5)
  })

  it('uses priceSmall for the 33 cm size', () => {
    const result = priceCart([
      { menuItemId: 'pizza-margherita', name: 'x', size: '33cm', price: 0, quantity: 1 },
    ])
    expect(result.total).toBe(10.5)
  })

  it('overwrites the item name with the canonical menu name', () => {
    const result = priceCart([
      { menuItemId: 'burger-cheese', name: 'Free Burger lol', size: null, price: 0, quantity: 1 },
    ])
    expect(result.items[0].name).toBe('Cheese Burger')
  })

  it('accepts a valid Beilage for a dish that has sides', () => {
    const result = priceCart([
      { menuItemId: 'schnitzel-puten', name: 'x', size: 'Pommes frites', price: 0, quantity: 1 },
    ])
    expect(result.total).toBe(13.5)
    expect(result.items[0].size).toBe('Pommes frites')
  })

  it('rejects an invalid Beilage for a dish that has sides', () => {
    expect(() =>
      priceCart([{ menuItemId: 'schnitzel-puten', name: 'x', size: 'Trüffelpüree', price: 0, quantity: 1 }]),
    ).toThrow(PricingError)
  })

  it('rejects a missing Beilage for a dish that has sides', () => {
    expect(() =>
      priceCart([{ menuItemId: 'schnitzel-puten', name: 'x', size: null, price: 0, quantity: 1 }]),
    ).toThrow(PricingError)
  })

  it('rejects an empty cart', () => {
    expect(() => priceCart([])).toThrow(PricingError)
  })

  it('rejects an unknown menu item', () => {
    expect(() =>
      priceCart([{ menuItemId: 'pizza-free-money', name: 'x', size: null, price: 0, quantity: 1 }]),
    ).toThrow(PricingError)
  })

  it('rejects an unavailable item', () => {
    expect(() =>
      priceCart([{ menuItemId: 'dessert-baklava', name: 'x', size: null, price: 0, quantity: 1 }]),
    ).toThrow(PricingError)
  })

  it('rejects an invalid size for the item', () => {
    expect(() =>
      priceCart([{ menuItemId: 'burger-cheese', name: 'x', size: '33cm', price: 0, quantity: 1 }]),
    ).toThrow(PricingError)
  })

  it('rejects non-positive and non-integer quantities', () => {
    expect(() =>
      priceCart([{ menuItemId: 'burger-cheese', name: 'x', size: null, price: 0, quantity: 0 }]),
    ).toThrow(PricingError)
    expect(() =>
      priceCart([{ menuItemId: 'burger-cheese', name: 'x', size: null, price: 0, quantity: 1.5 }]),
    ).toThrow(PricingError)
    expect(() =>
      priceCart([{ menuItemId: 'burger-cheese', name: 'x', size: null, price: 0, quantity: -3 }]),
    ).toThrow(PricingError)
  })
})
