import { priceCart, PricingError } from '@/lib/pricing'
import { CartItem } from '@/lib/types'

// pizza-margherita: priceSmall 8.50 (32 cm), priceLarge 9.50 (45 cm)
// burger-cheese: price 11.00 (no size)
// dessert-ice: available: false

describe('priceCart', () => {
  it('computes the total from the canonical menu, ignoring client prices', () => {
    const items: CartItem[] = [
      { menuItemId: 'pizza-margherita', name: 'whatever', size: '45cm', price: 0.01, quantity: 2 },
      { menuItemId: 'burger-cheese', name: 'x', size: null, price: 999, quantity: 1 },
    ]
    const result = priceCart(items)
    // 2 × 9.50 + 1 × 11.00 = 30.00
    expect(result.totalCents).toBe(3000)
    expect(result.total).toBe(30)
    expect(result.items[0].price).toBe(9.5)
    expect(result.items[1].price).toBe(11)
  })

  it('uses priceSmall for the 32 cm size', () => {
    const result = priceCart([
      { menuItemId: 'pizza-margherita', name: 'x', size: '32cm', price: 0, quantity: 1 },
    ])
    expect(result.total).toBe(8.5)
  })

  it('overwrites the item name with the canonical menu name', () => {
    const result = priceCart([
      { menuItemId: 'burger-cheese', name: 'Free Burger lol', size: null, price: 0, quantity: 1 },
    ])
    expect(result.items[0].name).toBe('Cheese Burger')
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
      priceCart([{ menuItemId: 'dessert-ice', name: 'x', size: null, price: 0, quantity: 1 }]),
    ).toThrow(PricingError)
  })

  it('rejects an invalid size for the item', () => {
    expect(() =>
      priceCart([{ menuItemId: 'burger-cheese', name: 'x', size: '32cm', price: 0, quantity: 1 }]),
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
