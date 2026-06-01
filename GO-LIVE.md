# Luma Pizza — Go-Live Checkliste

Stand: 15.05.2026. Aktualisiert sich, sobald Punkte abgehakt sind.

---

## ✅ Erledigt

- **Deploys laufen** auf https://luma-pizza-petasyncs-projects.vercel.app/
  (GitHub-Repo public → Vercel Hobby baut ohne Restriktion).
- **Vercel-Deployment-Schutz** (SSO-Login-Wall) deaktiviert.
- **Supabase-Migrationen 004 + 005** angewendet (`paypal_order_id`-Spalte,
  Replay-Schutz-Indizes, RLS-Lockdown). Anon-Key liest keine Kundendaten mehr.
- **Bezahl-Sicherheit:** Server berechnet Preise selbst, verifiziert
  Stripe-/PayPal-Zahlungen serverseitig, Schutz gegen Zahlungs-Replay.
- **Admin-Login** mit HMAC-signiertem Session-Token statt Klartext-Cookie.
  `/api/orders/[id]` ist auth-geschützt.
- **Next.js** auf 14.2.35 (Middleware-Bypass-CVE gepatcht).
- **SEO:** robots.txt, sitemap.xml, Structured Data (Restaurant +
  vollständige Speisekarte mit Preisen), OpenGraph, Favicon, Meta-Tags.
- **Lieferzeiten** (Mo 17:00 – So 14:00, jeweils bis 23:15) als zentrale
  Quelle, Live-Status in Navbar/Footer/Homepage, **außerhalb der Zeiten
  serverseitig gesperrt** — kein versehentliches Zahlen außerhalb.
- **Voraussichtliche Lieferzeit** 30–45 Min. (Abholung 20–30 Min.) sichtbar.
- **Mindestbestellwert 15 €** für Lieferung — client + server.
- **Lieferkosten: Gratis** prominent im Footer.
- **OpenStreetMap-Karte** im Kontaktbereich (kein API-Key, kein Tracking).
- **PWA-Manifest** — Seite ist installierbar (Homescreen).
- **Live-Bestellstatus** für Kunden auf `/bestellung/[id]`: Stepper, pollt
  alle 8 s — Kunde sieht ohne Refresh wann seine Pizza im Ofen ist.
- **Vercel Analytics + Speed Insights** eingebunden (cookielos).
- **Custom 404-Seite** im Markenstil.
- **Datenschutz** komplett überarbeitet (Hosting, DB, Zahlungsanbieter,
  Resend, Analytics, OSM, Cookies, Speicherdauer, Rechte).

---

## ✅ Pflicht vor Go-Live — erledigt

1. **Telefonnummer** (0151 24882899) in Footer, Impressum, Homepage-Kontakt
   und LocalBusiness-Structured-Data eingetragen.
2. **Admin-Passwort** in Vercel (Production) auf einen sicheren Wert geändert.
3. **Domain** `www.luma-pizza.de` ist die Hauptvariante — alle absoluten URLs
   (Metadaten, Sitemap, robots.txt, E-Mail-Logo) zeigen darauf.
4. **GitHub-Token** widerrufen.

---

## ✅ Voller Betrieb — erledigt

### Resend-Mail (Bestellbestätigungen)
Domain `luma-pizza.de` verifiziert, `RESEND_API_KEY` in Vercel gesetzt.
Absender: `bestellungen@luma-pizza.de`. Bestätigungsmails gehen raus.

### PayPal
Live mit Production-Keys (`NEXT_PUBLIC_PAYPAL_CLIENT_ID` +
`PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE=live`). Zahlung getestet — funktioniert.

---

## 🟠 Offen

### AVVs (Auftragsverarbeitungsverträge) abschließen

Die Datenschutzerklärung listet die Auftragsverarbeiter — bitte mit jedem
einen AVV abschließen, da Pflicht laut DSGVO Art. 28:
- **Vercel** (Hosting)
- **Supabase** (Datenbank)
- **Stripe** (Zahlungen — eigene Verantwortung, AVV optional)
- **PayPal** (Zahlungen — eigene Verantwortung, AVV optional)
- **Resend** (E-Mail-Versand)

Jeder Anbieter hat einen Self-Service-AVV in den Account-Einstellungen.

---

## 💡 Optional / wenn gewünscht

- **Echte Produktfotos** ersetzen die Unsplash-Bilder (`lib/images.ts`).
- **Open-Graph-Bild** für Social-Media-Vorschau (`app/opengraph-image.png`).
- **Stripe-Webhook** für asynchrone Zahlungs-Updates (aktuell nicht nötig,
  weil wir synchron verifizieren).
- **Cookie-Banner** — eigentlich nicht erforderlich, da wir keine
  Tracking-Cookies setzen. Falls "sicher ist sicher": Klartext-Banner.

---

## 🔧 Wo werden Geschäftsregeln gepflegt?

| Setting | Datei |
|---|---|
| Lieferzeiten | `lib/opening-hours.ts` |
| Lieferzeit-Schätzung | `lib/business.ts` → `DELIVERY_ETA_MINUTES` |
| Mindestbestellwert | `lib/business.ts` → `MIN_ORDER_VALUE_DELIVERY` |
| Liefergebühr | `lib/business.ts` → `DELIVERY_FEE` (0 = gratis) |
| Liefergebiet (PLZ) | `lib/postal-codes.ts` |
| Speisekarte | `lib/menu.ts` |

Alle in einer Stelle — ein `git push` reicht zum Aktualisieren.
