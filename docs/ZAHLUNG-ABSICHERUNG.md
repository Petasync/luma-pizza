# Bezahlte Bestellungen können nicht mehr verloren gehen

Stand: 26.07.2026

## Was passiert war

Ein Kunde bezahlte per Stripe **51,50 €**. Kadir bekam keine Mail, im Dashboard
war nichts zu sehen — und in der Datenbank stand die Bestellung ebenfalls nicht.
Es waren **zwei voneinander unabhängige Fehler**:

1. **Die Bestellung wurde erst NACH der Zahlung gespeichert**, und zwar vom
   Browser des Kunden. Bricht dieser Schritt ab (Empfang weg, Tab geschlossen,
   Rücksprung bei Klarna, Serverfehler), ist das Geld eingezogen und die
   Bestellung spurlos weg. Niemand erfährt davon. Weil die Bestätigungsmails im
   selben Arbeitsschritt verschickt wurden, fehlten auch sie.

2. **Das Küchen-Terminal war blind.** Die Anmeldung des Kiosk-Laptops läuft nach
   7 Tagen ab. Der Laptop lief mit offener Dashboard-Seite durch, die Sitzung
   verfiel im Hintergrund, und `/api/admin/orders` lieferte nur noch `401`. Im
   Code wurde dieser Fehler stillschweigend verschluckt — die Seite sah normal
   aus und zeigte weiter die alte Liste.

Der Supabase-Ruhemodus war **nicht** beteiligt: Die Datenbank lief zu diesem
Zeitpunkt seit 20 Tagen durch.

## Was jetzt anders ist

### 1. Bestellung zuerst, Zahlung danach

Der Ablauf bei Karten- **und** PayPal-Zahlung ist umgedreht:

```
alt:  bezahlen → Bestellung speichern → Mail        (bricht Schritt 2 ab: alles weg)
neu:  Bestellung vormerken → bezahlen → bezahlt setzen + Mail
```

`POST /api/bestellung/vormerken` legt die Bestellung mit `payment_status =
'pending'` an, **bevor** `stripe.confirmPayment()` bzw.
`actions.order.capture()` läuft. Nebeneffekt: Alle Regeln (Öffnungszeiten,
Liefergebiet, Mindestbestellwert, Preise) werden jetzt vor der Zahlung geprüft.
Früher konnte eine Bestellung nach dem Bezahlen mit „Wir haben schon zu"
abgelehnt werden.

Bei PayPal passiert das Vormerken in `onApprove` — also nachdem der Kunde bei
PayPal zugestimmt hat, aber bevor `actions.order.capture()` das Geld einzieht.
`vormerken` prüft dafür serverseitig bei PayPal, dass die Bestellung existiert,
zum Betrag passt und den Status `APPROVED` hat (noch nicht `COMPLETED` — das
würde bedeuten, dass am Vormerken vorbei schon kassiert wurde). Schlägt das
Vormerken fehl, wird `actions.order.capture()` **nie aufgerufen** — kein
Geldabzug ohne Bestellung, genau wie bei Karte.

Unbezahlte Vormerkungen erscheinen **nicht** im Dashboard (`/api/admin/orders`
filtert sie), damit die Küche nicht für abgebrochene Zahlungen kocht.

### 2. Stripe- und PayPal-Webhook als Sicherheitsnetz

`POST /api/stripe/webhook` empfängt `payment_intent.succeeded` direkt von
Stripe, `POST /api/paypal/webhook` empfängt `PAYMENT.CAPTURE.COMPLETED` direkt
von PayPal — beide unabhängig davon, was der Browser des Kunden macht. Sie
setzen die Bestellung auf `paid` und lösen die Mails aus.

Browser und Webhooks rufen dieselbe Funktion `markiereAlsBezahlt()` auf. Sie
ist **idempotent**: Das UPDATE greift nur, wenn der Status noch `pending` ist.
Von mehreren gleichzeitigen Aufrufen (Browser, Webhook, Nachtwache) gewinnt
genau einer — es kann also weder doppelt gemailt noch doppelt gebucht werden.

Findet ein Webhook zu einer Zahlung gar keine Bestellung, geht sofort eine
Alarm-Mail raus statt wie bisher gar nichts.

`POST /api/bestellung/bestaetigen` (die schnelle Abkürzung für den Browser)
verifiziert bei PayPal-Bestellungen genauso serverseitig über
`verifyPayPalOrder()`, dass die Zahlung wirklich `COMPLETED` ist und der Betrag
stimmt — der Angabe des Browsers wird nie vertraut.

### 3. Das Terminal meldet sich selbst wieder an

Beim Kiosk-Login (`/api/admin/device`) bekommt das Gerät zusätzlich ein
langlebiges **Geräte-Cookie** (1 Jahr). Läuft die 7-Tage-Sitzung ab, erneuert das
Dashboard sie über `/api/admin/refresh` selbstständig.

Im Cookie steht nicht der Geräte-Token selbst, sondern nur eine damit erzeugte
Signatur — wird `DASHBOARD_DEVICE_TOKEN` in Vercel geändert (z. B. weil der
Laptop weg ist), sind alle Geräte-Cookies sofort ungültig.

