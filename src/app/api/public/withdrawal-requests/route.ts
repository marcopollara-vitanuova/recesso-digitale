import { withdrawalRequestSchema } from "@/lib/validations/withdrawal";
import { createWithdrawalRequest, WithdrawalServiceError } from "@/lib/services/withdrawal";
import { getClientIp, jsonError, jsonOk } from "@/lib/api";
import { getAppSettings } from "@/lib/settings";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = withdrawalRequestSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Dati non validi", 400, "VALIDATION");
    }

    const settings = await getAppSettings();
    if (!settings.publicFormEnabled) {
      return jsonError(settings.maintenanceMessage, 503, "FORM_DISABLED");
    }

    const { request: created, emailWarning } = await createWithdrawalRequest(parsed.data, {
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return jsonOk({
      success: true,
      publicId: created.publicId,
      submittedAt: created.submittedAt.toISOString(),
      emailWarning,
      message: emailWarning
        ? "La richiesta è stata registrata, ma si è verificato un problema tecnico durante l'invio automatico delle comunicazioni. Il nostro team è stato avvisato."
        : undefined,
    });
  } catch (err) {
    if (err instanceof WithdrawalServiceError) {
      return jsonError(err.message, err.status, err.code);
    }
    console.error("withdrawal POST error", err);
    return jsonError("Errore interno del server", 500, "INTERNAL");
  }
}
