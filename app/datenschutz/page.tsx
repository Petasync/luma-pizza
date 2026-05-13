import Navbar from '@/components/navbar'

export default function DatenschutzPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-12 prose prose-sm">
        <h1 className="text-2xl font-bold mb-4">Datenschutzerklärung</h1>
        <h2 className="text-lg font-bold mt-6 mb-2">Verantwortlicher</h2>
        <p>Kadir Kizisar, Warzfeldener Straße 1-3, 90599 Dietenhofen</p>
        <h2 className="text-lg font-bold mt-6 mb-2">Erhobene Daten</h2>
        <p>Bei der Bestellung erheben wir: Name, E-Mail, Telefonnummer, Lieferadresse. Diese Daten werden ausschließlich zur Bestellabwicklung verwendet und nicht an Dritte weitergegeben (außer Zahlungsdienstleister).</p>
        <h2 className="text-lg font-bold mt-6 mb-2">Zahlungsdienstleister</h2>
        <p>Für die Zahlungsabwicklung nutzen wir Stripe und PayPal. Diese Dienste verarbeiten Zahlungsdaten gemäß ihren eigenen Datenschutzrichtlinien.</p>
        <h2 className="text-lg font-bold mt-6 mb-2">Datenlöschung</h2>
        <p>Bestelldaten werden nach gesetzlichen Aufbewahrungsfristen (10 Jahre gem. HGB) gelöscht.</p>
        <h2 className="text-lg font-bold mt-6 mb-2">Kontakt</h2>
        <p>Bei Fragen zum Datenschutz: [E-Mail eintragen]</p>
      </main>
    </>
  )
}
