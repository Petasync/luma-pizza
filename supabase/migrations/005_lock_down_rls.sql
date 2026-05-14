-- SECURITY FIX: migration 002 exposed the whole orders table to the public
-- anon key (using (true) for both SELECT and UPDATE). Since the anon key ships
-- to every browser, anyone could read all customer names, e-mails, phone
-- numbers and addresses, or change order statuses.
--
-- The admin dashboard now reads/updates orders exclusively through server-side
-- API routes that use the service role key and are gated by the admin session
-- cookie (see lib/admin-auth.ts, middleware.ts, app/api/admin/*). So the anon
-- role needs no access at all.

drop policy if exists "anon can read orders" on orders;
drop policy if exists "anon can update order status" on orders;

-- The "service role full access" policy from migration 001 remains in place;
-- the service role also bypasses RLS entirely, so API routes keep working.
