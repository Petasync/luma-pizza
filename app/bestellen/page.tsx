'use client'
import { useState } from 'react'
import Navbar from '@/components/navbar'
import CategoryTabs from '@/components/menu/category-tabs'
import MenuGrid from '@/components/menu/menu-grid'
import CartSidebar from '@/components/cart/cart-sidebar'
import { MENU_CATEGORIES } from '@/lib/menu'

export default function BestellenPage() {
  const [activeCategory, setActiveCategory] = useState<string>(MENU_CATEGORIES[0])

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white border border-gray-200 rounded px-4 py-3 flex items-center gap-3 mb-5">
          <span className="text-gray-400 text-sm">🔍</span>
          <span className="text-gray-400 text-sm">Speisekarte durchsuchen...</span>
        </div>

        <div className="mb-6">
          <CategoryTabs active={activeCategory} onChange={setActiveCategory} />
        </div>

        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            <MenuGrid category={activeCategory} />
          </div>
          <CartSidebar />
        </div>
      </main>
    </>
  )
}
