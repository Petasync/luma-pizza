# Luma Pizza — Setup-Anleitung für die Demo

Schritt-für-Schritt von leerer `.env.local` bis Live-Demo auf Vercel.
Alle Test-Modes — kein echtes Geld, keine Domain nötig.

---

## 1. Supabase (Datenbank)

1. Auf https://supabase.com einloggen → **New project**
   - Name: `luma-pizza`
   - Region: **Frankfurt** (EU-Central-1)
   - DB-Passwort: speichern (brauchst du nicht direkt, aber gut zu haben)
2. Warten bis Projekt grün ist (~2 min)
3. **SQL-Editor** öffnen (links in der Sidebar) → **New query**
4. Inhalt von `supabase/migrations/001_orders.sql` rein-kopieren → **Run**
   - Sollte ohne Fehler durchlaufen. Wenn "publication supabase_realtime does not exist" kommt: die Zeile `alter publication supabase_realtime add table orders;` einzeln nochmal ausführen.
5. **Settings → API** → folgende Werte kopieren:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` (secret, **niemals client-seitig**) → `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Stripe (Karte + Klarna)

1. Auf https://dashboard.stripe.com registrieren
2. **Test-Mode** oben rechts einschalten (Toggle)
3. **Developers → API keys**:
   - `Publishable key` (`pk_test_...`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `Secret key` (`sk_test_...`) → `STRIPE_SECRET_KEY`
4. `STRIPE_WEBHOOK_SECRET` kannst du erstmal leer lassen — der Webhook ist im Plan optional und für die Demo nicht nötig.

**Test-Karten** (zum Vorführen):
- Erfolg: `4242 4242 4242 4242` — beliebiges Datum in der Zukunft, beliebiger CVC, beliebige PLZ
- Klarna: bei "Klarna" auswählen klappt's mit Stripes Klarna-Test-Account direkt

---

## 3. PayPal Sandbox

1. https://developer.paypal.com einloggen (mit normalem PayPal-Account, falls vorhanden — sonst registrieren)
2. **Apps & Credentials** → oben **Sandbox** (nicht Live) auswählen
3. **Create App** → Name: `Luma Pizza Demo` → Merchant
4. App öffnen → `Client ID` kopieren → `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
5. Secret (falls später Server-Calls dazukommen) → `PAYPAL_CLIENT_SECRET`

**Test-Kauf:** Mit einem Sandbox-Buyer-Account testen (developer.paypal.com → **Sandbox → Accounts**, da gibt's automatisch zwei Test-Accounts).

---

## 4. Resend (Bestätigungs-Mails)

1. https://resend.com registrieren (Free Tier reicht: 100 Mails/Tag)
2. **API Keys → Create API Key** → Name: `luma-pizza-dev` → `Full access`
3. Key kopieren → `RESEND_API_KEY`
4. **Wichtig für die Demo:** Der Code sendet von `onboarding@resend.dev` (Resends Test-Domain). Damit gehen Mails **nur an die Mail-Adresse, mit der du Resend angemeldet hast**. Für die Demo perfekt — du testest mit deiner eigenen Mail.
5. `RESTAURANT_EMAIL` = die Mail, an die "Neue Bestellung"-Benachrichtigungen gehen sollen (für die Demo: deine eigene)

Wenn der Kunde später live geht: eigene Domain bei Resend verifizieren → `from:` auf `bestellungen@luma-pizza.de` ändern in `lib/resend.ts`.

---

## 5. `.env.local` anlegen

Im Projekt-Root:

```powershell
Copy-Item .env.local.example .env.local
```

Dann `.env.local` öffnen und alle Werte eintragen. **Beispiel** (Werte sind Platzhalter):

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51N...
STRIPE_SECRET_KEY=sk_test_51N...
STRIPE_WEBHOOK_SECRET=

NEXT_PUBLIC_PAYPAL_CLIENT_ID=AYS...
PAYPAL_CLIENT_SECRET=EHa...

RESEND_API_KEY=re_abc...
RESTAURANT_EMAIL=phillipscheiderer@gmail.com

ADMIN_PASSWORD=demo2026

NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

`ADMIN_PASSWORD` ist frei wählbar — damit loggst du dich später auf `/admin` ein.

---

## 6. Lokal testen

```powershell
npm run dev
```

Dann:
- http://localhost:3000 — Homepage
- http://localhost:3000/bestellen — Speisekarte
- Bestellung durchlaufen: PLZ `90599` für Lieferung, Test-Karte `4242 4242 4242 4242`
- http://localhost:3000/admin → Passwort eingeben → Bestellung sichtbar + Status weiterklicken

---

## 7. Deploy zu Vercel (kostenlos)

### Erstmaliges Setup

```powershell
npm i -g vercel
vercel login
vercel
```

Im Wizard:
- Set up and deploy? **Yes**
- Which scope? Dein Account
- Link to existing project? **No**
- Project name: `luma-pizza`
- Directory: `.` (Enter)
- Override settings? **No**

Vercel baut + deployt. Du bekommst eine URL wie `luma-pizza-xxx.vercel.app`.

### Environment Variables setzen

```powershell
vercel env add NEXT_PUBLIC_SUPABASE_URL
# fragt nach Wert + Umgebung (Production/Preview/Development) — Production + Preview reichen
```

Das für **jede einzelne Variable** aus `.env.local` durchziehen. Schneller geht's im Web-Dashboard:

1. https://vercel.com/dashboard → Projekt `luma-pizza` → **Settings → Environment Variables**
2. Alle Variablen aus `.env.local` einfügen (Bulk-Paste-Feld oben)
3. Für `NEXT_PUBLIC_BASE_URL` den Vercel-Domain-Namen eintragen, z.B. `https://luma-pizza.vercel.app`

### Re-Deploy mit Env-Vars

```powershell
vercel --prod
```

Fertig. Die Demo läuft auf `https://luma-pizza.vercel.app` (oder die individuelle URL die Vercel dir gibt).

---

## 8. Was dem Kunden zeigen

1. **Speisekarte** durchklicken — Kategorien, Pizza-Größen, "+"-Button → Warenkorb füllt sich
2. **Bestellvorgang**: Zur Kasse → Lieferung 90599 → Kontaktdaten → Karte mit Test-Nummer
3. **Bestätigungsseite + Mail** (die geht an deine Mail, Live-Demo: Mailbox aufmachen)
4. **Admin-Dashboard**: `/admin` mit Passwort → Bestellung erscheint in **Echtzeit** während du die Demo machst → Status weiterklicken
5. **Mobile-Ansicht**: F12 → Phone-Modus → alles responsive

---

## 9. Wenn der Kunde zusagt

Was getauscht werden muss:

| Was | Wo |
|---|---|
| Echte Domain bei Vercel | Vercel → Settings → Domains |
| Stripe **Live-Mode** Keys | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| PayPal **Live** Client ID | `NEXT_PUBLIC_PAYPAL_CLIENT_ID` (App im Production-Mode anlegen) |
| Resend mit verifizierter Domain | `lib/resend.ts`: `from:` auf z.B. `bestellungen@luma-pizza.de` |
| Telefon/E-Mail in `app/impressum/page.tsx` und `app/datenschutz/page.tsx` | direkt im Code |
| Stripe Webhook (Empfehlung) | Stripe Dashboard → Webhooks → POST auf `/api/stripe/webhook` — Route muss noch implementiert werden |

Der Code-Change ist minimal — Großteil sind nur Environment Variables in Vercel.

---

## Troubleshooting

**"Cannot find module '@supabase/...'"** → `npm install` nochmal ausführen.

**Admin-Dashboard zeigt keine Bestellungen / kein Realtime** → Im Supabase Dashboard prüfen: **Database → Replication** → Tabelle `orders` muss in der `supabase_realtime` Publication sein. Wenn nicht: die letzte SQL-Zeile aus der Migration nochmal ausführen.

**Stripe "No such payment_intent"** → Du bist im Live-Mode statt Test-Mode (oder umgekehrt). Im Stripe-Dashboard oben rechts den Toggle prüfen.

**Mails kommen nicht an** → In Resend "Logs" prüfen. Wahrscheinlich Empfänger-Mail ≠ deine Resend-Account-Mail (mit `onboarding@resend.dev` als Absender geht's nur an die eigene).
