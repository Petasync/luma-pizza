# Luma Pizza Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack pizza ordering website for Luma Pizza with online payment, delivery/pickup selection, and a real-time admin dashboard.

**Architecture:** Next.js 14 App Router frontend with API routes, Supabase for order persistence and real-time updates, Stripe for card/Klarna payments, PayPal SDK for PayPal payments, Resend for transactional email.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase, Stripe, PayPal JS SDK, Resend, Vercel

**Design:** Professional, clean — white background, purple (#7c3aed) primary, orange (#f97316) accent, minimal border-radius (4–8px), no playful elements. Fixed cart sidebar on desktop, stack on mobile.

**Spec:** `docs/superpowers/specs/2026-05-12-luma-pizza-website-design.md`

---

## File Map

```
luma-pizza/
├── app/
│   ├── layout.tsx                        # Root layout, fonts, metadata
│   ├── page.tsx                          # Homepage
│   ├── bestellen/page.tsx                # Menu + cart sidebar
│   ├── checkout/page.tsx                 # Multi-step checkout
│   ├── bestellung/[id]/page.tsx          # Order confirmation
│   ├── admin/layout.tsx                  # Admin layout (auth gate)
│   ├── admin/page.tsx                    # Live orders dashboard
│   ├── admin/bestellungen/[id]/page.tsx  # Order detail + status
│   ├── impressum/page.tsx
│   ├── datenschutz/page.tsx
│   └── api/
│       ├── orders/route.ts               # POST create order
│       ├── orders/[id]/route.ts          # PATCH update status
│       ├── stripe/create-intent/route.ts # POST create PaymentIntent
│       ├── stripe/webhook/route.ts       # Stripe webhook handler
│       └── paypal/route.ts              # POST create + capture PayPal order
├── components/
│   ├── navbar.tsx
│   ├── menu/
│   │   ├── category-tabs.tsx
│   │   ├── menu-grid.tsx
│   │   └── menu-item-card.tsx
│   ├── cart/
│   │   ├── cart-sidebar.tsx
│   │   ├── cart-item.tsx
│   │   └── cart-context.tsx
│   ├── checkout/
│   │   ├── delivery-toggle.tsx
│   │   ├── postal-check.tsx
│   │   ├── contact-form.tsx
│   │   ├── stripe-payment.tsx
│   │   └── paypal-button.tsx
│   └── admin/
│       ├── order-card.tsx
│       └── status-buttons.tsx
├── lib/
│   ├── types.ts
│   ├── menu.ts
│   ├── postal-codes.ts
│   ├── supabase-browser.ts
│   ├── supabase-server.ts
│   ├── stripe.ts
│   └── resend.ts
├── middleware.ts                         # Admin password gate
├── supabase/migrations/001_orders.sql
├── .env.local.example
└── __tests__/
    ├── lib/postal-codes.test.ts
    ├── lib/cart.test.ts
    └── api/orders.test.ts
```

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `.env.local.example`

- [ ] **Step 1: Initialize Next.js project**

```bash
npx create-next-app@latest luma-pizza \
  --typescript --tailwind --eslint \
  --app --src-dir no --import-alias "@/*"
cd luma-pizza
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr \
  stripe @stripe/stripe-js @stripe/react-stripe-js \
  @paypal/react-paypal-js \
  resend \
  clsx
npm install -D jest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jest-environment-jsdom ts-jest \
  @types/jest
```

- [ ] **Step 3: Configure Jest — create `jest.config.ts`**

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)
```

- [ ] **Step 4: Create `jest.setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Create `.env.local.example`**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
SUPABASE_SERVICE_ROLE_KEY=xxxx

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxx
STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx

# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=xxxx
PAYPAL_CLIENT_SECRET=xxxx

# Resend
RESEND_API_KEY=re_xxxx
RESTAURANT_EMAIL=info@luma-pizza.de

# Admin
ADMIN_PASSWORD=changeme123

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Copy to `.env.local` and fill in real values.

- [ ] **Step 6: Init git + GitHub repo**

```bash
git init
echo "node_modules\n.env.local\n.next" >> .gitignore
git add .
git commit -m "chore: init Next.js project with dependencies"
gh repo create luma-pizza --private --source=. --push
```

---

## Task 2: Database Schema

**Files:**
- Create: `supabase/migrations/001_orders.sql`

- [ ] **Step 1: Create Supabase project**

Go to https://supabase.com → New project → name: `luma-pizza` → save the URL and keys to `.env.local`.

- [ ] **Step 2: Write migration — create `supabase/migrations/001_orders.sql`**

```sql
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
```

- [ ] **Step 3: Run migration in Supabase dashboard**

Go to Supabase → SQL Editor → paste the SQL above → Run.

- [ ] **Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: add orders table schema with RLS and Realtime"
```

---

## Task 3: TypeScript Types + Supabase Clients

**Files:**
- Create: `lib/types.ts`, `lib/supabase-browser.ts`, `lib/supabase-server.ts`

- [ ] **Step 1: Create `lib/types.ts`**

```typescript
export type OrderType = 'delivery' | 'pickup'
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered'
export type PaymentMethod = 'card' | 'paypal' | 'cash'
export type PaymentStatus = 'pending' | 'paid' | 'failed'

export interface CartItem {
  menuItemId: string
  name: string
  size: string | null   // '26cm' | '30cm' for pizzas, null otherwise
  price: number
  quantity: number
}

export interface MenuItem {
  id: string
  category: string
  name: string
  description: string
  price?: number              // fixed price items
  priceSmall?: number         // pizza 26cm
  priceLarge?: number         // pizza 30cm
  available: boolean
  tags?: ('vegetarisch' | 'scharf' | '18+')[]
}

export interface Order {
  id: string
  created_at: string
  status: OrderStatus
  type: OrderType
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_address?: string
  postal_code?: string
  items: CartItem[]
  total_price: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  stripe_payment_intent_id?: string
  notes?: string
}

export interface CreateOrderPayload {
  type: OrderType
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_address?: string
  postal_code?: string
  items: CartItem[]
  total_price: number
  payment_method: PaymentMethod
  notes?: string
}
```

- [ ] **Step 2: Create `lib/supabase-browser.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: Create `lib/supabase-server.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'

export function createSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/
git commit -m "feat: add TypeScript types and Supabase clients"
```

---

## Task 4: Menu Data

**Files:**
- Create: `lib/menu.ts`, `lib/postal-codes.ts`

- [ ] **Step 1: Write failing test — create `__tests__/lib/postal-codes.test.ts`**

```typescript
import { isDeliverable } from '@/lib/postal-codes'

describe('isDeliverable', () => {
  it('returns true for 90599', () => {
    expect(isDeliverable('90599')).toBe(true)
  })
  it('returns false for unknown PLZ', () => {
    expect(isDeliverable('10115')).toBe(false)
  })
  it('trims whitespace', () => {
    expect(isDeliverable(' 90599 ')).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/lib/postal-codes.test.ts
```
Expected: FAIL — "Cannot find module '@/lib/postal-codes'"

- [ ] **Step 3: Create `lib/postal-codes.ts`**

```typescript
const DELIVERY_POSTAL_CODES = new Set([
  '90599', // Dietenhofen
])

export function isDeliverable(postalCode: string): boolean {
  return DELIVERY_POSTAL_CODES.has(postalCode.trim())
}
```

- [ ] **Step 4: Run tests — verify pass**

```bash
npx jest __tests__/lib/postal-codes.test.ts
```
Expected: PASS (3 tests)

- [ ] **Step 5: Create `lib/menu.ts`**

