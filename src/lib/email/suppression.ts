/**
 * Gestione "suppression-aware" degli invii.
 *
 * Resend sopprime l'INTERO messaggio se anche un solo destinatario (anche in CC)
 * è nella suppression list. Per evitare che un indirizzo guasto blocchi la
 * comunicazione legalmente rilevante verso la compagnia:
 *  - i destinatari soppressi vengono rimossi da CC/BCC;
 *  - se il destinatario principale (`to`) è soppresso, l'invio NON parte e viene
 *    registrato come fallito (visibile in admin), invece di risultare "SENT".
 */

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type RecipientPlan = {
  to: string;
  cc: string[];
  bcc: string[];
  toSuppressed: boolean;
  droppedCc: string[];
  droppedBcc: string[];
};

/** Funzione pura: applica la suppression list a to/cc/bcc. */
export function planRecipients(
  to: string,
  cc: string[] | undefined,
  bcc: string[] | undefined,
  suppressed: ReadonlySet<string>,
): RecipientPlan {
  const isSuppressed = (email: string) => suppressed.has(normalizeEmail(email));
  const ccIn = cc ?? [];
  const bccIn = bcc ?? [];
  return {
    to,
    cc: ccIn.filter((e) => !isSuppressed(e)),
    bcc: bccIn.filter((e) => !isSuppressed(e)),
    toSuppressed: isSuppressed(to),
    droppedCc: ccIn.filter(isSuppressed),
    droppedBcc: bccIn.filter(isSuppressed),
  };
}

let cache: { at: number; set: Set<string> } | null = null;
const CACHE_TTL_MS = 60_000;

/**
 * Recupera la suppression list da Resend (con cache breve). Fail-open: in caso
 * di errore restituisce l'ultima cache o un set vuoto, senza bloccare gli invii.
 */
export async function fetchSuppressedEmails(apiKey: string | undefined): Promise<Set<string>> {
  if (!apiKey) return new Set();
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.set;
  try {
    const res = await fetch("https://api.resend.com/suppressions?limit=100", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return cache?.set ?? new Set();
    const json = (await res.json()) as { data?: Array<{ email?: string }> };
    const set = new Set(
      (json.data ?? []).map((s) => normalizeEmail(s.email ?? "")).filter(Boolean),
    );
    cache = { at: Date.now(), set };
    return set;
  } catch {
    return cache?.set ?? new Set();
  }
}
