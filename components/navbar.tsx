'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useCart } from '@/components/cart/cart-context'
import OpeningStatusBadge from '@/components/opening-status'

interface Props {
  /** When true, navbar starts transparent on top of a dark hero and turns solid on scroll. */
  transparent?: boolean
}

export default function Navbar({ transparent = false }: Props) {
  const { itemCount } = useCart()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!transparent) return
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [transparent])

  const onHomepage = pathname === '/'
  const solid = !transparent || scrolled
  const isHash = (href: string) => href.startsWith('#')

  const links: { href: string; label: string }[] = onHomepage
    ? [
        { href: '#story', label: 'Über uns' },
        { href: '/bestellen', label: 'Speisekarte' },
        { href: '#galerie', label: 'Galerie' },
        { href: '#kontakt', label: 'Kontakt' },
      ]
    : [
        { href: '/', label: 'Start' },
        { href: '/bestellen', label: 'Speisekarte' },
        { href: '/#story', label: 'Über uns' },
        { href: '/#kontakt', label: 'Kontakt' },
      ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        solid
          ? 'bg-cream-50/95 backdrop-blur-md border-b border-charcoal-900/10'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo.png"
            alt="Luma Pizza"
            width={900}
            height={722}
            priority
            className="h-12 w-auto sm:h-14"
          />
          <div className="hidden sm:flex flex-col leading-none">
            <span
              className={`font-serif text-lg tracking-wide transition-colors ${
                solid ? 'text-charcoal-900' : 'text-cream-50'
              }`}
            >
              Luma Pizza
            </span>
            <span
              className={`text-[10px] uppercase tracking-widest transition-colors ${
                solid ? 'text-gold-600' : 'text-gold-400'
              }`}
            >
              Dietenhofen
            </span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-xs uppercase tracking-widest font-medium transition-colors ${
                solid
                  ? 'text-charcoal-700 hover:text-gold-600'
                  : 'text-cream-50/90 hover:text-gold-400'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <OpeningStatusBadge light={!solid} className="hidden lg:inline-flex" />
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/bestellen"
            className={`hidden sm:inline-flex items-center px-5 py-2.5 text-xs uppercase tracking-widest font-medium transition-all duration-300 ${
              solid
                ? 'bg-charcoal-900 text-cream-50 hover:bg-gold-600'
                : 'bg-gold-500 text-charcoal-900 hover:bg-gold-400'
            }`}
          >
            Jetzt bestellen
            {itemCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] bg-cream-50 text-charcoal-900 rounded-full">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Mobile burger */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className={`md:hidden p-2 -mr-2 transition-colors ${
              solid ? 'text-charcoal-900' : 'text-cream-50'
            }`}
            aria-label="Menü öffnen"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {mobileOpen ? (
                <path d="M6 6l12 12M6 18L18 6" />
              ) : (
                <>
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-cream-50 border-t border-charcoal-900/10">
          <div className="px-6 py-4 flex flex-col gap-1">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="py-3 text-sm uppercase tracking-widest text-charcoal-800 border-b border-charcoal-900/10 last:border-0"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/bestellen"
              onClick={() => setMobileOpen(false)}
              className="mt-3 btn-primary"
            >
              Jetzt bestellen {itemCount > 0 && `(${itemCount})`}
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
