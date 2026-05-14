# Luma Pizza — Go-Live Checkliste

Stand: 15.05.2026. Diese Datei sagt dir genau, was noch fehlt, bevor die
Seite öffentlich gehen kann. Reihenfolge = Priorität.

---

## 🔴 1. Vercel-Deployments sind BLOCKED

**Problem:** Seit dem ersten erfolgreichen Deploy (vor ~5 h) landet **jedes**
neue Deployment im Status `BLOCKED` — es wird nie gebaut. Aktuell läuft live
noch der alte Stand ohne die heutigen Sicherheits-Fixes.

**Das kann ich nicht per CLI lösen — bitte du:**
1. Öffne https://vercel.com/petasyncs-projects/luma-pizza
2. Oben steht mit hoher Wahrscheinlichkeit ein **Banner / eine Meldung**,
   warum Deployments blockiert sind. Häufige Gründe beim Hobby-Plan:
   - Account muss verifiziert werden (Telefon/Zahlungsmethode)
   - Hobby-Plan erlaubt keine **kommerzielle** Nutzung → für eine echte
     Pizzeria brauchst du den **Pro-Plan** (~20 $/Monat)
   - Build-/Usage-Limit erreicht
3. Sobald das geklärt ist: in den Vercel-Settings einmal *Redeploy* auf den
   letzten `main`-Commit drücken — dann ist der neue Stand live.

> Tipp: Da die Seite kommerziell ist, ist der **Pro-Plan ohnehin nötig**
> (Hobby ist laut Vercel-AGB nur für private Projekte).

---

## 🔴 2. Datenbank-Migrationen einspielen (PFLICHT)

Ohne diesen Schritt **schlägt jede Bestellung fehl** (fehlende Spalte) und
**alle Kundendaten sind öffentlich auslesbar**.

1. Öffne https://supabase.com/dashboard → Projekt → **SQL Editor**
2. Inhalt von `supabase/APPLY_IN_SUPABASE.sql` komplett reinkopieren → **Run**
3. Fertig. Das Skript ist gefahrlos wiederholbar.

Was es macht: Spalte `paypal_order_id` + Schutz gegen Zahlungs-Doppelnutzung,
und es entfernt die unsicheren RLS-Policies, über die bisher jeder mit dem
öffentlichen Key alle Namen/Adressen/Telefonnummern lesen konnte.

---

## 🟠 3. Echte Kontaktdaten eintragen

Die **Telefonnummer** ist überall noch ein Platzhalter `(noch eintragen)`.
Im Impressum ist eine Telefonnummer **gesetzlich Pflicht**. Betroffen:
- `components/footer.tsx`
- `app/impressum/page.tsx`
- `app/page.tsx` (Kontaktbereich unten)

Sag mir einfach die Nummer, dann trage ich sie an allen Stellen ein
(auch im `tel:`-Link und in den Structured Data).

---

## 🟠 4. E-Mail-Versand (Resend)

Bestellbestätigungen werden über Resend verschickt — aktuell mit
Platzhalter-Key, also **es wird nichts versendet**.

1. Account bei https://resend.com anlegen (mit einer luma-pizza.de-Adresse)
2. Domain `luma-pizza.de` dort verifizieren (DNS-Einträge bei netcup setzen)
3. `RESEND_API_KEY` in Vercel + lokal in `.env.local` eintragen
4. In `lib/resend.ts` die `from:`-Adressen von `onboarding@resend.dev` auf
   z. B. `bestellungen@luma-pizza.de` umstellen — sag Bescheid, mach ich.

Hängt an der Domain + dem Mail-Postfach, das du noch einrichten wolltest.

---

## 🟠 5. PayPal-Account

`NEXT_PUBLIC_PAYPAL_CLIENT_ID` und `PAYPAL_CLIENT_SECRET` sind noch
Platzhalter (`xxxx…`). Solange das so ist, weist die Bestell-API
PayPal-Zahlungen sauber ab (kein Risiko, nur nicht nutzbar).

1. Business-Account bei https://paypal.com mit luma-pizza.de-Adresse
2. App erstellen → Client ID + Secret → in Vercel + `.env.local` eintragen
3. Optional `PAYPAL_MODE=live` setzen (Standard ist Sandbox)

Die serverseitige PayPal-Prüfung ist schon fertig — sobald die Keys da
sind, funktioniert es ohne Code-Änderung.

---

## 🟠 6. Domain verbinden

`luma-pizza.de` ist bei netcup gekauft, aber noch nicht mit Vercel verbunden.
In Vercel → Projekt → Settings → Domains → `luma-pizza.de` hinzufügen und
die angezeigten DNS-Einträge bei netcup setzen. Danach in Vercel die
Env-Variable `NEXT_PUBLIC_BASE_URL` auf `https://luma-pizza.de` ändern.

---

## 🟡 7. Admin-Passwort ändern

`ADMIN_PASSWORD` steht aktuell auf `changeme123`. Vor Go-Live in Vercel
(und `.env.local`) auf ein echtes, sicheres Passwort ändern. Das Login
findet sich unter `/admin/login`.

---

## 🟡 8. GitHub-Token widerrufen

Du hattest im Chat mal einen GitHub-Token im Klartext gepostet. Bitte unter
https://github.com/settings/tokens widerrufen, falls noch nicht geschehen.

---

## ✅ Was heute schon erledigt wurde

- **Bezahl-Sicherheit:** Server berechnet Preise selbst aus der Speisekarte
  und verifiziert Stripe-/PayPal-Zahlungen serverseitig, bevor eine
  Bestellung als „bezahlt" gilt. Schutz gegen Zahlungs-Doppelnutzung.
- **Datenschutz:** RLS-Lücke geschlossen (Code + Migration); Admin-Dashboard
  liest Bestellungen jetzt über eine geschützte API-Route.
- **Admin-Login:** kein Klartext-Passwort mehr im Cookie, sondern ein
  signiertes, ablaufendes Session-Token. `/api/orders/[id]` ist abgesichert.
- **Next.js** auf 14.2.35 aktualisiert (schließt die Middleware-Bypass-CVE).
- **SEO:** robots.txt, sitemap.xml, Structured Data, Favicon, Meta-Tags.
- **Vercel:** Deployment-Schutz (SSO-Login-Wall) deaktiviert — die Seite
  ist öffentlich erreichbar, sobald Punkt 1 gelöst ist.
- Build läuft sauber, 18 Tests grün.

---

## 💡 Sinnvolle nächste Features (Vorschläge)

Bewusst **nicht** umgesetzt, weil sie deine/Kadirs Geschäftsentscheidung
brauchen — sag mir die Eckdaten und ich baue sie:

1. **Öffnungszeiten + „Jetzt geschlossen"** — aktuell kann man rund um die
   Uhr bestellen. Mit echten Öffnungszeiten zeigt die Seite „geschlossen,
   öffnet um …" bzw. nimmt Vorbestellungen an. *Hoher Nutzen.*
2. **Mindestbestellwert für Lieferung** — z. B. „ab 15 € liefern wir".
3. **Liefergebühr** — steht aktuell fix auf 0,00 €; falls gewünscht
   konfigurierbar machen.
4. **Voraussichtliche Zeit** — „Lieferung in ca. 45 Min." im Checkout.

Punkt 1–3 sind schnell gebaut, sobald die Zahlen feststehen.
