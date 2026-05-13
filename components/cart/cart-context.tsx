'use client'
import { createContext, useContext, useReducer, ReactNode, Dispatch } from 'react'
import { CartItem } from '@/lib/types'

export interface CartState {
  items: CartItem[]
}

type CartAction =
  | { type: 'ADD_ITEM'; item: CartItem }
  | { type: 'REMOVE_ITEM'; menuItemId: string; size: string | null }
  | { type: 'DECREMENT_ITEM'; menuItemId: string; size: string | null }
  | { type: 'CLEAR' }

function itemKey(menuItemId: string, size: string | null) {
  return `${menuItemId}__${size ?? 'nosize'}`
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const key = itemKey(action.item.menuItemId, action.item.size)
      const existing = state.items.find(
        i => itemKey(i.menuItemId, i.size) === key
      )
      if (existing) {
        return {
          items: state.items.map(i =>
            itemKey(i.menuItemId, i.size) === key
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        }
      }
      return { items: [...state.items, { ...action.item, quantity: 1 }] }
    }
    case 'DECREMENT_ITEM': {
      const key = itemKey(action.menuItemId, action.size)
      const existing = state.items.find(i => itemKey(i.menuItemId, i.size) === key)
      if (!existing) return state
      if (existing.quantity <= 1) {
        return { items: state.items.filter(i => itemKey(i.menuItemId, i.size) !== key) }
      }
      return {
        items: state.items.map(i =>
          itemKey(i.menuItemId, i.size) === key ? { ...i, quantity: i.quantity - 1 } : i
        ),
      }
    }
    case 'REMOVE_ITEM': {
      const key = itemKey(action.menuItemId, action.size)
      return { items: state.items.filter(i => itemKey(i.menuItemId, i.size) !== key) }
    }
    case 'CLEAR':
      return { items: [] }
  }
}

interface CartContextValue {
  state: CartState
  dispatch: Dispatch<CartAction>
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })
  const total = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0)
  return (
    <CartContext.Provider value={{ state, dispatch, total, itemCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
