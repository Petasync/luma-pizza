# Luma Pizza — Handoff für neue Claude-Session

> **Wenn du das hier als Claude liest:** Du übernimmst ein laufendes Projekt. Lies dieses Dokument zuerst komplett, dann `SETUP.md`. Erst danach Code anschauen oder Änderungen machen.

---

## 1. Was ist Luma Pizza?

Eine vollwertige **Restaurant-Webseite + Online-Bestellsystem** für die Pizzeria "Luma Pizza" in Dietenhofen (90599, Bayern). Die Seite dient zwei Zwecken:

1. **Marketing-Webseite** — Restaurant präsentieren (Hero, Story, Galerie, Reviews, Kontakt)
2. **Bestellsystem** — Online-Karte mit Warenkorb, Checkout, Stripe/PayPal/Bar-Zahlung, Bestätigungs-Mails
3. **Admin-Dashboard** — Restaurant-Inhaber sieht Bestellungen in Echtzeit, mit Priority-Tracking, Zeit-im-Status, Tagesumsatz-Chart

Das Projekt ist eine **Demo** für den Kunden (Inhaber Kadir Kizisar). Wenn der Kunde zusagt, werden die Test-API-Keys gegen Live-Keys getauscht und eine eigene Domain konfiguriert. Bis dahin läuft alles in Test/Sandbox-Mode.

**Restaurant-Adresse:** Warzfeldener Straße 1-3, 90599 Dietenhofen.

---

## 2. Tech-Stack

| Layer | Tech | Notes |
|---|---|---|
| Frontend | Next.js 14 (App Router) | TypeScript, React 18 |
| Styling | Tailwind CSS | Custom Cream/Gold/Charcoal-Palette, Playfair Display + Inter |
| DB | Supabase Postgres | Tabelle `orders`, Realtime aktiv |
| Auth (Admin) | Cookie + Middleware-PW-Gate | `ADMIN_PASSWORD` env var, kein User-System |
| Payments | Stripe (Karte/Klarna) + PayPal SDK + Bar | Test-Mode / Sandbox |
| Email | Resend | Sender: `onboarding@resend.dev` (Demo) |
| Tests | Jest + React Testing Library | `__tests__/` |
| Hosting | (noch nicht deployed) | Geplant: Vercel free tier |

---

## 3. Wo wir gerade stehen

### ✅ Fertig

- Komplettes Projekt-Scaffold (package.json, tsconfig, jest, etc.)
- DB Schema (3 Migrationen: orders + RLS-Policies + status_changed_at)
- Komplette Restaurant-Homepage mit Hero/Story/Galerie/Reviews/Kontakt
- Bestellen-Seite mit Foto-Karten (Unsplash CDN) ohne Emojis
- Multi-Step Checkout (Lieferung→Kontakt→Zahlung) mit Stripe (gefixt), PayPal-Sandbox, Bar
- Bestätigungs-Seite, Impressum, Datenschutz, Footer
- Admin-Dashboard mit Stats-Header, Tagesumsatz-Chart, Priority-Badges, Zeit-im-Status, Filter
- 11 Lieferorte im Umkreis Dietenhofen (`lib/postal-codes.ts`)
- Delivery-Marquee + Delivery-Banner Komponenten
- 10/10 Tests grün, `npm run build` erfolgreich

### 🟢 Live-Status (Stand 2026-06-01)

Die Seite ist **live und produktionsreif** unter `https://www.luma-pizza.de`
(www = Hauptvariante). `main` deployt automatisch über Vercel.

- ✅ Telefonnummer (0151 24882899) überall eingetragen (Footer, Impressum, Homepage, JSON-LD)
- ✅ Admin-Passwort in Vercel (Production) auf sicheren Wert gesetzt
- ✅ Resend-Domain verifiziert, Absender `bestellungen@luma-pizza.de` — Mails gehen raus
- ✅ PayPal **live** mit Production-Keys, Zahlung getestet
- ✅ GitHub-Token widerrufen
- ✅ Server-seitige Preise + Zahlungsverifikation (Stripe/PayPal) + Replay-Schutz
- ✅ Öffnungszeiten zentral (`lib/opening-hours.ts`), Bestellungen außerhalb serverseitig gesperrt
- ✅ SEO (sitemap/robots/JSON-LD/OG), PWA-Manifest, Live-Bestelltracker, 25/25 Tests grün

