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
