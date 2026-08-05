import { ALLERGENE, ZUSATZSTOFFE, ALLERGENE_FREIGEGEBEN } from '@/lib/allergene'

/**
 * Zeigt entweder die Legende zu den Kennbuchstaben (sobald die Angaben
 * freigegeben sind) oder einen ehrlichen Hinweis, wie man an die Auskunft
 * kommt. Beides steht direkt bei der Speisekarte — dort wird gesucht.
 */
export default function AllergenHinweis({ className = '' }: { className?: string }) {
  if (!ALLERGENE_FREIGEGEBEN) {
    return (
      <div className={`border border-charcoal-900/10 bg-cream-100 p-5 text-sm ${className}`}>
        <p className="text-xs uppercase tracking-widest text-gold-600 mb-2">
          Allergene &amp; Unverträglichkeiten
        </p>
        <p className="text-charcoal-700 leading-relaxed">
          Wenn du eine Allergie oder Unverträglichkeit hast, ruf uns bitte vor der
          Bestellung kurz an —{' '}
          <a href="tel:+4915124882899" className="font-medium text-gold-600 hover:underline">
            0151 24882899
          </a>
          . Wir sagen dir genau, was in jedem Gericht steckt. Die vollständige
          Kennzeichnung auf der Speisekarte bereiten wir gerade vor.
        </p>
      </div>
    )
  }

  return (
    <details className={`border border-charcoal-900/10 bg-cream-100 p-5 text-sm ${className}`}>
      <summary className="cursor-pointer text-xs uppercase tracking-widest text-gold-600">
        Allergene &amp; Zusatzstoffe — was die Kennzeichen bedeuten
      </summary>
      <div className="mt-4 grid sm:grid-cols-2 gap-x-8 gap-y-1 text-charcoal-700">
        {(Object.keys(ALLERGENE) as (keyof typeof ALLERGENE)[]).map(code => (
          <p key={code}>
            <span className="font-medium text-charcoal-900">{code}</span> — {ALLERGENE[code]}
          </p>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-charcoal-900/10 grid sm:grid-cols-2 gap-x-8 gap-y-1 text-charcoal-700">
        {(Object.keys(ZUSATZSTOFFE) as unknown as (keyof typeof ZUSATZSTOFFE)[]).map(code => (
          <p key={code}>
            <span className="font-medium text-charcoal-900">{code}</span> — {ZUSATZSTOFFE[code]}
          </p>
        ))}
      </div>
      <p className="mt-4 text-xs text-charcoal-500">
        Bei Fragen zu Allergien rufen Sie uns bitte an:{' '}
        <a href="tel:+4915124882899" className="text-gold-600 hover:underline">0151 24882899</a>.
      </p>
    </details>
  )
}