### ⚠️ Noch offen

1. **DSGVO-AVVs** mit Vercel/Supabase/Resend abschließen (organisatorisch, kein Code) — siehe `GO-LIVE.md`.
2. **Lieferorte** — aktuell 11 PLZ in `lib/postal-codes.ts`; bei Bedarf mit Kunden final abstimmen.
3. **Echte Produktfotos** statt Unsplash (`lib/images.ts`) — optional.
4. **Notification-Sound im Admin** — Code referenziert `/notification.mp3`, Datei fehlt. Aktuell try/catch — Admin funktioniert auch ohne Sound.

---

## 4. Wichtige Datei-Locations

```
luma-pizza/
├── app/
│   ├── page.tsx                    # Restaurant-Homepage (Hero + alle Sektionen)
│   ├── bestellen/page.tsx          # Speisekarte mit Cart-Sidebar
│   ├── checkout/page.tsx           # 3-Step-Checkout
│   ├── bestellung/[id]/page.tsx    # Bestätigung
│   ├── admin/                      # Admin-Bereich (passwortgeschützt via middleware.ts)
│   │   ├── page.tsx                # Dashboard mit Stats, Chart, Orders
│   │   ├── login/page.tsx
│   │   └── bestellungen/[id]/page.tsx
│   └── api/
│       ├── orders/route.ts         # POST = neue Bestellung (mit Resend-Mail)
│       ├── orders/[id]/route.ts    # PATCH = Status-Update
│       ├── stripe/create-intent/   # PaymentIntent erzeugen
│       └── admin/login/route.ts
├── components/
│   ├── navbar.tsx                  # Sticky, transparent auf Homepage
│   ├── footer.tsx
│   ├── delivery-marquee.tsx        # Endlos-Scroll mit Orten
│   ├── delivery-banner.tsx         # Große "Jetzt auch lieferbar"-Sektion
│   ├── cart/, menu/, checkout/, admin/
├── lib/
│   ├── menu.ts                     # Komplette Speisekarte hardcoded (60+ Items)
│   ├── images.ts                   # Unsplash-URLs pro Kategorie/Item
│   ├── postal-codes.ts             # Liefergebiet — 18 Orte um Dietenhofen
│   ├── order-priority.ts           # Priority-Berechnung, Zeit-Helpers, Revenue-Aggregation
│   ├── stripe.ts, resend.ts, supabase-server.ts, supabase-browser.ts
│   └── types.ts                    # Order, MenuItem, CartItem etc.
├── middleware.ts                   # Admin-PW-Gate (Cookie-Check)
├── supabase/migrations/
│   ├── 001_orders.sql              # Tabelle + RLS (nur service_role)
│   ├── 002_admin_rls.sql           # SELECT/UPDATE für anon (Admin Browser-Reads)
│   └── 003_status_tracking.sql     # status_changed_at column
├── __tests__/                      # Jest tests (postal-codes, cart reducer)
├── .env.local.example              # Template — echte .env.local NICHT im Repo
├── SETUP.md                        # Schritt-für-Schritt-Anleitung Demo-Setup
└── HANDOFF.md                      # ← du liest gerade
```

---

## 5. Design-System

| Token | Wert | Verwendung |
|---|---|---|
| `cream-50` | `#FBF8F1` | Haupt-Hintergrund |
| `cream-100` | `#F7F2E8` | Sektionen, alternierend |
| `cream-200` | `#EFE7D4` | Disabled-States |
| `charcoal-900` | `#1A1612` | Text + dunkle Sektionen |
| `gold-500` | `#C4A063` | Primary Accent, Preise, CTAs |
| `gold-400` | `#D4B36A` | Eyebrows auf dunklem Grund |
| `wine-600` | `#7A2E2A` | Fehler, "scharf"-Tag, "Dringend" |

