import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, canWrite } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { jsonError, jsonOk } from "@/lib/api";

const templateSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  bodyText: z.string().min(1).optional(),
  bodyHtml: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(["SUPER_ADMIN", "ADMIN"]);
    if (!canWrite(session.user.role)) return jsonError("Permesso negato", 403);
    const { id } = await params;
    const parsed = templateSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Dati non validi", 400);

    const before = await prisma.emailTemplate.findUnique({ where: { id } });
    const updated = await prisma.emailTemplate.update({
      where: { id },
      data: parsed.data,
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