Klappt das Erneuern nicht, zeigt das Dashboard einen **roten Vollbild-Balken**
und der **Alarmton geht an**. Ein stiller Ausfall ist nicht mehr möglich.

### 4. Nächtliche Nachtwache

`GET /api/cron/nachtwache`, täglich um 04:00 UTC (06:00 Berliner Zeit) per
Vercel-Cron (`vercel.json`). Sie erledigt vier Dinge:

| Aufgabe | Zweck |
|---|---|
| Datenbank abfragen | Supabase pausiert Gratis-Projekte nach 7 Tagen Inaktivität — der tägliche Zugriff verhindert das |
| Bezahlt, aber `benachrichtigt_am` leer | Mailversand nachholen |
| Stripe-Zahlungen der letzten 48 h abgleichen | Zahlung ohne (bezahlte) Bestellung → Alarm-Mail |
| Vormerkungen älter als 24 h | **erst** beim jeweiligen Zahlungsdienst (Stripe/PayPal) den echten Status prüfen, **dann** entweder auf `paid` nachtragen + Mails verschicken (war doch bezahlt) oder auf `failed` setzen (nie löschen) |

Der letzte Punkt ist bewusst kein blindes Update mehr: Vor PR „PayPal absichern"
wurde jede über 24 h alte Vormerkung ungeprüft auf `failed` gesetzt — eine
tatsächlich bezahlte, aber liegengebliebene Bestellung (z. B. weil sowohl der
Browser-Aufruf als auch der Webhook ausgefallen sind) wäre damit fälschlich als
fehlgeschlagen abgestempelt worden. Jetzt fragt die Nachtwache zuerst bei
Stripe bzw. PayPal nach. Schlägt diese Abfrage selbst fehl (Netz, API down),
wird die Bestellung **nicht angefasst** und stattdessen nur gemeldet — sie wird
in der nächsten Nacht erneut geprüft.

Für PayPal ist die Nachtwache damit das **einzige** Sicherheitsnetz mit
garantierter Reaktionszeit, falls sowohl der Browser-Aufruf als auch der
PayPal-Webhook ausfallen — mit bis zu 24 h Verzögerung, aber ohne Geldverlust.

Gemeldet wird nur bei Auffälligkeiten. **Keine Mail = alles in Ordnung.**

## Einmalige Einrichtung

### Webhook in Stripe anlegen

1. Stripe-Dashboard → **Entwickler → Webhooks → Endpunkt hinzufügen**
2. Endpunkt-URL: `https://www.luma-pizza.de/api/stripe/webhook`
3. Ereignisse auswählen:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Speichern, dann das **Signing secret** (`whsec_…`) kopieren
5. In Vercel unter *Settings → Environment Variables* die vorhandene Variable
   `STRIPE_WEBHOOK_SECRET` auf diesen Wert setzen
6. Neuestes Deployment **redeployen**, damit der Wert aktiv wird

> Ohne diesen Schritt antwortet der Webhook mit 500 und Stripe zeigt ihn als
> fehlerhaft an. Der Rest (Vormerken, Dashboard, Nachtwache) funktioniert
> unabhängig davon.

### Webhook in PayPal anlegen

1. [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/) →
   **Apps & Credentials** → die App auswählen, die `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
   / `PAYPAL_CLIENT_SECRET` gehört (Live- **und** Sandbox-App je einmal, wenn
   beide genutzt werden)
2. Runterscrollen zu **Webhooks** → **Add Webhook**
3. Endpunkt-URL: `https://www.luma-pizza.de/api/paypal/webhook`
4. Ereignisse auswählen:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
5. Speichern, dann die angezeigte **Webhook-ID** (Format `WH-XXXXXXXXXXXXXXXXX-XXXXXXXXXXXXXXXXX`) kopieren
6. In Vercel unter *Settings → Environment Variables* die neue Variable
   `PAYPAL_WEBHOOK_ID` auf diesen Wert setzen
7. Neuestes Deployment **redeployen**, damit der Wert aktiv wird

> Ohne diesen Schritt antwortet der Webhook mit 500 und PayPal zeigt ihn als
> fehlerhaft an. Vormerken, Bestätigen und die nächtliche Nachtwache
> funktionieren unabhängig davon — die Nachtwache holt eine verpasste
> PayPal-Zahlung mit bis zu 24 h Verzögerung nach, der Webhook praktisch sofort.

### Bereits erledigt

- `CRON_SECRET` ist in Vercel (Production) hinterlegt
- Migration `006_zahlung_absichern.sql` ist auf der Produktivdatenbank angewandt

## PayPal: seit 01.08.2026 auf demselben Ablauf wie Stripe

PayPal hatte **dieselbe Lücke** wie Stripe vorher: Die Bestellung entstand erst
nach der Zahlung im Browser. Das ist jetzt geschlossen — Vormerken vor der
Kaptur, serverseitige PayPal-Prüfung bei der Bestätigung, eigener Webhook
(`/api/paypal/webhook`) und eine Nachtwache, die auch PayPal-Vormerkungen vor
dem Abstempeln real bei PayPal prüft (siehe oben). Einzurichten ist noch der
PayPal-Webhook selbst (`PAYPAL_WEBHOOK_ID`, siehe oben) — ohne ihn greift bei
PayPal übergangsweise nur die 24-h-Nachtwache als Sicherheitsnetz.
