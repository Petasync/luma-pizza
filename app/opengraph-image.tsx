import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Luma Pizza — Authentisch italienisch, frisch zubereitet'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Wird zur Build-Zeit / on-demand als 1200×630-PNG ausgespielt und automatisch
// von Next.js als og:image / twitter:image referenziert. WhatsApp, iMessage,
// Slack & Co. zeigen damit eine schöne Markenkarte statt eines leeren Previews.
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#1A1612',
          color: '#FBF8F1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'serif',
          padding: 80,
          position: 'relative',
        }}
      >
        {/* Gold-Rahmen für editorialen Look */}
        <div
          style={{
            position: 'absolute',
            inset: 40,
            border: '2px solid #C4A063',
            display: 'flex',
          }}
        />

        {/* "L"-Monogramm */}
        <div
          style={{
            width: 130,
            height: 130,
            border: '3px solid #C4A063',
            color: '#C4A063',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 90,
            marginBottom: 50,
          }}
        >
          L
        </div>

        <div
          style={{
            color: '#C4A063',
            fontSize: 22,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            marginBottom: 18,
            display: 'flex',
          }}
        >
          Pizzeria · Dietenhofen
        </div>

        <div
          style={{
            fontSize: 92,
            lineHeight: 1,
            marginBottom: 22,
            display: 'flex',
          }}
        >
          Luma Pizza
        </div>

        <div
          style={{
            fontSize: 30,
            color: 'rgba(251, 248, 241, 0.75)',
            maxWidth: 880,
            textAlign: 'center',
            fontStyle: 'italic',
            display: 'flex',
          }}
        >
          Frische Pizza aus dem Steinofen, hausgemachte Pasta & Burger.
        </div>
      </div>
    ),
    size,
  )
}
