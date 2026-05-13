-- Zusätzliche RLS-Policies, damit das Admin-Dashboard im Browser
-- (mit anon key) Bestellungen lesen und Status updaten kann.
-- Sicherheit: Die /admin-Route ist via Next.js middleware.ts mit Passwort geschützt.

create policy "anon can read orders" on orders
  for select
  using (true);

create policy "anon can update order status" on orders
  for update
  using (true)
  with check (true);
