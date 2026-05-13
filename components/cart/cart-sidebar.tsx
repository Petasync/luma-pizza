'use client'
import Link from 'next/link'
import { useCart } from './cart-context'
import CartItemRow from './cart-item'

export default function CartSidebar() {
  const { state, total, itemCount } = useCart()

  return (
    <aside className="w-72 flex-shrink-0 bg-white border border-gray-200 rounded-lg p-4 sticky top-20 h-fit">
      <h2 className="font-bold text-gray-900 mb-4 flex items-center justify-between">
        Warenkorb
        {itemCount > 0 && (
          <span className="text-xs font-normal text-gray-400">{itemCount} Artikel</span>
        )}
      </h2>

      {state.items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Dein Warenkorb ist leer.</p>
      ) : (
        <>
          <div className="mb-4">
            {state.items.map(item => (
              <CartItemRow key={`${item.menuItemId}__${item.size}`} item={item} />
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-1 mb-4">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Zwischensumme</span>
              <span>{total.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Liefergebühr</span>
              <span className="text-green-600 font-medium">0,00 €</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Gesamt</span>
              <span>{total.toFixed(2)} €</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="block w-full bg-primary text-white text-center font-semibold py-3 rounded hover:bg-primary-dark transition-colors"
          >
            Zur Kasse →
          </Link>
        </>
      )}
    </aside>
  )
}
