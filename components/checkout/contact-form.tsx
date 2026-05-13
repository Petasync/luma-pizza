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
      <label className="block text-xs uppercase tracking-widest text-charcoal-600 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-charcoal-900/15 bg-cream-50 px-4 py-3 text-sm focus:outline-none focus:border-charcoal-900 transition-colors"
      />
    </div>
  )
}

export default function ContactForm({ data, onChange, showAddress }: Props) {
  const set = (key: keyof ContactData) => (v: string) => onChange({ ...data, [key]: v })
  return (
    <div>
      <p className="eyebrow mb-3">Schritt 2</p>
      <h2 className="font-serif text-2xl text-charcoal-900 mb-5">Deine Kontaktdaten</h2>
      <div className="space-y-5">
        <Field label="Name *" value={data.name} onChange={set('name')} placeholder="Max Mustermann" />
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="E-Mail *" value={data.email} onChange={set('email')} type="email" placeholder="max@example.de" />
          <Field label="Telefon *" value={data.phone} onChange={set('phone')} type="tel" placeholder="+49 …" />
        </div>
        {showAddress && (
          <Field label="Straße & Hausnummer *" value={data.street} onChange={set('street')} placeholder="Musterstraße 1" />
        )}
        <div>
          <label className="block text-xs uppercase tracking-widest text-charcoal-600 mb-2">
            Anmerkungen (optional)
          </label>
          <textarea
            value={data.notes}
            onChange={e => onChange({ ...data, notes: e.target.value })}
            placeholder="z. B. kein Knoblauch, 2. OG …"
            rows={2}
            className="w-full border border-charcoal-900/15 bg-cream-50 px-4 py-3 text-sm focus:outline-none focus:border-charcoal-900 resize-none transition-colors"
          />
        </div>
      </div>
    </div>
  )
}