```typescript
import { MenuItem } from './types'

export const MENU_CATEGORIES = [
  'Pizza',
  'Burger',
  'Pasta',
  'Fisch Gerichte',
  'Schnitzel Gerichte',
  'Snacks',
  'Beilagen',
  'Salate',
  'Nachspeisen',
  'Alkoholische Getränke',
  'Alkoholfreie Getränke',
] as const

export const MENU_ITEMS: MenuItem[] = [
  // --- PIZZA ---
  { id: 'pizza-margherita', category: 'Pizza', name: 'Pizza Margherita', description: 'Tomatensauce, Edamer, Käse', priceSmall: 8.50, priceLarge: 9.50, available: true, tags: ['vegetarisch'] },
  { id: 'pizza-mozzarella', category: 'Pizza', name: 'Pizza Mozzarella', description: 'Tomatensauce, Mozzarella, Käse', priceSmall: 8.50, priceLarge: 9.50, available: true },
  { id: 'pizza-funghi', category: 'Pizza', name: 'Pizza Funghi', description: 'Tomatensauce, frische Champignons, Käse', priceSmall: 8.50, priceLarge: 9.50, available: true },
  { id: 'pizza-formaggio', category: 'Pizza', name: 'Pizza Formaggio', description: 'Tomatensauce, Gorgonzola, Parmesan, Edamer', priceSmall: 9.50, priceLarge: 11.00, available: true },
  { id: 'pizza-luma', category: 'Pizza', name: 'Pizza Luma', description: 'Tomatensauce, Schinken, Rucola, Gorgonzola, Parmesan, gebratene Aubergine, Käse', priceSmall: 9.50, priceLarge: 11.00, available: true },
  { id: 'pizza-vegetaria', category: 'Pizza', name: 'Pizza Vegetaria', description: 'Tomatensauce, Champignons, Peperoni, Paprika, Artischocken, Zwiebeln, Oliven, Käse', priceSmall: 9.50, priceLarge: 11.00, available: true, tags: ['vegetarisch'] },
  { id: 'pizza-diavola', category: 'Pizza', name: 'Pizza Diavola', description: 'Tomatensauce, Schinken, Salami, Champignons, Rinderhackfleisch, Käse', priceSmall: 9.50, priceLarge: 11.00, available: true },
  { id: 'pizza-americano', category: 'Pizza', name: 'Pizza Americano', description: 'Tomatensauce, Schinken, Salami, Peperoni, Mais, Zwiebeln, Käse', priceSmall: 9.50, priceLarge: 11.00, available: true },
  { id: 'pizza-mexicano', category: 'Pizza', name: 'Pizza Mexicano', description: 'Tomatensauce, Salami, Bohnen, Peperoni, Mais, Zwiebeln, Käse', priceSmall: 9.00, priceLarge: 10.50, available: true },
  { id: 'pizza-hawai', category: 'Pizza', name: 'Pizza Hawai', description: 'Tomatensauce, Schinken, Ananas, Käse', priceSmall: 9.50, priceLarge: 11.00, available: true },
  { id: 'pizza-tonno', category: 'Pizza', name: 'Pizza Tonno', description: 'Tomatensauce, Thunfisch, Knoblauch, Zwiebeln, Käse', priceSmall: 9.50, priceLarge: 11.00, available: true },
  { id: 'pizza-gam', category: 'Pizza', name: 'Pizza Gam', description: 'Tomatensauce, Shrimps, Knoblauch, Käse', priceSmall: 9.50, priceLarge: 11.00, available: true },
  { id: 'pizza-meeresfruchte', category: 'Pizza', name: 'Pizza Meeresfrüchte', description: 'Tomatensauce, Meeresfrüchte, Knoblauch, Käse', priceSmall: 9.50, priceLarge: 11.00, available: true },
  { id: 'pizza-botanik', category: 'Pizza', name: 'Pizza Botanik', description: 'Tomatensauce, Cherrytomaten, Mais, Käse', priceSmall: 8.50, priceLarge: 10.00, available: true, tags: ['vegetarisch'] },
  { id: 'pizza-calzone', category: 'Pizza', name: 'Pizza Calzone 30 cm', description: 'Tomatensauce, Schinken, Salami, Champignons', price: 10.00, available: true },
  { id: 'pizza-pastirma', category: 'Pizza', name: 'Pizza Pastirma', description: 'Tomatensauce, Kalbschinken, Rucola, Käse', priceSmall: 9.50, priceLarge: 11.00, available: false },
  // --- BURGER ---
  { id: 'burger-classic', category: 'Burger', name: 'Classic Burger', description: 'Rinderfleisch, Salat, Tomaten, Gewürzgurke, Zwiebeln', price: 10.00, available: true },
  { id: 'burger-cheese', category: 'Burger', name: 'Cheese Burger', description: 'Rinderfleisch, Salat, Tomaten, Gewürzgurke, Käse', price: 11.00, available: true },
  { id: 'burger-luma-mersin', category: 'Burger', name: 'Luma Mersin Burger', description: 'Rinderfleisch, Salat, Tomaten, Gewürzgurke, gebratene Aubergine, Zwiebeln, Käse', price: 11.50, available: true },
  { id: 'burger-chili-cheese', category: 'Burger', name: 'Chili Cheese Burger', description: 'Rinderfleisch, Salat, Tomaten, Jalapenos, Burgersauce, Käse', price: 11.00, available: true, tags: ['scharf'] },
  { id: 'burger-chicken', category: 'Burger', name: 'Chicken Burger', description: 'Hähnchenfleisch, Salat, Tomaten, Gewürzgurke', price: 10.00, available: true },
  { id: 'burger-double-beef', category: 'Burger', name: 'Double Beef Burger', description: 'Rinderfleisch, Salat, Tomaten, Gewürzgurke', price: 13.00, available: true },
  // --- PASTA ---
  { id: 'pasta-napoli', category: 'Pasta', name: 'Pasta Napoli', description: 'Tomatensauce', price: 8.50, available: true, tags: ['vegetarisch'] },
  { id: 'pasta-bolognese', category: 'Pasta', name: 'Pasta Bolognese', description: 'Tomatensauce, Rinderhackfleisch', price: 9.50, available: true },
  { id: 'pasta-al-pollo', category: 'Pasta', name: 'Pasta Al Pollo', description: 'Sahnesauce, Hähnchenbrust, Champignons, Brokkoli, Kirschtomaten', price: 9.50, available: true },
  { id: 'pasta-al-forno', category: 'Pasta', name: 'Pasta Al Forno', description: 'Tomatensauce, Hackfleisch, mit Käse überbacken', price: 9.50, available: true },
  { id: 'pasta-carbonara', category: 'Pasta', name: 'Pasta Carbonara', description: 'Sahnesauce, Schinken, Parmesan', price: 9.50, available: true },
  { id: 'pasta-al-curry', category: 'Pasta', name: 'Pasta Al Curry', description: 'Curry-Sahnesauce, Hähnchenbrust', price: 9.50, available: true },
  { id: 'pasta-tortellini-manti', category: 'Pasta', name: 'Tortellini Manti', description: 'Tomatensauce, Joghurtsauce', price: 12.50, available: true },
  // --- FISCH ---
  { id: 'fisch-kalamari', category: 'Fisch Gerichte', name: 'Kalamari', description: '', price: 13.00, available: true },
  { id: 'fisch-garnelen', category: 'Fisch Gerichte', name: 'Garnelenpfanne', description: 'Mit Paprika, Knoblauch (scharf)', price: 12.50, available: true, tags: ['scharf'] },
  { id: 'fisch-lachs', category: 'Fisch Gerichte', name: 'Lachs', description: 'Mit gekochten Kartoffeln und Gemüse', price: 14.00, available: false },
  { id: 'fisch-oktopus', category: 'Fisch Gerichte', name: 'Oktopus Salat', description: 'Mit Gemüse', price: 13.00, available: false },
  // --- SCHNITZEL ---
  { id: 'schnitzel-puten', category: 'Schnitzel Gerichte', name: 'Putenschnitzel', description: 'Mit Salat', price: 11.00, available: true },
  { id: 'schnitzel-schwein', category: 'Schnitzel Gerichte', name: 'Schweineschnitzel', description: 'Mit Salat', price: 12.50, available: true },
  // --- SNACKS ---
  { id: 'snack-wings', category: 'Snacks', name: 'Chicken Wings 12 Stück', description: '', price: 9.50, available: true },
  { id: 'snack-mozzarella-sticks', category: 'Snacks', name: 'Mozzarella Sticks 9 Stück', description: '', price: 7.00, available: true },
  // --- BEILAGEN ---
  { id: 'beilage-pommes', category: 'Beilagen', name: 'Pommes Frites', description: '', price: 4.50, available: true },
  // --- SALATE ---
  { id: 'salat-mexico', category: 'Salate', name: 'Mexico Salat', description: 'Hähnchenbrust, Rucola, Cherrytomaten, Gurken, Röstzwiebeln', price: 9.50, available: true },
  // --- NACHSPEISEN ---
  { id: 'dessert-baklava', category: 'Nachspeisen', name: 'Baklava', description: '', price: 6.00, available: true },
  { id: 'dessert-tiramisu', category: 'Nachspeisen', name: 'Tiramisu', description: '', price: 6.50, available: true },
  { id: 'dessert-milchreis', category: 'Nachspeisen', name: 'Milchreis', description: '', price: 5.00, available: false },
  { id: 'dessert-ice', category: 'Nachspeisen', name: 'Ice Kugel', description: '', price: 2.00, available: false },
  // --- ALKOHOLISCHE GETRÄNKE ---
  { id: 'drink-rotwein', category: 'Alkoholische Getränke', name: 'Rotwein Flasche', description: '', price: 11.00, available: true, tags: ['18+'] },
  { id: 'drink-weisswein', category: 'Alkoholische Getränke', name: 'Weißwein Flasche', description: '', price: 11.00, available: true, tags: ['18+'] },
  { id: 'drink-emilia-rotwein', category: 'Alkoholische Getränke', name: 'Emilia Süß Rotwein', description: '', price: 10.00, available: true, tags: ['18+'] },
  { id: 'drink-warsteiner', category: 'Alkoholische Getränke', name: 'Warsteiner', description: '', price: 4.00, available: true, tags: ['18+'] },
  { id: 'drink-becks', category: 'Alkoholische Getränke', name: 'Becks', description: '', price: 4.00, available: true, tags: ['18+'] },
  { id: 'drink-gruner', category: 'Alkoholische Getränke', name: 'Grüner', description: '', price: 4.00, available: true, tags: ['18+'] },
  { id: 'drink-gutman', category: 'Alkoholische Getränke', name: 'Gutman Weizen', description: '', price: 4.00, available: true, tags: ['18+'] },
  { id: 'drink-zindorfer', category: 'Alkoholische Getränke', name: 'Zindorfer 0,5l', description: '', price: 4.00, available: true, tags: ['18+'] },
  { id: 'drink-radler', category: 'Alkoholische Getränke', name: 'Radler', description: '', price: 3.50, available: true, tags: ['18+'] },
  // --- ALKOHOLFREIE GETRÄNKE ---
  { id: 'drink-cola-l', category: 'Alkoholfreie Getränke', name: 'Coca-Cola 1,0l', description: '', price: 5.00, available: true },
  { id: 'drink-fanta-l', category: 'Alkoholfreie Getränke', name: 'Fanta 1,0l', description: '', price: 5.00, available: true },
  { id: 'drink-sprite-l', category: 'Alkoholfreie Getränke', name: 'Sprite 1,0l', description: '', price: 5.00, available: true },
  { id: 'drink-mezzo-l', category: 'Alkoholfreie Getränke', name: 'Mezzo Mix 1,0l', description: '', price: 5.00, available: true },
  { id: 'drink-cola-s', category: 'Alkoholfreie Getränke', name: 'Coca-Cola 0,33l', description: '', price: 3.00, available: true },
  { id: 'drink-fanta-s', category: 'Alkoholfreie Getränke', name: 'Fanta 0,33l', description: '', price: 3.00, available: true },
  { id: 'drink-sprite-s', category: 'Alkoholfreie Getränke', name: 'Sprite 0,33l', description: '', price: 3.00, available: true },
  { id: 'drink-mezzo-s', category: 'Alkoholfreie Getränke', name: 'Mezzo Mix 0,33l', description: '', price: 3.00, available: true },
  { id: 'drink-arizona', category: 'Alkoholfreie Getränke', name: 'Arizona', description: '', price: 3.50, available: true },
  { id: 'drink-redbull', category: 'Alkoholfreie Getränke', name: 'Red Bull 0,25l', description: '', price: 2.50, available: true },
  { id: 'drink-wasser', category: 'Alkoholfreie Getränke', name: 'Mineralwasser', description: '', price: 2.50, available: true },
  { id: 'drink-stilles-wasser', category: 'Alkoholfreie Getränke', name: 'Stilles Wasser', description: '', price: 2.50, available: true },
  { id: 'drink-ayran', category: 'Alkoholfreie Getränke', name: 'Ayran', description: '', price: 2.50, available: true },
]

export function getItemsByCategory(category: string): MenuItem[] {
  return MENU_ITEMS.filter(item => item.category === category)
}

export function getItemById(id: string): MenuItem | undefined {
  return MENU_ITEMS.find(item => item.id === id)
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/ __tests__/
git commit -m "feat: add menu data and postal code validation"
```

