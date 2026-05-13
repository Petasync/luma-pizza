import { Resend } from 'resend'
import { Order } from './types'

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder')

function formatItems(items: Order['items']) {
  return items
    .map(i => `${i.quantity}x ${i.name}${i.size ? ` (${i.size})` : ''} — ${(i.price * i.quantity).toFixed(2)} €`)
    .join('\n')
}

export async function sendOrderConfirmationToCustomer(order: Order) {
  await resend.emails.send({
    from: 'Luma Pizza <onboarding@resend.dev>',
    to: order.customer_email,
    subject: `Bestellung #${order.id.slice(0, 8).toUpperCase()} bestätigt`,
    text: `Hallo ${order.customer_name},\n\ndeine Bestellung ist eingegangen!\n\nArtikel:\n${formatItems(order.items)}\n\nGesamt: ${order.total_price.toFixed(2)} €\nZahlungsart: ${order.payment_method}\n${order.type === 'delivery' ? `Lieferadresse: ${order.delivery_address}, ${order.postal_code}` : 'Abholung'}\n\nVielen Dank!\nLuma Pizza`,
  })
}

export async function sendNewOrderToRestaurant(order: Order) {
  const to = process.env.RESTAURANT_EMAIL
  if (!to) return
  await resend.emails.send({
    from: 'Luma Pizza System <onboarding@resend.dev>',
    to,
    subject: `🍕 Neue Bestellung #${order.id.slice(0, 8).toUpperCase()}`,
    text: `Neue Bestellung!\n\nKunde: ${order.customer_name}\nTelefon: ${order.customer_phone}\nE-Mail: ${order.customer_email}\nTyp: ${order.type === 'delivery' ? `Lieferung an ${order.delivery_address}, ${order.postal_code}` : 'Abholung'}\n\nArtikel:\n${formatItems(order.items)}\n\nGesamt: ${order.total_price.toFixed(2)} €\nZahlungsart: ${order.payment_method}\n${order.notes ? `Anmerkung: ${order.notes}` : ''}\n\nBestellung-ID: ${order.id}`,
  })
}
