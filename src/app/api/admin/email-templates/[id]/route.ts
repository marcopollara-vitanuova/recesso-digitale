import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, canWrite } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { jsonError, jsonOk } from "@/lib/api";
import { findUnknownPlaceholders } from "@/lib/email/templates";

const templateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  subject: z.string().trim().min(1).optional(),
  bodyText: z.string().trim().min(1).optional(),
  bodyHtml: z.string().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(["SUPER_ADMIN", "ADMIN"]);
    if (!canWrite(session.user.role)) return jsonError("Permesso negato", 403);
    const { id } = await params;
    const parsed = templateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Dati non validi", 400, "VALIDATION");
    }

    // Validazione placeholder: nessuna variabile sconosciuta in subject/bodyText/bodyHtml.
    const unknown = [
      ...findUnknownPlaceholders(parsed.data.subject),
      ...findUnknownPlaceholders(parsed.data.bodyText),
      ...findUnknownPlaceholders(parsed.data.bodyHtml),
    ];
    if (unknown.length > 0) {
      const uniqueUnknown = [...new Set(unknown)];
      return jsonError(
        `Variabili non valide: ${uniqueUnknown.map((v) => `{{${v}}}`).join(", ")}`,
        422,
        "INVALID_PLACEHOLDER",
      );
    }

    const before = await prisma.emailTemplate.findUnique({ where: { id } });
    if (!before) return jsonError("Template non trovato", 404, "NOT_FOUND");

    const { bodyHtml, ...rest } = parsed.data;
    const updated = await prisma.emailTemplate.update({
      where: { id },
      data: {
        ...rest,
        ...(bodyHtml !== undefined ? { bodyHtml: bodyHtml ? bodyHtml : null } : {}),
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE_EMAIL_TEMPLATE",
      entityType: "EmailTemplate",
      entityId: id,
      beforeData: before,
      afterData: updated,
    });
    return jsonOk(updated);
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonError("Permesso negato", 403);
    return jsonError("Non autorizzato", 401);
  }
}
