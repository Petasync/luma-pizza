-- Track when status last changed so the admin dashboard can show
-- "in this status for X minutes" and compute priority.

alter table orders
  add column if not exists status_changed_at timestamptz not null default now();

-- Backfill existing rows
update orders set status_changed_at = created_at where status_changed_at is null;
