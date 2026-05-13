'use client'
import Link from 'next/link'
import { useCart } from '@/components/cart/cart-context'

export default function Navbar() {
  const { itemCount } = useCart()
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white font-black text-sm">L</span>
          </div>
          <span className="font-black text-gray-900 tracking-tight">LUMA Pizza</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/bestellen" className="text-sm text-gray-600 hover:text-gray-900">
            Speisekarte
          </Link>
          <Link
            href="/bestellen"
            className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded hover:bg-primary-dark transition-colors flex items-center gap-2"
          >
            Warenkorb
            {itemCount > 0 && (
              <span className="bg-accent text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  )
}
