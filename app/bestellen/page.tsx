'use client'
import { useState } from 'react'
import Navbar from '@/components/navbar'
import DeliveryMarquee from '@/components/delivery-marquee'
import CategoryTabs from '@/components/menu/category-tabs'
import MenuGrid from '@/components/menu/menu-grid'
import CartSidebar from '@/components/cart/cart-sidebar'
import ClosedBanner from '@/components/closed-banner'
import { MENU_CATEGORIES, menuJsonLd } from '@/lib/menu'

const MENU_JSON_LD = JSON.stringify(menuJsonLd())

export default function BestellenPage() {
  const [activeCategory, setActiveCategory] = useState<string>(MENU_CATEGORIES[0])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: MENU_JSON_LD }}
      />
      <Navbar />
      <main className="pt-20 min-h-screen bg-cream-50">
        <DeliveryMarquee />

        {/* Header */}
        <section className="bg-charcoal-900 text-cream-50 py-16 px-4 sm:px-6 lg:px-12">
          <div className="container-wide text-center">
            <p className="eyebrow text-gold-400 mb-4">Speisekarte</p>
            <h1 className="heading-serif text-4xl md:text-5xl">
              Unsere komplette Auswahl
            </h1>
            <p className="text-cream-100/70 mt-4 max-w-xl mx-auto">
              Wähle aus über 60 hausgemachten Gerichten. Frisch zubereitet,
              schnell geliefert oder zur Abholung bereit.
            </p>
          </div>
        </section>

        {/* Sticky category tabs */}
        <div className="sticky top-20 z-40 bg-cream-50/95 backdrop-blur-md border-b border-charcoal-900/8">
          <div className="container-wide px-4 sm:px-6 lg:px-12">
            <CategoryTabs active={activeCategory} onChange={setActiveCategory} />
          </div>
        </div>

        {/* Content */}
        <section className="container-wide px-4 sm:px-6 lg:px-12 py-12">
          <ClosedBanner className="mb-6" />
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            <div className="flex-1 min-w-0">
              <MenuGrid category={activeCategory} />
            </div>
            <CartSidebar />
          </div>
        </section>
      </main>
    </>
  )
}
