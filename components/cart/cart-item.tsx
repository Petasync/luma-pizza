'use client'
import { CartItem as CartItemType } from '@/lib/types'
import { useCart } from './cart-context'

interface Props {
  item: CartItemType
}

export default function CartItemRow({ item }: Props) {
  const { dispatch } = useCart()
  return (
    <div className="flex items-center justify-between gap-2 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
        {item.size && <p className="text-xs text-gray-400">{item.size}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => dispatch({ type: 'DECREMENT_ITEM', menuItemId: item.menuItemId, size: item.size })}
          className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded text-gray-600 hover:border-primary hover:text-primary text-sm font-bold"
        >
          −
        </button>
        <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
        <button
          onClick={() => dispatch({ type: 'ADD_ITEM', item: { ...item, quantity: 1 } })}
          className="w-6 h-6 flex items-center justify-center bg-primary text-white rounded text-sm font-bold hover:bg-primary-dark"
        >
          +
        </button>
        <span className="text-sm font-bold text-accent w-16 text-right">
          {(item.price * item.quantity).toFixed(2)} €
        </span>
      </div>
    </div>
  )
}
