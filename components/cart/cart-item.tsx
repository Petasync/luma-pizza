'use client'
import { CartItem as CartItemType } from '@/lib/types'
import { useCart } from './cart-context'

interface Props {
  item: CartItemType
}

export default function CartItemRow({ item }: Props) {
  const { dispatch } = useCart()
  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-charcoal-900/8 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-charcoal-900 leading-tight">{item.name}</p>
        {item.size && <p className="text-xs text-charcoal-500 mt-0.5">{item.size}</p>}
        <p className="text-xs text-gold-600 mt-1 font-medium">
          {item.price.toFixed(2)} € / Stk.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex items-center border border-charcoal-900/15">
          <button
            onClick={() => dispatch({ type: 'DECREMENT_ITEM', menuItemId: item.menuItemId, size: item.size })}
            className="w-7 h-7 flex items-center justify-center text-charcoal-700 hover:bg-charcoal-900 hover:text-cream-50 text-base font-light transition-colors"
            aria-label="Weniger"
          >
            −
          </button>
          <span className="text-xs font-medium w-6 text-center">{item.quantity}</span>
          <button
            onClick={() => dispatch({ type: 'ADD_ITEM', item: { ...item, quantity: 1 } })}
            className="w-7 h-7 flex items-center justify-center text-charcoal-700 hover:bg-charcoal-900 hover:text-cream-50 text-base font-light transition-colors"
            aria-label="Mehr"
          >
            +
          </button>
        </div>
        <span className="font-serif text-sm text-charcoal-900 w-16 text-right">
          {(item.price * item.quantity).toFixed(2)} €
        </span>
      </div>
    </div>
  )
}
