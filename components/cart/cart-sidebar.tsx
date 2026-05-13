'use client'
import Link from 'next/link'
import { useCart } from './cart-context'
import CartItemRow from './cart-item'

export default function CartSidebar() {
  const { state, total, itemCount } = useCart()

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 bg-cream-50 border border-charcoal-900/10 lg:sticky lg:top-24 h-fit">
      <div className="p-5 border-b border-charcoal-900/10 flex items-center justify-between">
        <h2 className="font-serif text-xl text-charcoal-900">Dein Warenkorb</h2>
        {itemCount > 0 && (
          <span className="text-xs uppercase tracking-widest text-gold-600">
            {itemCount} Artikel
          </span>
        )}
      </div>

      {state.items.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <div className="w-14 h-14 mx-auto mb-4 border border-charcoal-900/15 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-charcoal-500">
              <path d="M6 6h15l-1.5 9h-13L4 3H1" />
              <circle cx="9" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
          </div>
          <p className="text-sm text-charcoal-500 mb-1">Dein Warenkorb ist leer.</p>
          <p className="text-xs text-charcoal-400">Wähle ein Gericht aus der Karte.</p>
        </div>
      ) : (
        <>
          <div className="p-5 max-h-[50vh] overflow-y-auto">
            {state.items.map(item => (
              <CartItemRow key={`${item.menuItemId}__${item.size}`} item={item} />
            ))}
          </div>

          <div className="px-5 py-4 border-t border-charcoal-900/10 space-y-2 bg-cream-100">
            <div className="flex justify-between text-sm text-charcoal-600">
              <span>Zwischensumme</span>
              <span>{total.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-sm text-charcoal-600">
              <span>Liefergebühr</span>
              <span className="text-gold-600 font-medium">0,00 €</span>
            </div>
            <div className="flex justify-between font-serif text-xl text-charcoal-900 pt-3 border-t border-charcoal-900/10">
              <span>Gesamt</span>
              <span>{total.toFixed(2)} €</span>
            </div>
          </div>

          <div className="p-5 pt-0">
            <Link href="/checkout" className="btn-primary w-full">
              Zur Kasse
            </Link>
          </div>
        </>
      )}
    </aside>
  )
}
