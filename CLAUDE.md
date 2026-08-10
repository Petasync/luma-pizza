# Luma Pizza — Website & Bestellsystem

Restaurant-Website mit Online-Bestellsystem für Luma Pizza (www.luma-pizza.de).
Hosting: Vercel — **jeder Push auf `main` deployt automatisch in Produktion.**

## Stack

- Next.js 15 (App Router), React 18, Tailwind CSS
- Supabase (Postgres, zentrale Tabelle `orders`), Stripe, Resend
- Tests: Jest (`npm test`, Konfig `jest.config.ts`)
- Paketmanager: npm (`package-lock.json`)
- Typecheck: `npx tsc --noEmit` · Lint: `npm run lint`

## Migrations-Regel (beide Stellen!)

Eine neue Supabase-Migration besteht immer aus **zwei** Änderungen:

1. `supabase/migrations/NNN_beschreibung.sql` — nächste freie Nummer (aktuell höchste nachsehen!)
2. Denselben SQL-Block **idempotent** ans Ende von `supabase/APPLY_IN_SUPABASE.sql` anhängen

Details und Muster: Skill `neue-migration`.

## Zahlungssicherheit = DAS Kernthema

Vorfall 26.07.2026: **51,50 € verloren** — eine Bestellung wurde ohne bestätigte
Zahlung angenommen. Seitdem gilt kompromisslos:

- Bestellstatus `paid` NUR nach serverseitig **verifizierter** Zahlung
  (Webhook-Signatur bzw. direkte Nachfrage bei Stripe/PayPal).
- Preise berechnet ausschließlich der Server (`lib/bestellung-pruefen.ts`,
  `lib/pricing.ts`) — niemals Beträge vom Client übernehmen.
- Stripe-Webhook-Handler: `app/api/stripe/webhook/route.ts` — die **Eintragung
  des Webhooks im Stripe-Dashboard ist noch offen**.
- PayPal wird gerade abgeschaltet (offene PR, Branch `fix/paypal-abschalten`).
- Nächtlicher Zahlungsabgleich: `/api/cron/nachtwache`, Vercel-Cron um 4 Uhr
  (`vercel.json`). Prüfung: Command `/nachtwache-check`.

Vor jedem Merge, der Zahlung, RLS oder Admin-Auth berührt: Subagent
`zahlungs-pruefer` laufen lassen.

## Vor Kundenterminen

`docs/kundentermin-checkliste.md` und `GO-LIVE.md` durchgehen —
das Command `/go-live` arbeitet beide automatisch ab.