---

## Task 5: Cart Context

**Files:**
- Create: `components/cart/cart-context.tsx`
- Create: `__tests__/lib/cart.test.ts`

- [ ] **Step 1: Write failing tests — create `__tests__/lib/cart.test.ts`**

```typescript
import { cartReducer, CartState } from '@/components/cart/cart-context'
import { CartItem } from '@/lib/types'

const item1: CartItem = { menuItemId: 'pizza-margherita', name: 'Pizza Margherita', size: '30cm', price: 9.50, quantity: 1 }
const item2: CartItem = { menuItemId: 'burger-cheese', name: 'Cheese Burger', size: null, price: 11.00, quantity: 1 }

const emptyState: CartState = { items: [] }

describe('cartReducer', () => {
  it('adds a new item', () => {
    const state = cartReducer(emptyState, { type: 'ADD_ITEM', item: item1 })
    expect(state.items).toHaveLength(1)
    expect(state.items[0].quantity).toBe(1)
  })

  it('increments quantity for same item+size', () => {
    const state1 = cartReducer(emptyState, { type: 'ADD_ITEM', item: item1 })
    const state2 = cartReducer(state1, { type: 'ADD_ITEM', item: item1 })
    expect(state2.items).toHaveLength(1)
    expect(state2.items[0].quantity).toBe(2)
  })

  it('treats same item with different size as separate', () => {
    const item1Large = { ...item1, size: '26cm', price: 8.50 }
    const state1 = cartReducer(emptyState, { type: 'ADD_ITEM', item: item1 })
    const state2 = cartReducer(state1, { type: 'ADD_ITEM', item: item1Large })
    expect(state2.items).toHaveLength(2)
  })

  it('removes an item', () => {
    const state1 = cartReducer(emptyState, { type: 'ADD_ITEM', item: item1 })
    const state2 = cartReducer(state1, { type: 'REMOVE_ITEM', menuItemId: 'pizza-margherita', size: '30cm' })
    expect(state2.items).toHaveLength(0)
  })

  it('decrements quantity with DECREMENT_ITEM', () => {
    const stateWith2 = { items: [{ ...item1, quantity: 2 }] }
    const state = cartReducer(stateWith2, { type: 'DECREMENT_ITEM', menuItemId: 'pizza-margherita', size: '30cm' })
    expect(state.items[0].quantity).toBe(1)
  })

  it('removes item when decrement reaches 0', () => {
    const stateWith1 = { items: [item1] }
    const state = cartReducer(stateWith1, { type: 'DECREMENT_ITEM', menuItemId: 'pizza-margherita', size: '30cm' })
    expect(state.items).toHaveLength(0)
  })

  it('clears all items', () => {
    const state1 = cartReducer(emptyState, { type: 'ADD_ITEM', item: item1 })
    const state2 = cartReducer(state1, { type: 'ADD_ITEM', item: item2 })
    const state3 = cartReducer(state2, { type: 'CLEAR' })
    expect(state3.items).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx jest __tests__/lib/cart.test.ts
```
Expected: FAIL — "Cannot find module"

- [ ] **Step 3: Create `components/cart/cart-context.tsx`**

```typescript
'use client'
import { createContext, useContext, useReducer, ReactNode } from 'react'
import { CartItem } from '@/lib/types'

export interface CartState {
  items: CartItem[]
}

type CartAction =
  | { type: 'ADD_ITEM'; item: CartItem }
  | { type: 'REMOVE_ITEM'; menuItemId: string; size: string | null }
  | { type: 'DECREMENT_ITEM'; menuItemId: string; size: string | null }
  | { type: 'CLEAR' }

function itemKey(menuItemId: string, size: string | null) {
  return `${menuItemId}__${size ?? 'nosize'}`
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const key = itemKey(action.item.menuItemId, action.item.size)
      const existing = state.items.find(
        i => itemKey(i.menuItemId, i.size) === key
      )
      if (existing) {
        return {
          items: state.items.map(i =>
            itemKey(i.menuItemId, i.size) === key
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        }
      }
      return { items: [...state.items, { ...action.item, quantity: 1 }] }
    }
    case 'DECREMENT_ITEM': {
      const key = itemKey(action.menuItemId, action.size)
      const existing = state.items.find(i => itemKey(i.menuItemId, i.size) === key)
      if (!existing) return state
      if (existing.quantity <= 1) {
        return { items: state.items.filter(i => itemKey(i.menuItemId, i.size) !== key) }
      }
      return {
        items: state.items.map(i =>
          itemKey(i.menuItemId, i.size) === key ? { ...i, quantity: i.quantity - 1 } : i
        ),
      }
    }
    case 'REMOVE_ITEM': {
      const key = itemKey(action.menuItemId, action.size)
      return { items: state.items.filter(i => itemKey(i.menuItemId, i.size) !== key) }
    }
    case 'CLEAR':
      return { items: [] }
  }
}

interface CartContextValue {
  state: CartState
  dispatch: React.Dispatch<CartAction>
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })
  const total = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0)
  return (
    <CartContext.Provider value={{ state, dispatch, total, itemCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
```

