import Link from 'next/link'
import { DELIVERY_AREAS } from '@/lib/postal-codes'
import { DELIVERY_ETA_MINUTES, formatEta } from '@/lib/business'

export default function DeliveryBanner() {
  return (
    <section className="relative bg-charcoal-900 text-cream-50 overflow-hidden">
      {/* Decorative gold strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gold-500" />

      <div className="container-wide px-4 sm:px-6 lg:px-12 py-14 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <p className="eyebrow text-gold-400 mb-3">Neu im Angebot</p>
          <h2 className="heading-serif text-4xl md:text-5xl mb-5">
            Jetzt auch <span className="italic text-gold-400">lieferbar.</span>
          </h2>
          <p className="text-cream-100/80 leading-relaxed mb-8 max-w-lg">
            Du musst nicht mehr selbst kommen — wir bringen dir Pizza, Burger und
            Pasta direkt nach Hause. Im gesamten Umkreis von <strong className="text-gold-400">bis&nbsp;zu&nbsp;15&nbsp;km</strong> um
            Dietenhofen, ohne Liefergebühr.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Link href="/bestellen" className="btn-gold">
              Jetzt liefern lassen
            </Link>
            <Link href="#kontakt" className="btn-outline-light">
              Liefergebiet prüfen
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-cream-100/15">
            <div>
              <p className="font-serif text-3xl text-gold-400">{formatEta(DELIVERY_ETA_MINUTES)}</p>
              <p className="text-[10px] uppercase tracking-widest mt-1 text-cream-100/60">Lieferzeit</p>
            </div>
            <div>
              <p className="font-serif text-3xl text-gold-400">0 €</p>
              <p className="text-[10px] uppercase tracking-widest mt-1 text-cream-100/60">Liefergebühr</p>
            </div>
            <div>
              <p className="font-serif text-3xl text-gold-400">{DELIVERY_AREAS.length}+</p>
              <p className="text-[10px] uppercase tracking-widest mt-1 text-cream-100/60">Orte</p>
            </div>
          </div>
        </div>

        {/* Delivery area grid */}
        <div>
          <p className="eyebrow text-gold-400 mb-4">Wir liefern nach</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
            {DELIVERY_AREAS.map(a => (
              <div key={a.postalCode} className="flex items-baseline gap-2 text-sm text-cream-100/85 border-b border-cream-100/10 pb-1.5">
                <span className="text-[10px] text-gold-400/70 font-mono">{a.postalCode}</span>
                <span className="truncate">{a.name}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-cream-100/50 mt-4 italic">
            Deine PLZ nicht dabei? Schreib uns — wir prüfen, ob Lieferung möglich ist.
          </p>
        </div>
      </div>
    </section>
  )
}
