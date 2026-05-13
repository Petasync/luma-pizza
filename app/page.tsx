import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/navbar'
import DeliveryMarquee from '@/components/delivery-marquee'
import DeliveryBanner from '@/components/delivery-banner'
import { HERO_IMAGE, STORY_IMAGE, KITCHEN_IMAGE, GALLERY_IMAGES, getCategoryImage } from '@/lib/images'

const FEATURED_CATEGORIES = [
  { name: 'Pizza', subtitle: 'Hausgemacht im Steinofen', items: 15 },
  { name: 'Burger', subtitle: 'Saftig & herzhaft', items: 6 },
  { name: 'Pasta', subtitle: 'Italienische Klassiker', items: 7 },
] as const

const REVIEWS = [
  {
    text: 'Die beste Pizza, die ich seit langem gegessen habe. Der Teig ist perfekt — knusprig am Rand und luftig in der Mitte.',
    author: 'Sarah M.',
    rating: 5,
  },
  {
    text: 'Schnelle Lieferung, alles noch heiß. Die Pasta Carbonara ist ein Traum. Wir bestellen jetzt regelmäßig.',
    author: 'Thomas K.',
    rating: 5,
  },
  {
    text: 'Sehr freundlicher Service und herausragende Qualität. Hat sich gelohnt, Luma kennenzulernen.',
    author: 'Anna B.',
    rating: 5,
  },
] as const

