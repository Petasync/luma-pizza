-- Store the PayPal order ID so payments can be verified/traced,
-- analogous to stripe_payment_intent_id for card payments.

alter table orders
  add column if not exists paypal_order_id text;

-- Prevent payment replay: the same Stripe PaymentIntent / PayPal order
-- may back at most one order row.
create unique index if not exists orders_stripe_payment_intent_id_key
  on orders (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create unique index if not exists orders_paypal_order_id_key
  on orders (paypal_order_id)
  where paypal_order_id is not null;
