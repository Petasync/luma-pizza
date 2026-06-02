import { Resend } from 'resend'
import { Order, CartItem, PaymentMethod } from './types'
import { formatEuro } from './business'

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder')

const FROM_CUSTOMER   = 'Luma Pizza <bestellungen@luma-pizza.de>'
const FROM_RESTAURANT = 'Luma Pizza System <bestellungen@luma-pizza.de>'

const BRAND = {
  charcoal: '#1A1612',
  gold: '#C4A063',
  goldSoft: '#E6D3A8',
  cream: '#FBF8F1',
  creamSoft: '#F3EEE3',
  text: '#2A2521',
  textMuted: '#6B6356',
  border: '#E5DDD0',
}

const LOGO_URL = 'https://www.luma-pizza.de/logo.png'
const SITE_URL = 'https://www.luma-pizza.de'

function orderShortId(order: Order): string {
  return order.id.slice(0, 8).toUpperCase()
}

function formatItemsText(items: CartItem[]): string {
  return items
    .map(i => `  ${i.quantity}× ${i.name}${i.size ? ` (${i.size})` : ''} — ${formatEuro(i.price * i.quantity)}`)
    .join('\n')
}

function paymentLabel(method: PaymentMethod): string {
  switch (method) {
    case 'card':   return 'Karte'
    case 'paypal': return 'PayPal'
    case 'cash':   return 'Bar bei Lieferung / Abholung'
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]!))
}

