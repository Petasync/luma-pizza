-- ============================================================
--  EINMALIG AUSFÜHREN — Supabase Dashboard > SQL Editor
-- ============================================================
--  Migrationen 001–003 sind bereits aktiv (orders-Tabelle läuft).
--  Dieses Skript bündelt 004 + 005 und ist gefahrlos wiederholbar
--  (idempotent). Einfach komplett kopieren, in den SQL Editor
--  einfügen und "Run" drücken.
--
--  WICHTIG: Ohne dieses Skript schlägt die Bestell-Speicherung
--  fehl (Spalte paypal_order_id fehlt) UND alle Kundendaten sind
--  über den öffentlichen anon-Key auslesbar.
-- ============================================================

-- ---- 004: PayPal-Order-ID + Schutz gegen Zahlungs-Replay ----
alter table orders
  add column if not exists paypal_order_id text;

create unique index if not exists orders_stripe_payment_intent_id_key
  on orders (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create unique index if not exists orders_paypal_order_id_key
  on orders (paypal_order_id)
  where paypal_order_id is not null;

-- ---- 005: RLS abriegeln (Kundendaten waren öffentlich lesbar) ----
drop policy if exists "anon can read orders" on orders;
drop policy if exists "anon can update order status" on orders;

-- Kontrolle: sollte nur noch "service role full access" zeigen.
-- select policyname from pg_policies where tablename = 'orders';
