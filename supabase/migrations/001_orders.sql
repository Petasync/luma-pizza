create type order_type as enum ('delivery', 'pickup');
create type order_status as enum ('pending', 'confirmed', 'preparing', 'ready', 'delivered');
create type payment_method as enum ('card', 'paypal', 'cash');
create type payment_status as enum ('pending', 'paid', 'failed');

create table orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status order_status not null default 'pending',
  type order_type not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  delivery_address text,
  postal_code text,
  items jsonb not null,
  total_price numeric(10,2) not null,
  payment_method payment_method not null,
  payment_status payment_status not null default 'pending',
  stripe_payment_intent_id text,
  notes text
);

-- Enable Realtime for admin dashboard
alter publication supabase_realtime add table orders;

-- RLS: only service role can read/write (API routes use service role key)
alter table orders enable row level security;
create policy "service role full access" on orders
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