function itemsTableHtml(items: CartItem[]): string {
  return items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-size:14px;color:${BRAND.text};">
        <strong>${i.quantity}×</strong> ${escapeHtml(i.name)}${i.size ? ` <span style="color:${BRAND.textMuted};">(${escapeHtml(i.size)})</span>` : ''}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-size:14px;color:${BRAND.text};text-align:right;white-space:nowrap;">
        ${formatEuro(i.price * i.quantity)}
      </td>
    </tr>`).join('')
}

function shellHtml(opts: { preheader: string; bodyHtml: string }): string {
  // Inline-CSS, 600 px container, tested against Gmail/Apple Mail/Outlook.
  return `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Luma Pizza</title></head>
<body style="margin:0;padding:0;background:${BRAND.creamSoft};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <span style="display:none;font-size:1px;color:${BRAND.creamSoft};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(opts.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.creamSoft};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${BRAND.cream};border:1px solid ${BRAND.border};">
        <tr><td style="background:${BRAND.charcoal};padding:28px 32px;text-align:center;">
          <a href="${SITE_URL}" style="text-decoration:none;display:inline-block;">
            <img src="${LOGO_URL}" alt="Luma Pizza" width="200" style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-width:200px;">
          </a>
        </td></tr>
        ${opts.bodyHtml}
        <tr><td style="background:${BRAND.charcoal};padding:24px 32px;text-align:center;color:${BRAND.goldSoft};font-size:11px;line-height:1.6;">
          <p style="margin:0 0 6px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.gold};">Luma Pizza · Dietenhofen</p>
          <p style="margin:0;">Warzfeldener Straße 1-3 · 90599 Dietenhofen</p>
          <p style="margin:8px 0 0;"><a href="${SITE_URL}" style="color:${BRAND.goldSoft};text-decoration:underline;">www.luma-pizza.de</a> · <a href="mailto:info@luma-pizza.de" style="color:${BRAND.goldSoft};text-decoration:underline;">info@luma-pizza.de</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

// -----------------------------------------------------------------------------
// Customer confirmation
// -----------------------------------------------------------------------------

export async function sendOrderConfirmationToCustomer(order: Order) {
  const shortId = orderShortId(order)
  const total = formatEuro(order.total_price)
  const isDelivery = order.type === 'delivery'

  const subject = `Bestellung bestätigt — ${total} · Luma Pizza`
  const preheader = `Wir haben deine Bestellung erhalten. ${isDelivery ? 'Lieferung an ' + (order.delivery_address ?? '') : 'Bereit zur Abholung'} · ${total}`

  const bodyHtml = `
    <tr><td style="padding:32px 32px 8px;">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.gold};">Bestellung #${shortId}</p>
      <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:600;color:${BRAND.charcoal};">Vielen Dank, ${escapeHtml(order.customer_name)}!</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.text};">
        Wir haben deine Bestellung erhalten und bereiten alles frisch für dich zu.
        ${isDelivery
          ? 'Sobald dein Essen unterwegs ist, machen wir uns auf den Weg zu dir.'
          : 'Sobald deine Bestellung abholbereit ist, kannst du sie bei uns abholen.'}
      </p>
    </td></tr>

    <tr><td style="padding:8px 32px 8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.creamSoft};border:1px solid ${BRAND.border};">
        <tr><td style="padding:18px 22px;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.gold};">${isDelivery ? 'Lieferung an' : 'Abholung'}</p>
          <p style="margin:0;font-size:14px;line-height:1.5;color:${BRAND.text};">
            ${isDelivery
              ? `${escapeHtml(order.delivery_address ?? '')}<br>${escapeHtml(order.postal_code ?? '')} Dietenhofen`
              : 'Warzfeldener Straße 1-3 · 90599 Dietenhofen'}
          </p>
        </td></tr>
      </table>
    </td></tr>

    <tr><td style="padding:24px 32px 8px;">
      <p style="margin:0 0 10px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.gold};">Deine Bestellung</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${itemsTableHtml(order.items)}
        <tr>
          <td style="padding:14px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:600;color:${BRAND.charcoal};">Gesamt</td>
          <td style="padding:14px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:600;color:${BRAND.charcoal};text-align:right;">${total}</td>
        </tr>
        <tr>
          <td style="padding:4px 0 0;font-size:12px;color:${BRAND.textMuted};">Zahlungsart</td>
          <td style="padding:4px 0 0;font-size:12px;color:${BRAND.textMuted};text-align:right;">${paymentLabel(order.payment_method)}</td>
        </tr>
      </table>
    </td></tr>

    <tr><td style="padding:24px 32px 32px;">
      <p style="margin:0;font-size:13px;line-height:1.6;color:${BRAND.textMuted};">
        Bei Fragen zur Bestellung erreichst du uns unter
        <a href="mailto:info@luma-pizza.de" style="color:${BRAND.charcoal};">info@luma-pizza.de</a>.
        Wir freuen uns auf dich!
      </p>
    </td></tr>
  `

  const text = `Hallo ${order.customer_name},

vielen Dank für deine Bestellung bei Luma Pizza!
Bestellnummer: #${shortId}

Artikel:
${formatItemsText(order.items)}

Gesamt: ${total}
Zahlungsart: ${paymentLabel(order.payment_method)}
${isDelivery ? `Lieferadresse: ${order.delivery_address}, ${order.postal_code} Dietenhofen` : 'Abholung: Warzfeldener Straße 1-3, 90599 Dietenhofen'}

Bei Fragen: info@luma-pizza.de

Luma Pizza · Dietenhofen
www.luma-pizza.de`

  const { error } = await resend.emails.send({
    from: FROM_CUSTOMER,
    to: order.customer_email,
    subject,
    text,
    html: shellHtml({ preheader, bodyHtml }),
  })
  if (error) throw new Error(`Resend customer mail failed: ${JSON.stringify(error)}`)
}

// -----------------------------------------------------------------------------
// Restaurant notification — push-friendly subject, key info at the top
// -----------------------------------------------------------------------------

export async function sendNewOrderToRestaurant(order: Order) {
  // RESTAURANT_EMAIL darf mehrere Empfänger enthalten (kommagetrennt),
  // z. B. das Bestell-Postfach + Kadirs private Adresse.
  const to = (process.env.RESTAURANT_EMAIL ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  if (to.length === 0) return

  const shortId = orderShortId(order)
  const total = formatEuro(order.total_price)
  const firstName = order.customer_name.split(/\s+/)[0]
  const typeLabel = order.type === 'delivery' ? 'Lieferung' : 'Abholung'

  // Lockscreen-readable: who, how much, what
  const subject = `🍕 ${total} · ${firstName} · ${typeLabel}`
  const preheader = `${order.customer_name} · ${order.customer_phone} · ${total} · ${typeLabel}${order.type === 'delivery' && order.postal_code ? ' (' + order.postal_code + ')' : ''}`

  const bodyHtml = `
    <tr><td style="padding:32px 32px 8px;">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.gold};">Neue Bestellung · #${shortId}</p>
      <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:600;color:${BRAND.charcoal};">${total} · ${typeLabel}</h1>
    </td></tr>

    <!-- Customer + phone, dark highlight so a quick callback is one tap away -->
    <tr><td style="padding:0 32px 8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.charcoal};">
        <tr><td style="padding:18px 22px;color:${BRAND.cream};">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.gold};">Kunde</p>
          <p style="margin:0 0 8px;font-size:18px;font-weight:600;">${escapeHtml(order.customer_name)}</p>
          <p style="margin:0;font-size:15px;">
            📞 <a href="tel:${encodeURIComponent(order.customer_phone)}" style="color:${BRAND.goldSoft};text-decoration:none;font-weight:600;">${escapeHtml(order.customer_phone)}</a>
            &nbsp;·&nbsp;
            <a href="mailto:${encodeURIComponent(order.customer_email)}" style="color:${BRAND.goldSoft};text-decoration:none;">${escapeHtml(order.customer_email)}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>

    <tr><td style="padding:16px 32px 8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.creamSoft};border:1px solid ${BRAND.border};">
        <tr><td style="padding:16px 22px;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.gold};">${order.type === 'delivery' ? 'Lieferadresse' : 'Abholung'}</p>
          <p style="margin:0;font-size:15px;color:${BRAND.text};">
            ${order.type === 'delivery'
              ? `${escapeHtml(order.delivery_address ?? '')}<br>${escapeHtml(order.postal_code ?? '')} Dietenhofen`
              : 'Kunde holt selbst ab.'}
          </p>
        </td></tr>
      </table>
    </td></tr>

    ${order.notes ? `
    <tr><td style="padding:16px 32px 8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFF4E5;border:1px solid #F0CB97;">
        <tr><td style="padding:14px 22px;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#A6701A;">⚠ Anmerkung vom Kunden</p>
          <p style="margin:0;font-size:14px;color:${BRAND.text};line-height:1.5;">${escapeHtml(order.notes)}</p>
        </td></tr>
      </table>
    </td></tr>` : ''}

    <tr><td style="padding:24px 32px 8px;">
      <p style="margin:0 0 10px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.gold};">Artikel</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${itemsTableHtml(order.items)}
        <tr>
          <td style="padding:14px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:600;color:${BRAND.charcoal};">Gesamt</td>
          <td style="padding:14px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:600;color:${BRAND.charcoal};text-align:right;">${total}</td>
        </tr>
        <tr>
          <td style="padding:4px 0 0;font-size:12px;color:${BRAND.textMuted};">Zahlungsart</td>
          <td style="padding:4px 0 0;font-size:12px;color:${BRAND.textMuted};text-align:right;">${paymentLabel(order.payment_method)}</td>
        </tr>
      </table>
    </td></tr>

    <tr><td style="padding:24px 32px 32px;text-align:center;">
      <a href="${SITE_URL}/admin"
         style="display:inline-block;padding:12px 28px;background:${BRAND.gold};color:${BRAND.charcoal};font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:600;text-decoration:none;">
        Im Admin-Dashboard öffnen
      </a>
      <p style="margin:14px 0 0;font-size:11px;color:${BRAND.textMuted};">Bestell-ID: ${order.id}</p>
    </td></tr>
  `

  const text = `🍕 NEUE BESTELLUNG #${shortId}

${total} · ${typeLabel}

Kunde: ${order.customer_name}
Telefon: ${order.customer_phone}
E-Mail: ${order.customer_email}

${order.type === 'delivery'
  ? `Lieferadresse:\n  ${order.delivery_address}\n  ${order.postal_code} Dietenhofen`
  : 'Abholung: Kunde kommt selbst.'}
${order.notes ? `\n⚠ Anmerkung: ${order.notes}` : ''}

Artikel:
${formatItemsText(order.items)}

Gesamt: ${total}
Zahlungsart: ${paymentLabel(order.payment_method)}

Admin-Dashboard: ${SITE_URL}/admin
Bestell-ID: ${order.id}`

  const { error } = await resend.emails.send({
    from: FROM_RESTAURANT,
    to,
    subject,
    text,
    html: shellHtml({ preheader, bodyHtml }),
  })
  if (error) throw new Error(`Resend restaurant mail failed: ${JSON.stringify(error)}`)
}