- [ ] **Step 4: Run tests — verify pass**

```bash
npx jest __tests__/lib/cart.test.ts
```
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add components/cart/cart-context.tsx __tests__/lib/cart.test.ts
git commit -m "feat: add cart context with reducer (tested)"
```

---

## Task 6: Tailwind Config + Global Styles

**Files:**
- Modify: `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`

- [ ] **Step 1: Update `tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#7c3aed',
        'primary-dark': '#6d28d9',
        accent: '#f97316',
        'accent-dark': '#ea580c',
      },
      borderRadius: {
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 2: Update `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

body {
  font-family: 'Inter', system-ui, sans-serif;
  background-color: #f9fafb;
  color: #111827;
}

* {
  box-sizing: border-box;
}
```

- [ ] **Step 3: Update `app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/components/cart/cart-context'

export const metadata: Metadata = {
  title: 'Luma Pizza — Online bestellen',
  description: 'Frische Pizza, Burger & Pasta direkt aus Dietenhofen — online bestellen und bezahlen.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/ tailwind.config.ts
git commit -m "feat: configure Tailwind with Luma brand colors and layout"
```

---

## Task 7: Navbar Component

**Files:**
- Create: `components/navbar.tsx`

- [ ] **Step 1: Create `components/navbar.tsx`**

```typescript
'use client'
import Link from 'next/link'
import { useCart } from '@/components/cart/cart-context'

export default function Navbar() {
  const { itemCount } = useCart()
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white font-black text-sm">L</span>
          </div>
          <span className="font-black text-gray-900 tracking-tight">LUMA Pizza</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/bestellen" className="text-sm text-gray-600 hover:text-gray-900">
            Speisekarte
          </Link>
          <Link
            href="/bestellen"
            className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded hover:bg-primary-dark transition-colors flex items-center gap-2"
          >
            Warenkorb
            {itemCount > 0 && (
              <span className="bg-accent text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/navbar.tsx
git commit -m "feat: add Navbar with cart item count badge"
```

---

## Task 8: Menu Components

**Files:**
- Create: `components/menu/menu-item-card.tsx`
- Create: `components/menu/category-tabs.tsx`
- Create: `components/menu/menu-grid.tsx`

- [ ] **Step 1: Create `components/menu/menu-item-card.tsx`**

```typescript
'use client'
import { MenuItem } from '@/lib/types'
import { useCart } from '@/components/cart/cart-context'
import { useState } from 'react'

interface Props {
  item: MenuItem
}

export default function MenuItemCard({ item }: Props) {
  const { dispatch } = useCart()
  const [selectedSize, setSelectedSize] = useState<'26cm' | '30cm'>('30cm')
  const isPizza = item.priceSmall !== undefined && item.priceLarge !== undefined
  const price = isPizza
    ? (selectedSize === '26cm' ? item.priceSmall! : item.priceLarge!)
    : item.price!

  function handleAdd() {
    dispatch({
      type: 'ADD_ITEM',
      item: {
        menuItemId: item.id,
        name: item.name,
        size: isPizza ? selectedSize : null,
        price,
        quantity: 1,
      },
    })
  }

  if (!item.available) {
    return (
      <div className="bg-white border border-gray-100 rounded-lg p-4 opacity-50">
        <p className="font-semibold text-gray-400 text-sm">{item.name}</p>
        <p className="text-xs text-gray-400 mt-1">Nicht verfügbar</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-4 hover:border-primary transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
            {item.tags?.includes('vegetarisch') && (
              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-medium">Veg</span>
            )}
            {item.tags?.includes('scharf') && (
              <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded font-medium">Scharf</span>
            )}
            {item.tags?.includes('18+') && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">18+</span>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
          )}
          {isPizza && (
            <div className="flex gap-2 mt-2">
              {(['26cm', '30cm'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    selectedSize === size
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-200 text-gray-600 hover:border-primary'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="font-bold text-accent text-sm">{price.toFixed(2)} €</span>
          <button
            onClick={handleAdd}
            className="w-7 h-7 bg-primary text-white rounded flex items-center justify-center font-bold text-lg hover:bg-primary-dark transition-colors"
            aria-label={`${item.name} hinzufügen`}
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/menu/category-tabs.tsx`**

```typescript
'use client'
import { MENU_CATEGORIES } from '@/lib/menu'

interface Props {
  active: string
  onChange: (cat: string) => void
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'Pizza': '🍕',
  'Burger': '🍔',
  'Pasta': '🍝',
  'Fisch Gerichte': '🐟',
  'Schnitzel Gerichte': '🍖',
  'Snacks': '🍗',
  'Beilagen': '🍟',
  'Salate': '🥗',
  'Nachspeisen': '🍰',
  'Alkoholische Getränke': '🍺',
  'Alkoholfreie Getränke': '🥤',
}

export default function CategoryTabs({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {MENU_CATEGORIES.map(cat => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium transition-colors ${
            active === cat
              ? 'bg-primary text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
          }`}
        >
          <span>{CATEGORY_EMOJIS[cat] ?? '•'}</span>
          <span>{cat}</span>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Create `components/menu/menu-grid.tsx`**

```typescript
import { getItemsByCategory } from '@/lib/menu'
import MenuItemCard from './menu-item-card'

interface Props {
  category: string
}

export default function MenuGrid({ category }: Props) {
  const items = getItemsByCategory(category)
  return (
    <div>
      <h2 className="font-bold text-lg text-gray-900 mb-4">{category}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map(item => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/menu/
git commit -m "feat: add menu item card, category tabs, and menu grid"
```

---

## Task 9: Cart Sidebar Component

**Files:**
- Create: `components/cart/cart-item.tsx`
- Create: `components/cart/cart-sidebar.tsx`

- [ ] **Step 1: Create `components/cart/cart-item.tsx`**

```typescript
'use client'
import { CartItem as CartItemType } from '@/lib/types'
import { useCart } from './cart-context'

interface Props {
  item: CartItemType
}

export default function CartItemRow({ item }: Props) {
  const { dispatch } = useCart()
  return (
    <div className="flex items-center justify-between gap-2 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
        {item.size && <p className="text-xs text-gray-400">{item.size}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => dispatch({ type: 'DECREMENT_ITEM', menuItemId: item.menuItemId, size: item.size })}
          className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded text-gray-600 hover:border-primary hover:text-primary text-sm font-bold"
        >
          −
        </button>
        <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
        <button
          onClick={() => dispatch({ type: 'ADD_ITEM', item: { ...item, quantity: 1 } })}
          className="w-6 h-6 flex items-center justify-center bg-primary text-white rounded text-sm font-bold hover:bg-primary-dark"
        >
          +
        </button>
        <span className="text-sm font-bold text-accent w-16 text-right">
          {(item.price * item.quantity).toFixed(2)} €
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/cart/cart-sidebar.tsx`**

```typescript
'use client'
import Link from 'next/link'
import { useCart } from './cart-context'
import CartItemRow from './cart-item'

export default function CartSidebar() {
  const { state, total, itemCount } = useCart()

  return (
    <aside className="w-72 flex-shrink-0 bg-white border border-gray-200 rounded-lg p-4 sticky top-20 h-fit">
      <h2 className="font-bold text-gray-900 mb-4 flex items-center justify-between">
        Warenkorb
        {itemCount > 0 && (
          <span className="text-xs font-normal text-gray-400">{itemCount} Artikel</span>
        )}
      </h2>

      {state.items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Dein Warenkorb ist leer.</p>
      ) : (
        <>
          <div className="mb-4">
            {state.items.map(item => (
              <CartItemRow key={`${item.menuItemId}__${item.size}`} item={item} />
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-1 mb-4">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Zwischensumme</span>
              <span>{total.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Liefergebühr</span>
              <span className="text-green-600 font-medium">0,00 €</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Gesamt</span>
              <span>{total.toFixed(2)} €</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="block w-full bg-primary text-white text-center font-semibold py-3 rounded hover:bg-primary-dark transition-colors"
          >
            Zur Kasse →
          </Link>
        </>
      )}
    </aside>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/cart/
git commit -m "feat: add cart sidebar and cart item row components"
```

---

## Task 10: Homepage + Menu Page

**Files:**
- Modify: `app/page.tsx`
- Create: `app/bestellen/page.tsx`

- [ ] **Step 1: Update `app/page.tsx`**

