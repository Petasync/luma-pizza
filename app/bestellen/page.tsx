'use client'
import { useRef, useState } from 'react'
import Navbar from '@/components/navbar'
import DeliveryMarquee from '@/components/delivery-marquee'
import CategoryTabs from '@/components/menu/category-tabs'
import MenuGrid from '@/components/menu/menu-grid'
import CartSidebar from '@/components/cart/cart-sidebar'
import ClosedBanner from '@/components/closed-banner'
import AllergenHinweis from '@/components/menu/allergen-hinweis'
import { MENU_CATEGORIES, menuJsonLd } from '@/lib/menu'

const MENU_JSON_LD = JSON.stringify(menuJsonLd())

export default function BestellenPage() {
  const [activeCategory, setActiveCategory] = useState<string>(MENU_CATEGORIES[0])
  const menuTopRef = useRef<HTMLDivElement>(null)

  function handleCategoryChange(cat: string) {
    setActiveCategory(cat)
    // Kürzere Rubriken lassen das Dokument schrumpfen — sonst klemmt der Browser
    // die Scroll-Position ans neue (kleinere) Maximum und man landet am
    // Seitenende. Daher beim Wechsel an den Menü-Anfang scrollen.
    menuTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
            <p className="text-cream-100/50 text-xs mt-3">
              Alle Preise sind Endpreise. Es kommen keine weiteren Kosten hinzu.
            </p>
          </div>
        </section>

        {/* Scroll-Anker: scroll-mt-20 = Höhe der fixen Navbar (80px) */}
        <div ref={menuTopRef} className="scroll-mt-20" aria-hidden />

        {/* Sticky category tabs */}
        <div className="sticky top-20 z-40 bg-cream-50/95 backdrop-blur-md border-b border-charcoal-900/8">
          <div className="container-wide px-4 sm:px-6 lg:px-12">
            <CategoryTabs active={activeCategory} onChange={handleCategoryChange} />
          </div>
        </div>

        {/* Content — pb auf Mobile, damit Inhalt nicht hinter dem schwebenden Warenkorb-Button verschwindet */}
        <section className="container-wide px-4 sm:px-6 lg:px-12 pt-8 pb-28 lg:pb-12">
          <ClosedBanner className="mb-6" />
          <AllergenHinweis className="mb-6" />
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
