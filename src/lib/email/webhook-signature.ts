import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Finestra di tolleranza sul timestamp firmato, allineata al default Svix
 * usato da Resend: oltre questa soglia l'evento è considerato replay.
 */
const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60;

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: string; status: 400 | 401 };

/**
 * Verifica la firma Svix con cui Resend firma i webhook.
 * Il contenuto firmato è `${svix-id}.${svix-timestamp}.${raw body}`, quindi il
 * body va passato esattamente come ricevuto, senza re-serializzarlo.
 *
 * Nessuna dipendenza da DB o rete: mantenuto puro per essere testabile.
 */
export function verifyResendWebhook(params: {
  payload: string;
  svixId: string | null;
  svixTimestamp: string | null;
  svixSignature: string | null;
  secret: string;
  now?: Date;
}): VerifyResult {
  const { payload, svixId, svixTimestamp, svixSignature, secret } = params;

  if (!svixId || !svixTimestamp || !svixSignature) {
    return { ok: false, reason: "Header di firma mancanti", status: 400 };
  }

  const timestamp = Number(svixTimestamp);
  if (!Number.isFinite(timestamp)) {
    return { ok: false, reason: "Timestamp di firma non valido", status: 400 };
  }
  const nowSeconds = (params.now?.getTime() ?? Date.now()) / 1000;
  if (Math.abs(nowSeconds - timestamp) > TIMESTAMP_TOLERANCE_SECONDS) {
    return { ok: false, reason: "Timestamp di firma fuori tolleranza", status: 400 };
  }

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  if (key.length === 0) {
    return { ok: false, reason: "Secret webhook non valido", status: 400 };
  }

  const expected = createHmac("sha256", key)
    .update(`${svixId}.${svixTimestamp}.${payload}`)
    .digest();

  // L'header può contenere più firme separate da spazio (rotazione secret).
  const provided = svixSignature
    .split(" ")
    .filter((part) => part.startsWith("v1,"))
    .map((part) => Buffer.from(part.slice(3), "base64"));

  if (provided.length === 0) {
    return { ok: false, reason: "Nessuna firma v1 presente", status: 400 };
  }

  const matches = provided.some(
    (sig) => sig.length === expected.length && timingSafeEqual(sig, expected),
  );

  return matches ? { ok: true } : { ok: false, reason: "Firma non valida", status: 401 };
}
