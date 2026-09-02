import Link from 'next/link'
import Image from 'next/image'
import OpeningStatusBadge from '@/components/opening-status'
import { getScheduleRows } from '@/lib/opening-hours'
import { DELIVERY_AREAS } from '@/lib/postal-codes'

export default function Footer() {
  const rows = getScheduleRows('delivery')
  const abholzeit = getScheduleRows('pickup')[0].hours
  return (
    <footer className="bg-charcoal-900 text-cream-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-4 mb-5">
              <Image
                src="/logo.png"
                alt="Luma Pizza"
                width={900}
                height={722}
                className="h-16 w-auto"
              />
              <div>
                <p className="font-serif text-xl">Luma Pizza</p>
                <p className="text-[10px] uppercase tracking-widest text-gold-400">Dietenhofen seit 2024</p>
              </div>
            </div>
            <p className="text-sm text-cream-100/70 leading-relaxed max-w-md mb-5">
              Frische Pizza aus dem Steinofen, hausgemachte Pasta und Burger nach
              Familienrezept. Direkt aus Dietenhofen — zum Abholen oder Liefern.
            </p>
            <OpeningStatusBadge light />
          </div>

          {/* Kontakt */}
          <div>
            <p className="text-xs uppercase tracking-widest text-gold-400 mb-4">Kontakt</p>
            <ul className="space-y-2 text-sm text-cream-100/80">
              <li>Warzfeldener Straße 1-3</li>
              <li>90599 Dietenhofen</li>
              <li className="pt-2">Tel: <a href="tel:+4915124882899" className="hover:text-gold-400">0151 24882899</a></li>
              <li><a href="mailto:info@luma-pizza.de" className="hover:text-gold-400">info@luma-pizza.de</a></li>
            </ul>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-xs uppercase tracking-widest text-gold-400 mb-4">Mehr</p>
            <ul className="space-y-2 text-sm text-cream-100/80">
              <li><Link href="/speisekarte" className="hover:text-gold-400">Speisekarte</Link></li>
              <li><Link href="/bestellen" className="hover:text-gold-400">Online bestellen</Link></li>
              <li><Link href="/liefergebiet" className="hover:text-gold-400">Liefergebiet &amp; Fragen</Link></li>
              <li><Link href="/#story" className="hover:text-gold-400">Über uns</Link></li>
              <li><Link href="/impressum" className="hover:text-gold-400">Impressum</Link></li>
              <li><Link href="/datenschutz" className="hover:text-gold-400">Datenschutz</Link></li>
            </ul>
          </div>
        </div>

        {/* Lieferzeiten + Lieferkosten */}
        <div className="mt-12 pt-8 border-t border-cream-100/10 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-gold-400 mb-4">Lieferzeiten</p>
            <ul className="space-y-1 text-sm text-cream-100/80">
              {rows.map(r => (
                <li key={r.day} className="flex justify-between max-w-sm">
                  <span>{r.day}</span>
                  <span className="tabular-nums">{r.hours}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-cream-100/60 mt-3">
              Abholung täglich ab <span className="tabular-nums">{abholzeit.split(' – ')[0]}</span> Uhr.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gold-400 mb-4">Lieferkosten</p>
            <p className="text-2xl font-serif text-gold-400">Gratis</p>
            <p className="text-xs text-cream-100/60 mt-1 leading-relaxed">
              Wir liefern nach {DELIVERY_AREAS.map(a => a.name).join(', ')} —{' '}
              <Link href="/liefergebiet" className="underline underline-offset-2 hover:text-gold-400">
                Details zum Liefergebiet
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-cream-100/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-cream-100/50">
          <p>© {new Date().getFullYear()} Luma Pizza. Alle Rechte vorbehalten.</p>
          <p className="tracking-wider uppercase">Mit Liebe gekocht.</p>
          <p>
            Website von{' '}
            <a
              href="https://petasync.de"
              target="_blank"
              rel="noopener"
              className="text-cream-100/70 hover:text-gold-400 transition-colors"
            >
              Petasync
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