```typescript
import Link from 'next/link'
import Navbar from '@/components/navbar'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary to-violet-800 text-white py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-violet-300 text-sm font-semibold uppercase tracking-widest mb-4">
              Luma Pizza · Dietenhofen
            </p>
            <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
              Frisch. Lecker.<br />
              <span className="text-accent">Direkt zu dir.</span>
            </h1>
            <p className="text-violet-200 text-lg mb-8 max-w-xl mx-auto">
              Pizza, Burger, Pasta & mehr — jetzt direkt online bestellen und bezahlen. Keine Liefergebühr.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/bestellen"
                className="bg-accent text-white font-bold px-8 py-4 rounded hover:bg-accent-dark transition-colors text-lg"
              >
                Jetzt bestellen
              </Link>
              <Link
                href="/bestellen"
                className="border border-violet-400 text-white font-semibold px-8 py-4 rounded hover:bg-white/10 transition-colors"
              >
                Speisekarte ansehen
              </Link>
            </div>
          </div>
        </section>

        {/* Info Strip */}
        <section className="bg-white border-b border-gray-200 py-6 px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl font-black text-accent">4.7 ⭐</p>
              <p className="text-sm text-gray-500 mt-1">Bewertung</p>
            </div>
            <div>
              <p className="text-2xl font-black text-accent">0 €</p>
              <p className="text-sm text-gray-500 mt-1">Liefergebühr</p>
            </div>
            <div>
              <p className="text-2xl font-black text-accent">~30 min</p>
              <p className="text-sm text-gray-500 mt-1">Lieferzeit</p>
            </div>
            <div>
              <p className="text-2xl font-black text-accent">60+</p>
              <p className="text-sm text-gray-500 mt-1">Gerichte</p>
            </div>
          </div>
        </section>

        {/* Address */}
        <section className="bg-gray-50 py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Wo wir sind</h2>
            <p className="text-gray-600">Warzfeldener Straße 1-3 · 90599 Dietenhofen</p>
            <p className="text-gray-500 text-sm mt-1">
              Öffnungszeiten: bitte beim Restaurant erfragen
            </p>
          </div>
        </section>
      </main>
    </>
  )
}
```

- [ ] **Step 2: Create `app/bestellen/page.tsx`**

```typescript
'use client'
import { useState } from 'react'
import Navbar from '@/components/navbar'
import CategoryTabs from '@/components/menu/category-tabs'
import MenuGrid from '@/components/menu/menu-grid'
import CartSidebar from '@/components/cart/cart-sidebar'
import { MENU_CATEGORIES } from '@/lib/menu'

export default function BestellenPage() {
  const [activeCategory, setActiveCategory] = useState<string>(MENU_CATEGORIES[0])

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Search bar placeholder */}
        <div className="bg-white border border-gray-200 rounded px-4 py-3 flex items-center gap-3 mb-5">
          <span className="text-gray-400 text-sm">🔍</span>
          <span className="text-gray-400 text-sm">Speisekarte durchsuchen...</span>
        </div>

        {/* Category tabs */}
        <div className="mb-6">
          <CategoryTabs active={activeCategory} onChange={setActiveCategory} />
        </div>

        {/* Content: menu grid + cart sidebar */}
        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            <MenuGrid category={activeCategory} />
          </div>
          <CartSidebar />
        </div>
      </main>
    </>
  )
}
```

- [ ] **Step 3: Run dev server and manually verify**

```bash
npm run dev
```

Open http://localhost:3000 — verify homepage loads.
Open http://localhost:3000/bestellen — verify:
- Category tabs show all categories
- Clicking a tab shows that category's items
- Clicking "+" on an item adds it to the cart sidebar
- Cart shows correct item name, size (for pizza), price, quantity
- Quantity increment/decrement works
- Total updates correctly

- [ ] **Step 4: Commit**

```bash
git add app/
git commit -m "feat: add homepage and menu/bestellen page"
```

---

## Task 11: Checkout Page — Steps 1-3 (Delivery + Address)

**Files:**
- Create: `components/checkout/delivery-toggle.tsx`
- Create: `components/checkout/postal-check.tsx`
- Create: `components/checkout/contact-form.tsx`
- Create: `app/checkout/page.tsx` (partial — Steps 1-3 only)

- [ ] **Step 1: Create `components/checkout/delivery-toggle.tsx`**

```typescript
'use client'
import { OrderType } from '@/lib/types'

interface Props {
  value: OrderType
  onChange: (v: OrderType) => void
}

export default function DeliveryToggle({ value, onChange }: Props) {
  return (
    <div>
      <h2 className="font-bold text-gray-900 mb-3">Wie möchtest du bestellen?</h2>
      <div className="flex gap-3">
        {(['delivery', 'pickup'] as OrderType[]).map(type => (
          <button
            key={type}
            onClick={() => onChange(type)}
            className={`flex-1 py-3 rounded border text-sm font-semibold transition-colors ${
              value === type
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
            }`}
          >
            {type === 'delivery' ? '🛵 Lieferung' : '🏠 Abholung'}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/checkout/postal-check.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { isDeliverable } from '@/lib/postal-codes'

interface Props {
  onConfirm: (plz: string) => void
}

export default function PostalCheck({ onConfirm }: Props) {
  const [plz, setPlz] = useState('')
  const [error, setError] = useState('')

  function handleCheck() {
    setError('')
    if (!plz.trim()) { setError('Bitte PLZ eingeben.'); return }
    if (!isDeliverable(plz)) {
      setError(`Wir liefern leider nicht in PLZ ${plz.trim()}. Bitte Abholung wählen oder Abholung verwenden.`)
      return
    }
    onConfirm(plz.trim())
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Deine Postleitzahl</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={plz}
          onChange={e => setPlz(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCheck()}
          maxLength={5}
          placeholder="z.B. 90599"
          className="border border-gray-200 rounded px-3 py-2 text-sm flex-1 focus:outline-none focus:border-primary"
        />
        <button
          onClick={handleCheck}
          className="bg-primary text-white px-4 py-2 rounded text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          Prüfen
        </button>
      </div>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 3: Create `components/checkout/contact-form.tsx`**

```typescript
'use client'

export interface ContactData {
  name: string
  email: string
  phone: string
  street: string
  notes: string
}

interface Props {
  data: ContactData
  onChange: (data: ContactData) => void
  showAddress: boolean
}

function Field({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
      />
    </div>
  )
}

export default function ContactForm({ data, onChange, showAddress }: Props) {
  const set = (key: keyof ContactData) => (v: string) => onChange({ ...data, [key]: v })
  return (
    <div className="space-y-4">
      <h2 className="font-bold text-gray-900">Deine Kontaktdaten</h2>
      <Field label="Name *" value={data.name} onChange={set('name')} placeholder="Max Mustermann" />
      <Field label="E-Mail *" value={data.email} onChange={set('email')} type="email" placeholder="max@example.de" />
      <Field label="Telefon *" value={data.phone} onChange={set('phone')} type="tel" placeholder="+49 123 456789" />
      {showAddress && (
        <Field label="Straße & Hausnummer *" value={data.street} onChange={set('street')} placeholder="Musterstraße 1" />
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Anmerkungen (optional)</label>
        <textarea
          value={data.notes}
          onChange={e => onChange({ ...data, notes: e.target.value })}
          placeholder="z.B. kein Knoblauch, 2. OG..."
          rows={2}
          className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/checkout/
git commit -m "feat: add checkout form components (delivery toggle, PLZ check, contact form)"
```

---

## Task 12: Stripe + PayPal Setup

**Files:**
- Create: `lib/stripe.ts`
- Create: `components/checkout/stripe-payment.tsx`
- Create: `components/checkout/paypal-button.tsx`
- Create: `app/api/stripe/create-intent/route.ts`

- [ ] **Step 1: Create `lib/stripe.ts`**

```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})
```

- [ ] **Step 2: Create `app/api/stripe/create-intent/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const { amount } = await req.json()

  if (!amount || amount < 100) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // cents
    currency: 'eur',
    automatic_payment_methods: { enabled: true },
  })

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
```

- [ ] **Step 3: Create `components/checkout/stripe-payment.tsx`**

```typescript
'use client'
import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface FormProps {
  onSuccess: (paymentIntentId: string) => void
  onError: (msg: string) => void
  isSubmitting: boolean
  setIsSubmitting: (v: boolean) => void
}

function PaymentForm({ onSuccess, onError, isSubmitting, setIsSubmitting }: FormProps) {
  const stripe = useStripe()
  const elements = useElements()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setIsSubmitting(true)
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })
    if (error) {
      onError(error.message ?? 'Zahlung fehlgeschlagen.')
      setIsSubmitting(false)
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent.id)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || isSubmitting}
        className="w-full bg-primary text-white font-bold py-3 rounded hover:bg-primary-dark transition-colors disabled:opacity-50"
      >
        {isSubmitting ? 'Wird verarbeitet...' : 'Jetzt bezahlen'}
      </button>
    </form>
  )
}

