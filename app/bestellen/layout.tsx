import type { Metadata } from 'next'

// app/bestellen/page.tsx ist eine 'use client'-Komponente und kann daher kein
// eigenes `metadata` exportieren (das geht nur in Server Components) — deshalb
// hier auf Ebene des Route-Segments, das die Seite unverändert weiterreicht.
export const metadata: Metadata = {
  title: 'Speisekarte & online bestellen — Luma Pizza Dietenhofen',
  description: 'Über 60 hausgemachte Gerichte aus Dietenhofen: Pizza, Burger, Pasta und mehr. Jetzt online bestellen — zur Lieferung oder Abholung.',
  alternates: { canonical: '/bestellen' },
  openGraph: {
    title: 'Speisekarte & online bestellen — Luma Pizza Dietenhofen',
    description: 'Über 60 hausgemachte Gerichte aus Dietenhofen: Pizza, Burger, Pasta und mehr. Jetzt online bestellen.',
    url: 'https://www.luma-pizza.de/bestellen',
  },
}

export default function BestellenLayout({ children }: { children: React.ReactNode }) {
  return children
}
