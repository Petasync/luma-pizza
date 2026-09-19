// lib/ablauf-ping.ts — meldet einen Lauf an die Ablauf-Tafel (Healthchecks auf
// peta01, Design agentic-os 2026-09-19). Ohne HC_PING_KEY passiert nichts. Wirft nie.
type Deps = { env?: Record<string, string | undefined>; fetchFn?: typeof fetch };

export async function ablaufPing(id: string, fehler?: string, deps: Deps = {}): Promise<'kein-key' | 'gesendet' | 'ping-fehler'> {
  const env = deps.env ?? process.env;
  const fetchFn = deps.fetchFn ?? fetch;
  const basis = String(env.HC_PING_URL ?? '').replace(/\/$/, '');
  if (!basis || !env.HC_PING_KEY) return 'kein-key';
  try {
    const antwort = await fetchFn(`${basis}/${env.HC_PING_KEY}/${id}${fehler ? '/fail' : ''}`, {
      method: 'POST',
      body: fehler ? fehler.slice(0, 1000) : '',
      signal: AbortSignal.timeout(5000),
    });
    if (!antwort.ok) {
      // Nicht werfen — ein Ping-Problem darf den Lauf selbst nicht kippen,
      // aber ein stummer Fehlschlag hier soll wenigstens im Log stehen.
      console.error(`[ablauf] Ping ${id} lieferte Status ${antwort.status}.`);
    }
    return 'gesendet';
  } catch (e) {
    console.error(`[ablauf] Ping ${id} fehlgeschlagen:`, (e as Error).message);
    return 'ping-fehler';
  }
}