export default function HomePage() {
  return (
    <>
      <Navbar transparent />

      {/* HERO */}
      <section className="relative h-screen min-h-[640px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={HERO_IMAGE}
            alt="Pizza aus dem Steinofen"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-charcoal-900/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal-900/40 via-transparent to-charcoal-900/80" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl animate-fade-in">
          <p className="eyebrow text-gold-400 mb-6">Pizzeria · Dietenhofen seit 2024</p>
          <h1 className="heading-serif text-5xl sm:text-6xl md:text-7xl text-cream-50 mb-6">
            Authentisch italienisch.<br />
            <span className="italic text-gold-400">Mit Leidenschaft gemacht.</span>
          </h1>
          <p className="text-cream-100/85 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Frische Pizza aus dem Steinofen, hausgemachte Pasta und herzhafte Burger.
            Bei uns vor Ort genießen, abholen oder direkt nach Hause liefern lassen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/bestellen" className="btn-gold">
              Jetzt bestellen
            </Link>
            <Link href="#speisekarte" className="btn-outline-light">
              Speisekarte ansehen
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-cream-50/60 text-xs uppercase tracking-widest flex flex-col items-center gap-2 animate-fade-in">
          <span>Mehr entdecken</span>
          <div className="w-px h-8 bg-gold-400/60"></div>
        </div>
      </section>

      {/* DELIVERY MARQUEE */}
      <DeliveryMarquee />

      {/* INFO STRIP */}
      <section className="bg-charcoal-900 text-cream-100 py-6 border-t border-gold-700/30">
        <div className="container-wide grid grid-cols-2 md:grid-cols-4 gap-6 px-4 sm:px-6 lg:px-12 text-center">
          <div>
            <p className="font-serif text-2xl text-gold-400">4,7</p>
            <p className="text-[11px] uppercase tracking-widest mt-1 text-cream-100/70">Sterne ★</p>
          </div>
          <div>
            <p className="font-serif text-2xl text-gold-400">0 €</p>
            <p className="text-[11px] uppercase tracking-widest mt-1 text-cream-100/70">Liefergebühr</p>
          </div>
          <div>
            <p className="font-serif text-2xl text-gold-400">~30 min</p>
            <p className="text-[11px] uppercase tracking-widest mt-1 text-cream-100/70">Lieferzeit</p>
          </div>
          <div>
            <p className="font-serif text-2xl text-gold-400">60+</p>
            <p className="text-[11px] uppercase tracking-widest mt-1 text-cream-100/70">Gerichte</p>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section id="story" className="section-padding">
        <div className="container-wide grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-[4/5] overflow-hidden">
            <Image
              src={STORY_IMAGE}
              alt="Pizza zubereiten"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="eyebrow mb-4">Unsere Geschichte</p>
            <h2 className="heading-serif text-4xl md:text-5xl mb-6">
              Tradition aus dem Herzen Italiens —<br />
              <span className="italic text-gold-600">nach Dietenhofen gebracht.</span>
            </h2>
            <p className="text-charcoal-700 leading-relaxed mb-5">
              Bei Luma Pizza vereinen wir italienische Kochkunst mit moderner
              Bestellfreundlichkeit. Jede Pizza wird frisch von Hand belegt und im
              Steinofen gebacken — der Teig fermentiert mindestens 24 Stunden für
              das perfekte Aroma.
            </p>
            <p className="text-charcoal-700 leading-relaxed mb-8">
              Wir glauben an ehrliche Zutaten, kurze Wege und herzliche Gastfreundschaft.
              Komm vorbei oder bestelle bequem nach Hause — wir freuen uns auf dich.
            </p>
            <Link href="/bestellen" className="btn-outline-dark">
              Speisekarte entdecken
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED MENU */}
      <section id="speisekarte" className="bg-cream-100 section-padding">
        <div className="container-wide">
          <div className="text-center mb-16">
            <p className="eyebrow mb-4">Aus unserer Küche</p>
            <h2 className="heading-serif text-4xl md:text-5xl mb-4">
              Was möchtest du heute genießen?
            </h2>
            <p className="text-charcoal-600 max-w-xl mx-auto">
              Über 60 Gerichte. Von der klassischen Margherita bis zum saftigen
              Double-Beef-Burger.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURED_CATEGORIES.map(cat => (
              <Link
                key={cat.name}
                href="/bestellen"
                className="group relative aspect-[4/5] overflow-hidden block"
              >
                <Image
                  src={getCategoryImage(cat.name)}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/90 via-charcoal-900/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-cream-50">
                  <p className="text-xs uppercase tracking-widest text-gold-400 mb-2">
                    {cat.items} Gerichte
                  </p>
                  <h3 className="font-serif text-3xl mb-2">{cat.name}</h3>
                  <p className="text-cream-100/80 text-sm mb-4">{cat.subtitle}</p>
                  <span className="text-xs uppercase tracking-widest border-b border-gold-400 pb-1">
                    Zur Auswahl →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/bestellen" className="btn-primary">
              Gesamte Speisekarte
            </Link>
          </div>
        </div>
      </section>

      {/* DELIVERY BANNER */}
      <DeliveryBanner />

      {/* KITCHEN / SECOND STORY */}
      <section className="section-padding">
        <div className="container-wide grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <p className="eyebrow mb-4">Unsere Küche</p>
            <h2 className="heading-serif text-4xl md:text-5xl mb-6">
              Frische, die du schmeckst.
            </h2>
            <ul className="space-y-4 text-charcoal-700">
              <li className="flex gap-4">
                <span className="font-serif text-gold-600 text-2xl">01</span>
                <div>
                  <p className="font-medium text-charcoal-900 mb-1">Hausgemachter Teig</p>
                  <p className="text-sm leading-relaxed">
                    24-Stunden-Fermentation für ein leichtes, bekömmliches Ergebnis.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="font-serif text-gold-600 text-2xl">02</span>
                <div>
                  <p className="font-medium text-charcoal-900 mb-1">Regionale Zutaten</p>
                  <p className="text-sm leading-relaxed">
                    Frisches Gemüse und Fleisch aus der Region, italienische Spezialitäten direkt vom Importeur.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="font-serif text-gold-600 text-2xl">03</span>
                <div>
                  <p className="font-medium text-charcoal-900 mb-1">Im Steinofen gebacken</p>
                  <p className="text-sm leading-relaxed">
                    Hohe Temperaturen, kurze Backzeit — so wie es sich gehört.
                  </p>
                </div>
              </li>
            </ul>
          </div>
          <div className="relative aspect-[4/5] order-1 lg:order-2 overflow-hidden">
            <Image
              src={KITCHEN_IMAGE}
              alt="Unsere Küche"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="bg-charcoal-900 text-cream-100 section-padding">
        <div className="container-wide">
          <div className="text-center mb-16">
            <p className="eyebrow mb-4">Was Gäste sagen</p>
            <h2 className="heading-serif text-4xl md:text-5xl text-cream-50">
              4,7 von 5 Sternen.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {REVIEWS.map((r, i) => (
              <div key={i} className="border border-cream-100/15 p-8">
                <div className="text-gold-400 text-xl mb-4 tracking-widest">
                  {'★'.repeat(r.rating)}
                </div>
                <p className="text-cream-100/85 leading-relaxed mb-6 italic">
                  &laquo;{r.text}&raquo;
                </p>
                <p className="text-xs uppercase tracking-widest text-gold-400">
                  — {r.author}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="galerie" className="section-padding">
        <div className="container-wide">
          <div className="text-center mb-12">
            <p className="eyebrow mb-4">Galerie</p>
            <h2 className="heading-serif text-4xl md:text-5xl">
              Direkt aus unserer Küche.
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {GALLERY_IMAGES.map((src, i) => (
              <div key={i} className="relative aspect-square overflow-hidden group">
                <Image
                  src={src}
                  alt={`Galerie ${i + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="kontakt" className="bg-cream-100 section-padding">
        <div className="container-wide grid lg:grid-cols-2 gap-16">
          <div>
            <p className="eyebrow mb-4">Besuche uns</p>
            <h2 className="heading-serif text-4xl md:text-5xl mb-8">
              Wir freuen uns auf dich.
            </h2>

            <div className="space-y-8">
              <div>
                <p className="text-xs uppercase tracking-widest text-gold-600 mb-2">Adresse</p>
                <p className="text-charcoal-800 leading-relaxed">
                  Warzfeldener Straße 1-3<br />
                  90599 Dietenhofen
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-gold-600 mb-2">Öffnungszeiten</p>
                <ul className="text-charcoal-800 space-y-1">
                  <li className="flex justify-between max-w-xs">
                    <span>Montag – Donnerstag</span>
                    <span>11:00 – 22:00</span>
                  </li>
                  <li className="flex justify-between max-w-xs">
                    <span>Freitag – Samstag</span>
                    <span>11:00 – 23:00</span>
                  </li>
                  <li className="flex justify-between max-w-xs">
                    <span>Sonntag</span>
                    <span>12:00 – 22:00</span>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-gold-600 mb-2">Kontakt</p>
                <p className="text-charcoal-800">
                  Telefon: <span className="font-medium">(noch eintragen)</span><br />
                  E-Mail: <a href="mailto:info@luma-pizza.de" className="hover:text-gold-600">info@luma-pizza.de</a>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="bg-charcoal-900 text-cream-50 p-10">
              <p className="eyebrow text-gold-400 mb-4">Bereit zu bestellen?</p>
              <h3 className="heading-serif text-3xl mb-6">
                Heute Abend Pizza?
              </h3>
              <p className="text-cream-100/80 leading-relaxed mb-8">
                Online bestellen, bezahlen und liefern lassen — oder zur Abholung
                vorbeikommen. Dein Essen ist in ca. 30 Minuten bereit.
              </p>
              <Link href="/bestellen" className="btn-gold w-full sm:w-auto">
                Online bestellen
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