interface Props {
  amount: number
  onSuccess: (paymentIntentId: string) => void
  onError: (msg: string) => void
}

export default function StripePayment({ amount, onSuccess, onError }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/stripe/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    })
      .then(r => r.json())
      .then(data => setClientSecret(data.clientSecret))
  }, [amount])

  if (!clientSecret) return <p className="text-sm text-gray-400">Lade Zahlungsformular...</p>

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, locale: 'de' }}>
      <PaymentForm
        onSuccess={onSuccess}
        onError={onError}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
      />
    </Elements>
  )
}
```

- [ ] **Step 4: Create `components/checkout/paypal-button.tsx`**

```typescript
'use client'
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'

interface Props {
  amount: number
  onSuccess: (orderId: string) => void
  onError: (msg: string) => void
}

export default function PayPalButton({ amount, onSuccess, onError }: Props) {
  return (
    <PayPalScriptProvider options={{
      clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
      currency: 'EUR',
    }}>
      <PayPalButtons
        style={{ layout: 'vertical', shape: 'rect' }}
        createOrder={(_, actions) =>
          actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [{ amount: { currency_code: 'EUR', value: amount.toFixed(2) } }],
          })
        }
        onApprove={async (_, actions) => {
          const order = await actions.order!.capture()
          if (order.status === 'COMPLETED') {
            onSuccess(order.id!)
          }
        }}
        onError={() => onError('PayPal-Zahlung fehlgeschlagen.')}
      />
    </PayPalScriptProvider>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/stripe.ts components/checkout/stripe-payment.tsx components/checkout/paypal-button.tsx app/api/stripe/
git commit -m "feat: add Stripe Payment Element and PayPal button components"
```

---

## Task 13: Order API Route

**Files:**
- Create: `app/api/orders/route.ts`
- Create: `lib/resend.ts`
- Create: `__tests__/api/orders.test.ts`

- [ ] **Step 1: Create `lib/resend.ts`**

```typescript
import { Resend } from 'resend'
import { Order } from './types'

const resend = new Resend(process.env.RESEND_API_KEY)

function formatItems(items: Order['items']) {
  return items
    .map(i => `${i.quantity}x ${i.name}${i.size ? ` (${i.size})` : ''} — ${(i.price * i.quantity).toFixed(2)} €`)
    .join('\n')
}

export async function sendOrderConfirmationToCustomer(order: Order) {
  await resend.emails.send({
    from: 'Luma Pizza <bestellungen@luma-pizza.de>',
    to: order.customer_email,
    subject: `Bestellung #${order.id.slice(0, 8).toUpperCase()} bestätigt`,
    text: `Hallo ${order.customer_name},\n\ndeine Bestellung ist eingegangen!\n\nArtikeln:\n${formatItems(order.items)}\n\nGesamt: ${order.total_price.toFixed(2)} €\nZahlungsart: ${order.payment_method}\n${order.type === 'delivery' ? `Lieferadresse: ${order.delivery_address}, ${order.postal_code}` : 'Abholung'}\n\nVielen Dank!\nLuma Pizza`,
  })
}

export async function sendNewOrderToRestaurant(order: Order) {
  await resend.emails.send({
    from: 'Luma Pizza System <system@luma-pizza.de>',
    to: process.env.RESTAURANT_EMAIL!,
    subject: `🍕 Neue Bestellung #${order.id.slice(0, 8).toUpperCase()}`,
    text: `Neue Bestellung!\n\nKunde: ${order.customer_name}\nTelefon: ${order.customer_phone}\nE-Mail: ${order.customer_email}\nTyp: ${order.type === 'delivery' ? `Lieferung an ${order.delivery_address}, ${order.postal_code}` : 'Abholung'}\n\nArtikeln:\n${formatItems(order.items)}\n\nGesamt: ${order.total_price.toFixed(2)} €\nZahlungsart: ${order.payment_method}\n${order.notes ? `Anmerkung: ${order.notes}` : ''}\n\nBestellung-ID: ${order.id}`,
  })
}
```

- [ ] **Step 2: Create `app/api/orders/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { sendOrderConfirmationToCustomer, sendNewOrderToRestaurant } from '@/lib/resend'
import { CreateOrderPayload, Order } from '@/lib/types'

export async function POST(req: NextRequest) {
  const body: CreateOrderPayload = await req.json()

  // Validate required fields
  if (!body.customer_name || !body.customer_email || !body.customer_phone) {
    return NextResponse.json({ error: 'Kontaktdaten fehlen.' }, { status: 400 })
  }
  if (!body.items || body.items.length === 0) {
    return NextResponse.json({ error: 'Warenkorb ist leer.' }, { status: 400 })
  }
  if (body.type === 'delivery' && (!body.delivery_address || !body.postal_code)) {
    return NextResponse.json({ error: 'Lieferadresse fehlt.' }, { status: 400 })
  }

  const supabase = createSupabaseServer()
  const { data, error } = await supabase
    .from('orders')
    .insert({
      type: body.type,
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone,
      delivery_address: body.delivery_address ?? null,
      postal_code: body.postal_code ?? null,
      items: body.items,
      total_price: body.total_price,
      payment_method: body.payment_method,
      payment_status: body.payment_method === 'cash' ? 'pending' : 'paid',
      notes: body.notes ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ error: 'Bestellung konnte nicht gespeichert werden.' }, { status: 500 })
  }

  const order = data as Order
  try {
    await Promise.all([
      sendOrderConfirmationToCustomer(order),
      sendNewOrderToRestaurant(order),
    ])
  } catch (emailError) {
    console.error('Email error (non-fatal):', emailError)
  }

  return NextResponse.json({ id: order.id }, { status: 201 })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/orders/ lib/resend.ts
git commit -m "feat: add order creation API with email notifications"
```

---

## Task 14: Full Checkout Page

**Files:**
- Create: `app/checkout/page.tsx`

- [ ] **Step 1: Create `app/checkout/page.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/navbar'
import { useCart } from '@/components/cart/cart-context'
import DeliveryToggle from '@/components/checkout/delivery-toggle'
import PostalCheck from '@/components/checkout/postal-check'
import ContactForm, { ContactData } from '@/components/checkout/contact-form'
import StripePayment from '@/components/checkout/stripe-payment'
import PayPalButton from '@/components/checkout/paypal-button'
import { OrderType, PaymentMethod } from '@/lib/types'

type Step = 'delivery' | 'contact' | 'payment'

const EMPTY_CONTACT: ContactData = { name: '', email: '', phone: '', street: '', notes: '' }

