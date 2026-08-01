import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin-auth'
import { Order } from '@/lib/types'

// Customer PII lives behind RLS now (migration 005). The admin dashboard reads
// orders through here: service-role access, gated by the admin session cookie.
export async function GET(req: NextRequest) {
  const valid = await verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value)
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createSupabaseServer()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    // Karten- und PayPal-Bestellungen werden seit dem 26.07.2026 schon vor der
    // Zahlung angelegt. Solange sie nicht bezahlt sind, gehören sie nicht in die
    // Küche — sonst würde dort für abgebrochene Zahlungen gekocht. Barzahlung
    // ist davon ausgenommen: die ist per Definition erst bei Übergabe bezahlt.
    .or('payment_method.eq.cash,payment_status.eq.paid')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ orders: (data ?? []) as Order[] })
}
