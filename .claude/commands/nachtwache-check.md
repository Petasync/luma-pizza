---
description: Prüfen ob der nächtliche 4-Uhr-Zahlungsabgleich sauber gelaufen ist
---

Prüfe, ob die Nachtwache (`/api/cron/nachtwache`, Vercel-Cron `0 4 * * *`
aus `vercel.json` — Vercel-Crons laufen in **UTC**, also 5/6 Uhr deutscher
Zeit) in den letzten 24 Stunden sauber gelaufen ist. Hintergrund: Ein still
ausgefallener Cron fällt heute niemandem auf — die Nachtwache mailt nur bei
Auffälligkeiten, Schweigen kann also auch "tot" bedeuten.

## 1. Vercel: Ist der Cron überhaupt gelaufen? (primäre Quelle)

Mit den Vercel-Tools (Plugin installiert; Projekt `luma-pizza`):
- Runtime-Logs der letzten 24 h für den Pfad `/api/cron/nachtwache` holen
  (`get_runtime_logs`, notfalls `get_runtime_errors`).
- Erwartung: genau **eine** Ausführung um 04:00 UTC mit HTTP **200**.
- Statuscodes deuten (siehe `app/api/cron/nachtwache/route.ts`):
  - **401** → `CRON_SECRET` stimmt nicht (Vercel schickt ihn als
    `Authorization: Bearer …`)
  - **500** → `CRON_SECRET` fehlt ODER Supabase nicht erreichbar
    (möglicherweise pausiertes Gratis-Projekt — das ist der Ernstfall,
    dann speichert auch keine Bestellung mehr)
  - keine Ausführung → Cron in Vercel prüfen (`vercel.json` deployt?)

## 2. Supabase: Hat der Abgleich Spuren hinterlassen?

Die Nachtwache schreibt **keine eigene Log-Tabelle** — sie arbeitet auf
`orders` und mailt nur bei 🚨 (Resend, `sendeNachtwacheBericht`). Ihre
Arbeit ist indirekt messbar (Supabase-Tools, nur lesend, `execute_sql`):

- **Schritt "Aufräumen" gelaufen?** Vormerkungen älter als 24 h dürfen
  nicht mehr auf `pending` stehen (sie werden nach Prüfung beim
  Zahlungsdienst auf `failed` oder `paid` gestellt):
  ```sql
  select count(*) from orders
  where payment_status = 'pending'
    and payment_method <> 'cash'
    and created_at < now() - interval '24 hours';
  ```
  Erwartung **0**. Größer 0 → Nachtwache lief nicht durch oder die
  Zahlungsdienst-Prüfung schlug fehl (dann fasst sie bewusst nichts an).

- **Schritt "Nachversand" gelaufen?** Bezahlte Bestellungen ohne
  verschickte Bestätigung sollten aufgearbeitet sein:
  ```sql
  select count(*) from orders
  where payment_status = 'paid'
    and benachrichtigt_am is null
    and created_at > now() - interval '7 days';
  ```
  Erwartung **0** (bzw. nur brandneue Bestellungen von heute).

- Wichtig bei der Deutung: **0 Treffer beweist nicht, dass sie lief** —
  vielleicht gab es schlicht nichts zu tun. Deshalb zählt Schritt 1
  (Vercel-Logs) als primärer Beweis; die SQL-Abfragen decken den
  umgekehrten Fall auf (Cron meldet 200, hat aber liegen gelassen).

## 3. Ergebnis melden

Ein klares Urteil mit Belegen:
- ✅ **gelaufen** — 200 um 04:00 UTC, keine Altlasten in `orders`
- ⚠️ **gelaufen mit Auffälligkeiten** — Meldungen/Altlasten auflisten
  (die Route gibt `{ ok, bestellungenGesamt, meldungen }` zurück; bei 🚨
  ging zusätzlich eine Mail raus)
- ❌ **nicht gelaufen / Fehler** — Statuscode + wahrscheinliche Ursache
  (CRON_SECRET, pausiertes Supabase-Projekt, Cron nicht deployt) und was
  jetzt zu tun ist
