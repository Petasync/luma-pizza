import type { MetadataRoute } from 'next'

// PWA-Manifest: Seite kann am Handy zum Homescreen hinzugefügt werden.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Luma Pizza',
    short_name: 'Luma Pizza',
    description: 'Frische Pizza aus Dietenhofen — online bestellen, abholen oder liefern lassen.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FBF8F1',
    theme_color: '#1A1612',
    lang: 'de',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
    categories: ['food', 'restaurants', 'shopping'],
  }
}
