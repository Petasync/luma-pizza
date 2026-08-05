'use client'
import { useState } from 'react'

/**
 * Karte, die erst nach aktivem Klick geladen wird.
 *
 * Ein direkt eingebettetes iframe würde beim reinen Seitenaufruf die IP-Adresse
 * jedes Besuchers an OpenStreetMap übertragen — ohne dass der Besucher das je
 * wollte. Deshalb zeigen wir zuerst eine Vorschau und laden die Karte erst,
 * wenn jemand sie wirklich sehen möchte. Nebeneffekt: Die Startseite lädt
 * schneller, weil das iframe beim ersten Aufruf komplett entfällt.
 */

const LAT = 49.3970650
const LON = 10.6887029
const EMBED_URL = `https://www.openstreetmap.org/export/embed.html?bbox=10.6837%2C49.3941%2C10.6937%2C49.4001&layer=mapnik&marker=${LAT}%2C${LON}`
const EXTERN_URL = `https://www.openstreetmap.org/?mlat=${LAT}&mlon=${LON}#map=18/${LAT}/${LON}`

export default function Karte() {
  const [geladen, setGeladen] = useState(false)

  return (
    <>
      <div className="aspect-[16/7] w-full border border-charcoal-900/10 bg-cream-50 overflow-hidden">
        {geladen ? (
          <iframe
            title="Luma Pizza, Warzfeldener Straße 1-3, Dietenhofen"
            src={EMBED_URL}
            loading="lazy"
            className="w-full h-full"
            style={{ border: 0 }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center gap-4 px-6 py-8 bg-cream-100">
            <div>
              <p className="eyebrow mb-2">So findest du uns</p>
              <p className="text-charcoal-800 leading-relaxed">
                Warzfeldener Straße 1-3, 90599 Dietenhofen
              </p>
            </div>
            <button type="button" onClick={() => setGeladen(true)} className="btn-outline-dark">
              Karte laden
            </button>
            <p className="text-xs text-charcoal-500 max-w-sm">
              Beim Laden wird eine Verbindung zu OpenStreetMap hergestellt und dabei
              deine IP-Adresse übertragen.
            </p>
          </div>
        )}
      </div>
      <p className="text-xs text-charcoal-500 mt-3 text-center">
        <a
          href={EXTERN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gold-600"
        >
          In größerer Karte ansehen ↗
        </a>
      </p>
    </>
  )
}