- **Headings:** Playfair Display (Serif, elegant)
- **Body:** Inter (Sans, modern)
- **Eyebrows:** `text-xs uppercase tracking-widest text-gold-600` (Klasse `.eyebrow`)
- **Buttons:** `.btn-primary`, `.btn-gold`, `.btn-outline-dark`, `.btn-outline-light` (in `app/globals.css`)
- **Border-Radius:** sehr klein (2-6px), nie pill — soll editorial/Restaurant wirken, nicht SaaS

**Bewusste Designprinzipien:**
- Keine Emojis im Customer-UI (nur funktional in Admin-Statusbadges)
- Statt lila/pink: Cream + Charcoal + Gold (Barnea-Group inspiriert)
- Große Food-Fotos, viel Weißraum
- Mehrere "Bestellen"-CTAs über die Seite verteilt

---

## 6. Wie du an einem neuen PC weitermachst

### Voraussetzungen
- Node.js 20+ (`node --version`)
- Git
- Zugriff auf das GitHub-Repo (privat unter Account `Petasync`)
- Die `.env.local`-Werte (siehe unten — die liegen NICHT im Repo)

### Schritte

```powershell
git clone https://github.com/Petasync/luma-pizza.git
cd luma-pizza
npm install
Copy-Item .env.local.example .env.local
# .env.local mit den echten Werten füllen (siehe Abschnitt 7 unten)
npm run dev
```

Dann http://localhost:3000 öffnen.

Tests: `npx jest` — sollten alle 10 grün sein.
Build: `npm run build` — sollte ohne Errors durchlaufen.

---

## 7. Environment Variables — wo sie herkommen

**`.env.local`** (lokal, nie committen) braucht:

| Variable | Wo herholen | Hinweis |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → Data API → Project URL | **Ohne** `/rest/v1/` am Ende! Nur `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → Data API → anon public | |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → Data API → service_role | NIEMALS client-seitig nutzen! |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys → Test-Mode | `pk_test_...` |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys → Test-Mode | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | (optional, leer lassen) | Demo braucht's nicht |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | developer.paypal.com → Apps → Sandbox | Aktuell Platzhalter |
| `PAYPAL_CLIENT_SECRET` | developer.paypal.com | Aktuell Platzhalter |
| `RESEND_API_KEY` | resend.com → API Keys | |
| `RESTAURANT_EMAIL` | Frei wählbar | Mit `onboarding@resend.dev` als Absender geht's **nur an die Resend-Account-Email** |
| `ADMIN_PASSWORD` | Frei wählbar | Z.B. `demo2026` — wird für `/admin`-Login verwendet |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` lokal, später Vercel-URL | |

Vollständiger Setup-Walkthrough für die externen Dienste: **`SETUP.md`** im Projekt-Root.

---

## 8. Supabase — wichtig zu wissen

- Drei Migrations in `supabase/migrations/` — wenn du eine neue Supabase-DB anlegst, **alle drei der Reihe nach** im SQL Editor ausführen.
- RLS ist scharfgeschaltet. `service_role` hat Vollzugriff (API-Routes nutzen das). `anon` darf via separate Policy SELECT + UPDATE (für Admin-Dashboard im Browser + Realtime). Die `/admin`-Route ist eh durch Middleware-PW geschützt.
- Realtime ist auf der `orders`-Tabelle aktiv. Neue Bestellungen erscheinen im Admin sofort ohne Reload.

---

## 9. User-Profil & Kommunikationsstil

- **User:** Phillip Scheiderer (phillipscheiderer@gmail.com) — arbeitet unter Firma "Petasync" für den Endkunden Luma Pizza
- Sprache: **Deutsch**, knapper Stil, direkte Antworten bevorzugt
- Will autonome Ausführung, nicht jeden Schritt einzeln bestätigen lassen
- Kann selbst Supabase/Stripe-Accounts anlegen, will aber bei größeren Designentscheidungen einbezogen werden (z.B. Farben, Layout-Referenzen)
- Wenn ein Bug auftaucht: Screenshot/Console-Log kommt vom User, dann analysieren und fixen
- Wenn unklar wo's hängt: immer **erst Server-Log + Browser-Console** lesen, nicht raten

