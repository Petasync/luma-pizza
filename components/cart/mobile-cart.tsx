'use client'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useCart } from './cart-context'
import CartItemRow from './cart-item'
import { formatEuro } from '@/lib/business'

/**
 * Mobile-Warenkorb: schwebender Button rechts unten + Slide-in-Drawer
 * von rechts. Auf Desktop unsichtbar — dort übernimmt die Sidebar.
 *
 * Ohne diesen Drawer müsste man auf dem Handy nach jeder „+ Hinzufügen"-
 * Aktion zum Fuß der Speisekarte scrollen, um zu prüfen was im Warenkorb
 * gelandet ist — schlechte UX. Mit FAB ist der Warenkorb einen Daumen-Tap
 * entfernt.
 */
export default function MobileCart() {
  const { state, total, itemCount } = useCart()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Auf der Kasse selbst stört der FAB, da ist der Warenkorb eh sichtbar.
  const showOnPage = pathname !== '/checkout'

  // Schließen mit ESC + Body-Scroll-Lock, solange der Drawer offen ist.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  // Drawer schließen, wenn der Nutzer mit gefülltem Warenkorb navigiert.
  useEffect(() => { setOpen(false) }, [pathname])

  // Kurzes Pulsen des FAB, wenn ein Artikel hinzugefügt wurde — visuelles
  // Feedback, damit man auch ohne Drawer-Öffnen sieht "ja, klappt".
  const [pulse, setPulse] = useState(false)
  const prevCount = useRef(itemCount)
  useEffect(() => {
    if (itemCount > prevCount.current) {
      setPulse(true)
      const t = setTimeout(() => setPulse(false), 350)
      prevCount.current = itemCount
      return () => clearTimeout(t)
    }
    prevCount.current = itemCount
  }, [itemCount])

  if (!showOnPage) return null

  return (
    <>
      {/* Floating Action Button — sichtbar erst ab 1 Artikel, nur Mobile/Tablet */}
      {itemCount > 0 && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Warenkorb öffnen (${itemCount} Artikel, ${formatEuro(total)})`}
          className={`lg:hidden fixed right-5 z-50 flex items-center gap-3 bg-charcoal-900 text-cream-50 pl-4 pr-5 py-3 shadow-2xl border border-gold-500/30 hover:bg-gold-600 active:scale-95 transition-transform duration-300 ${
            pulse ? 'scale-110' : 'scale-100'
          }`}
          style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
        >
          <span className="relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M6 6h15l-1.5 9h-13L4 3H1" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
            <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1.5 inline-flex items-center justify-center bg-gold-500 text-charcoal-900 text-[10px] font-bold rounded-full">
              {itemCount}
            </span>
          </span>
          <span className="font-serif text-base tabular-nums">{formatEuro(total)}</span>
        </button>
      )}

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`lg:hidden fixed inset-0 z-50 bg-charcoal-900/50 backdrop-blur-[1px] transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Warenkorb"
        className={`lg:hidden fixed top-0 right-0 z-50 h-[100dvh] w-[90vw] max-w-sm bg-cream-50 shadow-2xl flex flex-col transition-transform duration-250 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-charcoal-900/10 flex-shrink-0">
          <div>
            <h2 className="font-serif text-xl text-charcoal-900">Warenkorb</h2>
            {itemCount > 0 && (
              <p className="text-xs uppercase tracking-widest text-gold-600 mt-0.5">{itemCount} Artikel</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Schließen"
            className="w-10 h-10 -mr-2 flex items-center justify-center text-charcoal-700 hover:bg-charcoal-900/5 active:bg-charcoal-900/10"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {state.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-16 h-16 mb-4 border border-charcoal-900/15 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-charcoal-500" aria-hidden="true">
                <path d="M6 6h15l-1.5 9h-13L4 3H1" />
                <circle cx="9" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
              </svg>
            </div>
            <p className="text-sm text-charcoal-500">Dein Warenkorb ist leer.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {state.items.map(item => (
                <CartItemRow key={`${item.menuItemId}__${item.size}`} item={item} />
              ))}
            </div>

            <div className="px-5 py-4 border-t border-charcoal-900/10 bg-cream-100 space-y-2 flex-shrink-0">
              <div className="flex justify-between text-sm text-charcoal-600">
                <span>Zwischensumme</span>
                <span className="tabular-nums">{formatEuro(total)}</span>
              </div>
              <div className="flex justify-between text-sm text-charcoal-600">
                <span>Liefergebühr</span>
                <span className="text-gold-600 font-medium">Gratis</span>
              </div>
              <div className="flex justify-between font-serif text-xl text-charcoal-900 pt-3 border-t border-charcoal-900/10">
                <span>Gesamt</span>
                <span className="tabular-nums">{formatEuro(total)}</span>
              </div>
            </div>

            <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 flex-shrink-0">
              <Link href="/checkout" className="btn-primary w-full text-center block py-4">
                Zur Kasse
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
