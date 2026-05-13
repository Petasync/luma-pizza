import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-charcoal-900 text-cream-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 border border-gold-500 text-gold-500 flex items-center justify-center font-serif">
                L
              </div>
              <div>
                <p className="font-serif text-xl">Luma Pizza</p>
                <p className="text-[10px] uppercase tracking-widest text-gold-400">Dietenhofen seit 2024</p>
              </div>
            </div>
            <p className="text-sm text-cream-100/70 leading-relaxed max-w-md">
              Frische Pizza aus dem Steinofen, hausgemachte Pasta und Burger nach
              Familienrezept. Direkt aus Dietenhofen — zum Abholen oder Liefern.
            </p>
          </div>

          {/* Kontakt */}
          <div>
            <p className="text-xs uppercase tracking-widest text-gold-400 mb-4">Kontakt</p>
            <ul className="space-y-2 text-sm text-cream-100/80">
              <li>Warzfeldener Straße 1-3</li>
              <li>90599 Dietenhofen</li>
              <li className="pt-2">Tel: <a href="tel:+49000000000" className="hover:text-gold-400">(noch eintragen)</a></li>
              <li><a href="mailto:info@luma-pizza.de" className="hover:text-gold-400">info@luma-pizza.de</a></li>
            </ul>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-xs uppercase tracking-widest text-gold-400 mb-4">Mehr</p>
            <ul className="space-y-2 text-sm text-cream-100/80">
              <li><Link href="/bestellen" className="hover:text-gold-400">Speisekarte</Link></li>
              <li><Link href="/#story" className="hover:text-gold-400">Über uns</Link></li>
              <li><Link href="/#galerie" className="hover:text-gold-400">Galerie</Link></li>
              <li><Link href="/impressum" className="hover:text-gold-400">Impressum</Link></li>
              <li><Link href="/datenschutz" className="hover:text-gold-400">Datenschutz</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-cream-100/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-cream-100/50">
          <p>© {new Date().getFullYear()} Luma Pizza. Alle Rechte vorbehalten.</p>
          <p className="tracking-wider uppercase">Mit Liebe gekocht.</p>
        </div>
      </div>
    </footer>
  )
}