---

## 10. Was als Nächstes ansteht (Vorschlag)

Reihenfolge wie du sie angehen würdest, wenn nichts Neues vom User kommt:

1. **Customer-Domain-Daten klären** (Telefon-Nr., E-Mail, Öffnungszeiten falls anders) → in `app/page.tsx` (Kontakt-Sektion), `app/impressum/page.tsx`, `app/datenschutz/page.tsx`, `components/footer.tsx` einsetzen
2. **Eigene Restaurant-Fotos** statt Unsplash → URLs in `lib/images.ts` tauschen
3. **Vercel-Deploy** → siehe `SETUP.md` Schritt 7. Free Tier reicht. URL z.B. `luma-pizza.vercel.app`. Env-Vars im Vercel-Dashboard pflegen.
4. **PayPal-Sandbox einrichten** falls Kunde PayPal anbieten will (Component ist fertig, nur Keys fehlen)
5. **Resend mit verifizierter Domain** sobald Kunde Domain hat → Absender in `lib/resend.ts` von `onboarding@resend.dev` auf z.B. `bestellungen@luma-pizza.de`
6. **Echte Lieferorte/PLZs final klären** → `lib/postal-codes.ts`
7. **Stripe-Webhook für Reconciliation** (nice-to-have, nicht Demo-blocker)

---

## 11. Git-Workflow

- Branch `main` ist aktiv
- Commits sind in Conventional-Commit-Style (`feat:`, `fix:`, `chore:`, `docs:`)
- Vor Commit immer `npx jest` + `npm run build` durchlaufen lassen
- Bei Pre-Commit-Hook-Fehlern niemals `--no-verify` benutzen — Root-Cause fixen
- `.env.local` ist gitignored — niemals committen

---

## 12. Letzter Stand der Konversation (2026-06-01)

Seite ist live. In dieser Session umgesetzt und nach `main` gepusht (deployt):
- ✅ **Speisekarte-Scroll:** Klick auf eine Rubrik scrollt an den Menü-Anfang, statt am Seitenende zu klemmen, wenn eine kürzere Rubrik das Dokument schrumpft (`app/bestellen/page.tsx`, Anker mit `scroll-mt-20`)
- ✅ **Rubrik-Tabs:** brechen auf Desktop um (`md:flex-wrap`), auf Mobile Fade-Hinweis rechts + aktiver Tab wird in den sichtbaren Bereich zentriert (`components/menu/category-tabs.tsx`)
- ✅ **„Hinzufügen"-Button:** bricht bei schmalen Karten sauber um statt vom `overflow-hidden` der Karte abgeschnitten zu werden (`components/menu/menu-item-card.tsx`)
- ✅ **Liefergebiet:** Ansbach, Neuendettelsau, Heilsbronn entfernt (jetzt 11 Orte, `lib/postal-codes.ts`)
- ✅ **www-Vereinheitlichung:** alle absoluten URLs auf `https://www.luma-pizza.de` (Metadaten, OG, JSON-LD, Sitemap, robots.txt) — konsistent mit den E-Mail-Links
- ✅ **Live-Tracker:** stoppt das 8s-Polling, sobald `delivered` erreicht ist (`components/order-status-tracker.tsx`)

Review-Fazit: keine echten Bugs, Sicherheits-/SEO-/PWA-Architektur sauber. Einziger offener Punkt: DSGVO-AVVs (siehe `GO-LIVE.md`).

Wenn du übernimmst: User will direkt weitermachen, nicht erstmal alles re-evaluieren. Sofort agieren — fixen, bauen. **Push auf `main` = Live-Deploy**, daher vorher kurz bestätigen lassen. Bei größeren Designentscheidungen Rücksprache.
