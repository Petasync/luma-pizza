import Navbar from '@/components/navbar'

export default function ImpressumPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-12 prose prose-sm">
        <h1 className="text-2xl font-bold mb-4">Impressum</h1>
        <p><strong>Luma Pizza</strong></p>
        <p>Warzfeldener Straße 1-3<br />90599 Dietenhofen</p>
        <p>Inhaber: Kadir Kizisar</p>
        <p>
          Telefon: [Telefonnummer eintragen]<br />
          E-Mail: [E-Mail eintragen]
        </p>
        <h2 className="text-lg font-bold mt-6 mb-2">Haftungsausschluss</h2>
        <p>Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links.</p>
      </main>
    </>
  )
}
