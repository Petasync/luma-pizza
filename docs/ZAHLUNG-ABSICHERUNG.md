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

Der Ablauf bei Kartenzahlung ist umgedreht:

```
alt:  bezahlen → Bestellung speichern → Mail        (bricht Schritt 2 ab: alles weg)
neu:  Bestellung vormerken → bezahlen → bezahlt setzen + Mail
```

`POST /api/bestellung/vormerken` legt die Bestellung mit `payment_status =
'pending'` an, **bevor** `stripe.confirmPayment()` läuft. Nebeneffekt: Alle
Regeln (Öffnungszeiten, Liefergebiet, Mindestbestellwert, Preise) werden jetzt
vor der Zahlung geprüft. Früher konnte eine Bestellung nach dem Bezahlen mit
„Wir haben schon zu" abgelehnt werden.

Unbezahlte Vormerkungen erscheinen **nicht** im Dashboard (`/api/admin/orders`
filtert sie), damit die Küche nicht für abgebrochene Zahlungen kocht.

### 2. Stripe-Webhook als Sicherheitsnetz

`POST /api/stripe/webhook` empfängt `payment_intent.succeeded` direkt von
Stripe — unabhängig davon, was der Browser des Kunden macht. Er setzt die
Bestellung auf `paid` und löst die Mails aus.

Browser und Webhook rufen dieselbe Funktion `markiereAlsBezahlt()` auf. Sie ist
**idempotent**: Das UPDATE greift nur, wenn der Status noch `pending` ist. Von
zwei gleichzeitigen Aufrufen gewinnt genau einer — es kann also weder doppelt
gemailt noch doppelt gebucht werden.

Findet der Webhook zu einer Zahlung gar keine Bestellung, geht sofort eine
Alarm-Mail raus statt wie bisher gar nichts.

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
| Vormerkungen älter als 24 h | auf `failed` setzen (nie löschen) |

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

### Bereits erledigt

- `CRON_SECRET` ist in Vercel (Production) hinterlegt
- Migration `006_zahlung_absichern.sql` ist auf der Produktivdatenbank angewandt

## Noch offen: PayPal

PayPal hat **dieselbe Lücke** wie Stripe vorher: Die Bestellung entsteht erst
nach der Zahlung im Browser. Um sie genauso zu schließen, bräuchte es einen
PayPal-Webhook und dasselbe Vormerken. Bis dahin gilt: Die nächtliche Nachtwache
gleicht **nur Stripe** ab, PayPal-Zahlungen sind dort nicht abgedeckt.
