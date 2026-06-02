import { cartReducer, CartState } from '@/components/cart/cart-context'
import { CartItem } from '@/lib/types'

const item1: CartItem = { menuItemId: 'pizza-margherita', name: 'Pizza Margherita', size: '45cm', price: 9.50, quantity: 1 }
const item2: CartItem = { menuItemId: 'burger-cheese', name: 'Cheese Burger', size: null, price: 11.00, quantity: 1 }

const emptyState: CartState = { items: [] }

describe('cartReducer', () => {
  it('adds a new item', () => {
    const state = cartReducer(emptyState, { type: 'ADD_ITEM', item: item1 })
    expect(state.items).toHaveLength(1)
    expect(state.items[0].quantity).toBe(1)
  })

  it('increments quantity for same item+size', () => {
    const state1 = cartReducer(emptyState, { type: 'ADD_ITEM', item: item1 })
    const state2 = cartReducer(state1, { type: 'ADD_ITEM', item: item1 })
    expect(state2.items).toHaveLength(1)
    expect(state2.items[0].quantity).toBe(2)
  })

  it('treats same item with different size as separate', () => {
    const item1Small = { ...item1, size: '32cm', price: 8.50 }
    const state1 = cartReducer(emptyState, { type: 'ADD_ITEM', item: item1 })
    const state2 = cartReducer(state1, { type: 'ADD_ITEM', item: item1Small })
    expect(state2.items).toHaveLength(2)
  })

  it('removes an item', () => {
    const state1 = cartReducer(emptyState, { type: 'ADD_ITEM', item: item1 })
    const state2 = cartReducer(state1, { type: 'REMOVE_ITEM', menuItemId: 'pizza-margherita', size: '45cm' })
    expect(state2.items).toHaveLength(0)
  })

  it('decrements quantity with DECREMENT_ITEM', () => {
    const stateWith2 = { items: [{ ...item1, quantity: 2 }] }
    const state = cartReducer(stateWith2, { type: 'DECREMENT_ITEM', menuItemId: 'pizza-margherita', size: '45cm' })
    expect(state.items[0].quantity).toBe(1)
  })

  it('removes item when decrement reaches 0', () => {
    const stateWith1 = { items: [item1] }
    const state = cartReducer(stateWith1, { type: 'DECREMENT_ITEM', menuItemId: 'pizza-margherita', size: '45cm' })
    expect(state.items).toHaveLength(0)
  })

  it('clears all items', () => {
    const state1 = cartReducer(emptyState, { type: 'ADD_ITEM', item: item1 })
    const state2 = cartReducer(state1, { type: 'ADD_ITEM', item: item2 })
    const state3 = cartReducer(state2, { type: 'CLEAR' })
    expect(state3.items).toHaveLength(0)
  })
})
