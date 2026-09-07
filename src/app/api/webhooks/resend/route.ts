import { jsonError, jsonOk } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { applyWebhookEvent, type ResendWebhookEvent } from "@/lib/email/webhook";
import { verifyResendWebhook } from "@/lib/email/webhook-signature";

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("resend webhook: RESEND_WEBHOOK_SECRET non configurato");
    return jsonError("Webhook non configurato", 500, "WEBHOOK_NOT_CONFIGURED");
  }

  // Il body va letto grezzo: la firma è calcolata sui byte esatti ricevuti.
  const payload = await request.text();

  const verified = verifyResendWebhook({
    payload,
    svixId: request.headers.get("svix-id"),
    svixTimestamp: request.headers.get("svix-timestamp"),
    svixSignature: request.headers.get("svix-signature"),
    secret,
  });

  if (!verified.ok) {
    console.warn("resend webhook: firma rifiutata —", verified.reason);
    return jsonError(verified.reason, verified.status, "INVALID_SIGNATURE");
  }

  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(payload) as ResendWebhookEvent;
  } catch {
    return jsonError("Payload non deserializzabile", 400, "INVALID_PAYLOAD");
  }

  if (!event?.type) {
    return jsonError("Evento senza tipo", 400, "INVALID_PAYLOAD");
  }

  try {
    const result = await applyWebhookEvent(event);

    // Tracciato sempre, anche quando l'evento non trova un EmailLog: è l'unica
    // fonte che dice se il webhook sta effettivamente arrivando.
    await writeAuditLog({
      action: `email.webhook.${event.type}`,
      entityType: "EmailLog",
      entityId: result.applied ? result.logId : undefined,
      afterData: {
        eventType: event.type,
        svixId: request.headers.get("svix-id"),
        emailId: event.data?.email_id ?? null,
        recipients: event.data?.to ?? [],
        applied: result.applied,
        ...(result.applied
          ? { statusFrom: result.from, statusTo: result.to }
          : { skippedReason: result.reason }),
      },
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    // Sempre 2xx dopo una firma valida: un 5xx farebbe ritentare Svix su un
    // evento che abbiamo già registrato.
    return jsonOk({ received: true, applied: result.applied });
  } catch (err) {
    console.error("resend webhook: errore applicazione evento", err);
    return jsonError("Errore interno del server", 500, "INTERNAL");
  }
}
