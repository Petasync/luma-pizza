-- Absicherung gegen verlorene Bestellungen (26.07.2026)
--
-- Vorgeschichte: Eine per Stripe bezahlte Bestellung landete weder in der
-- Datenbank noch als Mail bei Kadir. Grund: die Bestellung wurde erst NACH der
-- Zahlung vom Browser des Kunden gespeichert. Bricht dieser Schritt ab
-- (Empfang weg, Tab geschlossen, Weiterleitung bei Klarna), ist das Geld
-- kassiert und die Bestellung spurlos verschwunden.
--
-- Neuer Ablauf: Die Bestellung wird VOR der Zahlung angelegt (payment_status
-- 'pending') und danach vom Stripe-Webhook auf 'paid' gesetzt. Der Webhook ist
-- serverseitig und unabhängig vom Browser des Kunden.

-- Wann wurden die Bestellbestätigungen (Kunde + Restaurant) verschickt?
-- NULL bei einer bezahlten Bestellung heißt: Mailversand steht noch aus oder ist
-- fehlgeschlagen. Die nächtliche Nachwache holt das dann nach — so kann eine
-- bezahlte Bestellung nicht mehr unbemerkt ohne Benachrichtigung bleiben.
alter table orders add column if not exists benachrichtigt_am timestamptz;

-- Bestandsdaten: alles, was bereits bezahlt/abgeschlossen ist, gilt als
-- benachrichtigt — sonst würde die Nachtwache alte Bestellungen erneut mailen.
update orders
   set benachrichtigt_am = created_at
 where benachrichtigt_am is null;

-- Vormerkungen (angelegt, aber noch nicht bezahlt) schnell auffindbar machen —
-- die Nachtwache räumt sie nach 24 h auf.
create index if not exists orders_offene_vormerkungen_idx
    on orders (created_at)
 where payment_status = 'pending' and payment_method <> 'cash';
