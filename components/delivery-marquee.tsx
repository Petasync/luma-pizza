import { DELIVERY_AREAS } from '@/lib/postal-codes'

/**
 * Endlos-Marquee mit allen Lieferorten. Performance-freundlich via CSS:
 * Wir rendern die Liste 2x und scrollen sie um -50% (eine Hälfte breit).
 */
export default function DeliveryMarquee() {
  const items = DELIVERY_AREAS.map(a => a.name)

  return (
    <div className="bg-gold-500 text-charcoal-900 overflow-hidden py-3 group border-y border-gold-700/20">
      <div className="flex items-center gap-12 whitespace-nowrap animate-marquee">
        {[...items, ...items, ...items].map((name, i) => (
          <span key={i} className="flex items-center gap-12 text-xs uppercase tracking-widest font-medium">
            <span className="inline-block w-1 h-1 bg-charcoal-900 rounded-full" />
            {name}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.3333%); }
        }
        .animate-marquee {
          animation: marquee 50s linear infinite;
          will-change: transform;
        }
        .group:hover .animate-marquee {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
