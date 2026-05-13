# Luma Pizza — Website Design Spec

**Datum:** 2026-05-12  
**Status:** Approved

---

## Kontext

Luma Pizza (Warzfeldener Straße 1-3, 90599 Dietenhofen) ist aktuell nur auf Lieferando aktiv. Ziel ist eine eigene Website mit vollständigem Online-Bestellsystem inkl. Direktzahlung — unabhängig von Lieferando, ohne Provisionen. Kunden sollen sowohl Lieferung als auch Abholung wählen können.

---

## Tech-Stack

| Komponente | Technologie |
|---|---|
| Framework | Next.js 14 (App Router) |
| Datenbank + Realtime | Supabase (PostgreSQL) |
| Kartenzahlung + Klarna | Stripe Payment Element |
| PayPal | PayPal JS SDK |
| E-Mail | Resend |
| Hosting | Vercel |
| Domain | Noch zu kaufen (z.B. luma-pizza.de) |

---

## Seiten & Routen

### Öffentlich

| Route | Beschreibung |
|---|---|
| `/` | Startseite: Hero, Adresse, Öffnungszeiten (vom Restaurant bereitzustellen), "Jetzt bestellen"-CTA |
| `/bestellen` | Speisekarte + fixierter Warenkorb (Sidebar rechts) |
| `/checkout` | Mehrstufiger Checkout-Flow |
| `/bestellung/[id]` | Bestellbestätigung nach erfolgreicher Zahlung |
| `/impressum` | Pflichtangaben (DSGVO) |
| `/datenschutz` | Datenschutzerklärung |

### Admin (passwortgeschützt via Next.js Middleware)

| Route | Beschreibung |
|---|---|
| `/admin` | Live-Dashboard: neue Bestellungen in Echtzeit |
| `/admin/bestellungen/[id]` | Detailansicht + Status-Verwaltung |

---

## Design & UI

- **Stil:** Professionell, klar, wenig verspielt — scharfe Ecken, keine übertriebenen Rundungen
- **Farben:** Lila (#7c3aed) als Primärfarbe, Orange (#f97316) als Akzent, weißer Hintergrund
- **Logo:** Platzhalter (violetter Kreis mit "L") — wird später durch echtes Logo ersetzt
- **Layout Speisekarte:** Zweipalten-Grid für Gerichte + fixierte Warenkorb-Sidebar rechts (Style A)
- **Kategorie-Navigation:** Horizontale Pill-Tabs (Pizza, Burger, Pasta, Fisch, Snacks, Schnitzel, Salate, Nachspeisen, Getränke)
- **Gerichtskarten:** Foto-Platzhalter (Emoji-Gradient), Name, Kurzbeschreibung, Preis, "+ hinzufügen"-Button

---

## Speisekarte

Hardcoded als TypeScript-Konstante (`lib/menu.ts`) — kein CMS. Kategorien und Artikel aus Lieferando übernommen:

**Kategorien:** Pizza (20), Fisch Gerichte (4), Suppen (2), Burger (6), Snacks (2), Schnitzel Gerichte (2), Beilagen (1), Pasta (7), Salate (2), Nachspeisen (4), Alkoholische Getränke (9), Alkoholfreie Getränke (13)

Pizzen haben Größenauswahl (26 cm / 30 cm mit unterschiedlichen Preisen — genaue Größen und Preise vom Restaurant zu bestätigen).

---

## Checkout-Flow (5 Schritte)

1. **Abholart** — Toggle: Lieferung oder Abholung
2. **PLZ-Prüfung** (nur bei Lieferung) — Prüfung gegen Whitelist erlaubter Postleitzahlen (initial: 90599)
3. **Kontaktdaten** — Name, E-Mail, Telefon; bei Lieferung: Straße + Hausnummer
4. **Zahlung wählen:**
   - Kreditkarte / Klarna → Stripe Payment Element
   - PayPal → PayPal JS SDK Button
   - Bar bei Lieferung/Abholung → kein Online-Payment, direkte Bestellbestätigung
5. **Bestätigung** → Weiterleitung auf `/bestellung/[id]`

---

## Datenbank (Supabase)

### Tabelle: `orders`

| Spalte | Typ | Beschreibung |
|---|---|---|
| id | uuid | Primärschlüssel |
| created_at | timestamp | Bestellzeitpunkt |
| status | enum | pending / confirmed / preparing / ready / delivered |
| type | enum | delivery / pickup |
| customer_name | text | |
| customer_email | text | |
| customer_phone | text | |
| delivery_address | text | Straße + Nr (nur bei Lieferung) |
| postal_code | text | |
| items | jsonb | Array der bestellten Artikel mit Menge + Preis |
| total_price | numeric | Gesamtbetrag in € |
| payment_method | enum | card / paypal / cash |
| payment_status | enum | pending / paid / failed |
| stripe_payment_intent_id | text | nullable |
| notes | text | Anmerkungen des Kunden |

---

## E-Mail-Benachrichtigungen (Resend)

- **Kunde:** Bestellbestätigung mit Artikelliste, Gesamtpreis, Abholzeit / voraussichtliche Lieferzeit
- **Restaurant:** Neue-Bestellung-Benachrichtigung mit allen Details (an E-Mail-Adresse des Restaurants)

---

## Admin-Dashboard

- Zugang via einfaches Passwort (`.env`-Variable `ADMIN_PASSWORD`), geprüft per Next.js Middleware — kein vollständiges Auth-System nötig
- Restaurant-E-Mail-Adresse muss als `RESTAURANT_EMAIL` in `.env` hinterlegt werden
- Bestellungen erscheinen sofort via **Supabase Realtime** ohne Seitenreload
- Status-Buttons: Bestätigt → In Zubereitung → Fertig → Geliefert/Abgeholt
- Akustisches Signal bei neuer Bestellung (Browser-Notification API)

---

## Deployment

1. Repository auf GitHub anlegen
2. Vercel-Projekt verbinden (automatisches Deployment bei Git-Push)
3. Supabase-Projekt anlegen, Tabellen erstellen
4. Stripe-Konto + PayPal-Konto einrichten
5. Resend-Konto + E-Mail-Domain verifizieren
6. Domain kaufen (z.B. luma-pizza.de) + in Vercel eintragen

---

## Verifikation

- Lokal: `npm run dev` → Bestellung aufgeben → Stripe Test-Karte 4242... → Bestätigung prüfen → Admin-Dashboard prüft Echtzeit-Update → E-Mail in Resend-Dashboard sichtbar
- Vor Go-Live: Echte Karte testen, PLZ-Prüfung testen, Mobile-Ansicht prüfen