export default function CheckoutPage() {
  const router = useRouter()
  const { state, total, dispatch } = useCart()
  const [step, setStep] = useState<Step>('delivery')
  const [orderType, setOrderType] = useState<OrderType>('delivery')
  const [plzConfirmed, setPlzConfirmed] = useState(false)
  const [postalCode, setPostalCode] = useState('')
  const [contact, setContact] = useState<ContactData>(EMPTY_CONTACT)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function createOrder(paymentIntentId?: string, paypalOrderId?: string) {
    setIsSubmitting(true)
    setError('')
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: orderType,
        customer_name: contact.name,
        customer_email: contact.email,
        customer_phone: contact.phone,
        delivery_address: orderType === 'delivery' ? contact.street : undefined,
        postal_code: orderType === 'delivery' ? postalCode : undefined,
        items: state.items,
        total_price: total,
        payment_method: paymentMethod,
        notes: contact.notes,
        stripe_payment_intent_id: paymentIntentId,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Fehler beim Erstellen der Bestellung.'); setIsSubmitting(false); return }
    dispatch({ type: 'CLEAR' })
    router.push(`/bestellung/${data.id}`)
  }

  if (state.items.length === 0) {
    return (
      <>
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-500">Dein Warenkorb ist leer.</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl font-black text-gray-900">Kasse</h1>

        {/* Step 1: Delivery type */}
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <DeliveryToggle value={orderType} onChange={v => { setOrderType(v); setPlzConfirmed(false); setStep('delivery') }} />
          {orderType === 'delivery' && !plzConfirmed && (
            <div className="mt-4">
              <PostalCheck onConfirm={plz => { setPostalCode(plz); setPlzConfirmed(true); setStep('contact') }} />
            </div>
          )}
          {(orderType === 'pickup' || plzConfirmed) && (
            <p className="mt-3 text-sm text-green-600 font-medium">
              {orderType === 'pickup' ? '✓ Abholung ausgewählt' : `✓ Lieferung nach ${postalCode}`}
            </p>
          )}
        </section>

        {/* Step 2: Contact */}
        {(orderType === 'pickup' || plzConfirmed) && (
          <section className="bg-white border border-gray-200 rounded-lg p-6">
            <ContactForm data={contact} onChange={setContact} showAddress={orderType === 'delivery'} />
            <button
              onClick={() => {
                if (!contact.name || !contact.email || !contact.phone) { setError('Bitte alle Pflichtfelder ausfüllen.'); return }
                if (orderType === 'delivery' && !contact.street) { setError('Bitte Straße angeben.'); return }
                setError('')
                setStep('payment')
              }}
              className="mt-4 bg-primary text-white font-semibold px-6 py-2 rounded hover:bg-primary-dark transition-colors"
            >
              Weiter zur Zahlung →
            </button>
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </section>
        )}

        {/* Step 3: Payment */}
        {step === 'payment' && (
          <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Zahlung</h2>

            {/* Order summary */}
            <div className="bg-gray-50 rounded p-4 text-sm space-y-1">
              {state.items.map(i => (
                <div key={`${i.menuItemId}__${i.size}`} className="flex justify-between text-gray-600">
                  <span>{i.quantity}× {i.name}{i.size ? ` (${i.size})` : ''}</span>
                  <span>{(i.price * i.quantity).toFixed(2)} €</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Gesamt</span><span>{total.toFixed(2)} €</span>
              </div>
            </div>

            {/* Payment method selector */}
            <div className="flex gap-2 flex-wrap">
              {(['card', 'paypal', 'cash'] as PaymentMethod[]).map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`px-4 py-2 rounded border text-sm font-medium transition-colors ${
                    paymentMethod === m
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
                  }`}
                >
                  {m === 'card' ? '💳 Karte / Klarna' : m === 'paypal' ? '🔵 PayPal' : '💵 Bar'}
                </button>
              ))}
            </div>

            {paymentMethod === 'card' && (
              <StripePayment
                amount={total}
                onSuccess={pid => createOrder(pid)}
                onError={msg => setError(msg)}
              />
            )}
            {paymentMethod === 'paypal' && (
              <PayPalButton
                amount={total}
                onSuccess={pid => createOrder(undefined, pid)}
                onError={msg => setError(msg)}
              />
            )}
            {paymentMethod === 'cash' && (
              <button
                onClick={() => createOrder()}
                disabled={isSubmitting}
                className="w-full bg-primary text-white font-bold py-3 rounded hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Wird übermittelt...' : 'Bestellung abschicken (Bar zahlen)'}
              </button>
            )}
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </section>
        )}
      </main>
    </>
  )
}
```

- [ ] **Step 2: Test checkout manually**

```bash
npm run dev
```

1. Add items to cart on http://localhost:3000/bestellen
2. Click "Zur Kasse"
3. Select "Lieferung", enter 90599 → verify confirmed
4. Fill contact form → click "Weiter zur Zahlung"
5. Select "Karte" → verify Stripe Payment Element loads
6. Use Stripe test card `4242 4242 4242 4242`, any future date, any CVC
7. Verify redirect to `/bestellung/[id]`

- [ ] **Step 3: Commit**

```bash
git add app/checkout/
git commit -m "feat: add full multi-step checkout page"
```

---

## Task 15: Order Confirmation Page

**Files:**
- Create: `app/bestellung/[id]/page.tsx`

- [ ] **Step 1: Create `app/bestellung/[id]/page.tsx`**

```typescript
import { createSupabaseServer } from '@/lib/supabase-server'
import { Order } from '@/lib/types'
import Navbar from '@/components/navbar'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function OrderConfirmationPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServer()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !data) notFound()

  const order = data as Order

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Bestellung erhalten!</h1>
          <p className="text-gray-500 mb-6">
            Wir haben dir eine Bestätigung an <strong>{order.customer_email}</strong> geschickt.
          </p>

          <div className="bg-gray-50 rounded p-4 text-left text-sm space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-500">Bestellung</span>
              <span className="font-mono font-semibold">#{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Art</span>
              <span>{order.type === 'delivery' ? `Lieferung an ${order.delivery_address}` : 'Abholung'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Zahlung</span>
              <span className={order.payment_status === 'paid' ? 'text-green-600 font-semibold' : ''}>
                {order.payment_status === 'paid' ? '✓ Bezahlt' : 'Bar bei Lieferung/Abholung'}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2">
              {(order.items as Order['items']).map((item, i) => (
                <div key={i} className="flex justify-between text-gray-600">
                  <span>{item.quantity}× {item.name}{item.size ? ` (${item.size})` : ''}</span>
                  <span>{(item.price * item.quantity).toFixed(2)} €</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200 mt-2">
                <span>Gesamt</span><span>{Number(order.total_price).toFixed(2)} €</span>
              </div>
            </div>
          </div>

          <Link href="/bestellen" className="bg-primary text-white font-semibold px-6 py-3 rounded hover:bg-primary-dark transition-colors inline-block">
            Weitere Bestellung aufgeben
          </Link>
        </div>
      </main>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/bestellung/
git commit -m "feat: add order confirmation page"
```

---

## Task 16: Admin Middleware + Dashboard

**Files:**
- Create: `middleware.ts`
- Create: `app/admin/layout.tsx`
- Create: `components/admin/order-card.tsx`
- Create: `components/admin/status-buttons.tsx`
- Create: `app/api/orders/[id]/route.ts`
- Create: `app/admin/page.tsx`
- Create: `app/admin/bestellungen/[id]/page.tsx`

- [ ] **Step 1: Create `middleware.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const isLoginPage = req.nextUrl.pathname === '/admin/login'
  if (req.nextUrl.pathname.startsWith('/admin') && !isLoginPage) {
    const auth = req.cookies.get('admin_auth')?.value
    if (auth !== process.env.ADMIN_PASSWORD) {
      const url = req.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

- [ ] **Step 2: Create admin login page `app/admin/login/page.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    if (res.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      setError('Falsches Passwort.')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-8 w-full max-w-sm space-y-4">
        <h1 className="font-black text-xl text-gray-900">Admin Login</h1>
        <input
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          placeholder="Passwort"
          className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="w-full bg-primary text-white font-semibold py-2 rounded hover:bg-primary-dark">
          Einloggen
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 3: Create `app/api/admin/login/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_auth', process.env.ADMIN_PASSWORD!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
  return res
}
```

- [ ] **Step 4: Create `app/api/orders/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { OrderStatus } from '@/lib/types'

const VALID_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { status } = await req.json()
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  const supabase = createSupabaseServer()
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 5: Create `components/admin/status-buttons.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { OrderStatus } from '@/lib/types'

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Ausstehend',
  confirmed: 'Bestätigt',
  preparing: 'In Zubereitung',
  ready: 'Fertig',
  delivered: 'Geliefert/Abgeholt',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-600',
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
}

interface Props {
  orderId: string
  currentStatus: OrderStatus
  onUpdate: (s: OrderStatus) => void
}

export default function StatusButtons({ orderId, currentStatus, onUpdate }: Props) {
  const [loading, setLoading] = useState(false)
  const next = NEXT_STATUS[currentStatus]

  async function advance() {
    if (!next) return
    setLoading(true)
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    onUpdate(next)
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-semibold px-2 py-1 rounded ${STATUS_COLORS[currentStatus]}`}>
        {STATUS_LABELS[currentStatus]}
      </span>
      {next && (
        <button
          onClick={advance}
          disabled={loading}
          className="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-primary-dark disabled:opacity-50 transition-colors"
        >
          {loading ? '...' : `→ ${STATUS_LABELS[next]}`}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Create `app/admin/page.tsx`**

```typescript
'use client'
import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { Order } from '@/lib/types'
import StatusButtons from '@/components/admin/status-buttons'
import Link from 'next/link'

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    // Initial load
    supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setOrders(data as Order[])
        setLoading(false)
      })

    // Realtime subscription
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new as Order, ...prev])
          // Play notification sound
          try { new Audio('/notification.mp3').play() } catch {}
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === (payload.new as Order).id ? payload.new as Order : o))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (loading) return <main className="p-8"><p className="text-gray-400">Laden...</p></main>

  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Bestellungen</h1>
        <span className="text-sm text-gray-400">{orders.length} Bestellungen</span>
      </div>

      {orders.length === 0 && (
        <p className="text-gray-400 text-center py-12">Noch keine Bestellungen.</p>
      )}

      <div className="space-y-3">
        {orders.map(order => (
          <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Link href={`/admin/bestellungen/${order.id}`} className="font-bold text-primary hover:underline">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </Link>
                  <span className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString('de-DE')}</span>
                  <span className="text-sm font-semibold">{order.type === 'delivery' ? '🛵 Lieferung' : '🏠 Abholung'}</span>
                </div>
                <p className="text-sm text-gray-700">
                  {order.customer_name} · {order.customer_phone}
                  {order.type === 'delivery' && ` · ${order.delivery_address}, ${order.postal_code}`}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {(order.items as Order['items']).map(i => `${i.quantity}× ${i.name}`).join(', ')}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="font-bold text-accent">{Number(order.total_price).toFixed(2)} €</span>
                <StatusButtons
                  orderId={order.id}
                  currentStatus={order.status}
                  onUpdate={s => setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: s } : o))}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
```

- [ ] **Step 7: Create `app/admin/bestellungen/[id]/page.tsx`**

```typescript
import { createSupabaseServer } from '@/lib/supabase-server'
import { Order } from '@/lib/types'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function AdminOrderDetail({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServer()
  const { data, error } = await supabase.from('orders').select('*').eq('id', params.id).single()
  if (error || !data) notFound()
  const order = data as Order
  return (
    <main className="max-w-2xl mx-auto p-6">
      <Link href="/admin" className="text-primary text-sm hover:underline">← Zurück</Link>
      <h1 className="text-xl font-black mt-4 mb-6">Bestellung #{order.id.slice(0,8).toUpperCase()}</h1>
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3 text-sm">
        <div><span className="text-gray-500 w-32 inline-block">Kunde</span> {order.customer_name}</div>
        <div><span className="text-gray-500 w-32 inline-block">E-Mail</span> {order.customer_email}</div>
        <div><span className="text-gray-500 w-32 inline-block">Telefon</span> {order.customer_phone}</div>
        <div><span className="text-gray-500 w-32 inline-block">Typ</span> {order.type === 'delivery' ? `Lieferung: ${order.delivery_address}, ${order.postal_code}` : 'Abholung'}</div>
        <div><span className="text-gray-500 w-32 inline-block">Zahlung</span> {order.payment_method} / {order.payment_status}</div>
        {order.notes && <div><span className="text-gray-500 w-32 inline-block">Anmerkung</span> {order.notes}</div>}
        <div className="border-t border-gray-100 pt-3">
          {(order.items as Order['items']).map((item, i) => (
            <div key={i} className="flex justify-between">
              <span>{item.quantity}× {item.name}{item.size ? ` (${item.size})` : ''}</span>
              <span>{(item.price * item.quantity).toFixed(2)} €</span>
            </div>
          ))}
          <div className="flex justify-between font-bold pt-2 border-t border-gray-100 mt-2">
            <span>Gesamt</span><span>{Number(order.total_price).toFixed(2)} €</span>
          </div>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 8: Add notification sound**

Download a short notification sound (MP3) and save as `public/notification.mp3`. Any free short beep/ding from freesound.org works.

- [ ] **Step 9: Commit**

```bash
git add middleware.ts app/admin/ app/api/admin/ app/api/orders/ components/admin/ public/
git commit -m "feat: add admin dashboard with real-time orders and password auth"
```

---

## Task 17: Impressum + Datenschutz Pages

**Files:**
- Create: `app/impressum/page.tsx`
- Create: `app/datenschutz/page.tsx`

- [ ] **Step 1: Create `app/impressum/page.tsx`**

```typescript
import Navbar from '@/components/navbar'

export default function ImpressumPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-12 prose prose-sm">
        <h1>Impressum</h1>
        <p><strong>Luma Pizza</strong></p>
        <p>Warzfeldener Straße 1-3<br />90599 Dietenhofen</p>
        <p>Inhaber: Kadir Kizisar</p>
        <p>
          Telefon: [Telefonnummer eintragen]<br />
          E-Mail: [E-Mail eintragen]
        </p>
        <h2>Haftungsausschluss</h2>
        <p>Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links.</p>
      </main>
    </>
  )
}
```

- [ ] **Step 2: Create `app/datenschutz/page.tsx`**

```typescript
import Navbar from '@/components/navbar'

export default function DatenschutzPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-12 prose prose-sm">
        <h1>Datenschutzerklärung</h1>
        <h2>Verantwortlicher</h2>
        <p>Kadir Kizisar, Warzfeldener Straße 1-3, 90599 Dietenhofen</p>
        <h2>Erhobene Daten</h2>
        <p>Bei der Bestellung erheben wir: Name, E-Mail, Telefonnummer, Lieferadresse. Diese Daten werden ausschließlich zur Bestellabwicklung verwendet und nicht an Dritte weitergegeben (außer Zahlungsdienstleister).</p>
        <h2>Zahlungsdienstleister</h2>
        <p>Für die Zahlungsabwicklung nutzen wir Stripe und PayPal. Diese Dienste verarbeiten Zahlungsdaten gemäß ihren eigenen Datenschutzrichtlinien.</p>
        <h2>Datenlöschung</h2>
        <p>Bestelldaten werden nach gesetzlichen Aufbewahrungsfristen (10 Jahre gem. HGB) gelöscht.</p>
        <h2>Kontakt</h2>
        <p>Bei Fragen zum Datenschutz: [E-Mail eintragen]</p>
      </main>
    </>
  )
}
```

- [ ] **Step 3: Add footer links to `app/layout.tsx`**

Add before closing `</body>`:
```typescript
<footer className="mt-auto border-t border-gray-200 bg-white py-6 px-4 text-center text-xs text-gray-400">
  <div className="flex justify-center gap-4">
    <a href="/impressum" className="hover:text-gray-600">Impressum</a>
    <a href="/datenschutz" className="hover:text-gray-600">Datenschutz</a>
  </div>
  <p className="mt-2">© {new Date().getFullYear()} Luma Pizza</p>
</footer>
```

Also wrap `<body>` content in a flex column:
```typescript
<body className="flex flex-col min-h-screen">
  <CartProvider>
    {children}
  </CartProvider>
  <footer ...>...</footer>
</body>
```

- [ ] **Step 4: Commit**

```bash
git add app/impressum/ app/datenschutz/ app/layout.tsx
git commit -m "feat: add Impressum, Datenschutz pages and footer"
```

---

## Task 18: Run All Tests + Final Check

- [ ] **Step 1: Run full test suite**

```bash
npx jest
```
Expected: All tests pass (postal-codes: 3, cart: 7)

- [ ] **Step 2: Build check**

```bash
npm run build
```
Expected: Build succeeds with no errors. Fix any TypeScript errors before proceeding.

- [ ] **Step 3: End-to-end manual test**

With `npm run dev`:
1. Homepage loads at http://localhost:3000
2. Menu loads at http://localhost:3000/bestellen — categories work, items show, cart updates
3. Checkout: delivery + PLZ 90599 → contact form → card payment (test card 4242...) → confirmation page
4. Checkout: pickup → contact form → bar payment → confirmation page
5. Admin at http://localhost:3000/admin → login with ADMIN_PASSWORD → see orders → advance status
6. Impressum and Datenschutz pages load

- [ ] **Step 4: Final commit + push**

```bash
git add -A
git commit -m "feat: complete Luma Pizza website ready for deployment"
git push
```

---

## Task 19: Deploy to Vercel

- [ ] **Step 1: Create Vercel project**

```bash
npx vercel
```
Follow the prompts: link to the GitHub repo, set project name `luma-pizza`.

- [ ] **Step 2: Set environment variables in Vercel dashboard**

Go to Vercel → Project → Settings → Environment Variables. Add all variables from `.env.local.example` with production values.

- [ ] **Step 3: Set Stripe webhook endpoint**

In Stripe Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://your-vercel-domain.vercel.app/api/stripe/webhook`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

Note: The webhook route is not yet implemented — basic orders work via direct Stripe confirm. Add webhook for redundancy later.

- [ ] **Step 4: Add custom domain in Vercel**

Vercel → Project → Settings → Domains → Add domain (e.g. `luma-pizza.de`).
Update DNS at your registrar (add CNAME/A record as shown by Vercel).

- [ ] **Step 5: Trigger production deploy**

```bash
git push origin main
```
Vercel auto-deploys on push to main.

- [ ] **Step 6: Smoke test on production**

- Visit the live URL
- Place a test order with Stripe test card
- Verify confirmation email received
- Verify admin dashboard shows the order

---

## Required Environment Variables Summary

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
RESEND_API_KEY
RESTAURANT_EMAIL
ADMIN_PASSWORD
NEXT_PUBLIC_BASE_URL
```
