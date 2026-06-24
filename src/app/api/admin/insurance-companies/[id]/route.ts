import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole, canWrite } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { jsonError, jsonOk } from "@/lib/api";

const companySchema = z.object({
  legalName: z.string().trim().min(1).optional(),
  displayName: z.string().trim().min(1).optional(),
  internalCode: z.string().trim().optional().or(z.literal("")),
  withdrawalEmail: z.string().trim().email("Email recesso non valida").optional(),
  secondaryEmails: z.array(z.string().trim().email("Email secondaria non valida")).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().trim().optional().or(z.literal("")),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(["SUPER_ADMIN", "ADMIN"]);
    if (!canWrite(session.user.role)) return jsonError("Permesso negato", 403);
    const { id } = await params;
    const parsed = companySchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Dati non validi", 400, "VALIDATION");
    }

    const before = await prisma.insuranceCompany.findUnique({ where: { id } });
    if (!before) return jsonError("Compagnia non trovata", 404, "NOT_FOUND");

    const { internalCode, notes, ...rest } = parsed.data;
    const updated = await prisma.insuranceCompany.update({
      where: { id },
      data: {
        ...rest,
        ...(internalCode !== undefined ? { internalCode: internalCode ? internalCode : null } : {}),
        ...(notes !== undefined ? { notes: notes ? notes : null } : {}),
        updatedById: session.user.id,
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE_COMPANY",
      entityType: "InsuranceCompany",
      entityId: id,
      beforeData: before,
      afterData: updated,
    });
    return jsonOk(updated);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return jsonError("Codice interno già esistente", 409, "DUPLICATE_CODE");
    }
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonError("Permesso negato", 403);
    return jsonError("Non autorizzato", 401);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(["SUPER_ADMIN", "ADMIN"]);
    if (!canWrite(session.user.role)) return jsonError("Permesso negato", 403);
    const { id } = await params;

    const before = await prisma.insuranceCompany.findUnique({ where: { id } });
    if (!before) return jsonError("Compagnia non trovata", 404, "NOT_FOUND");

    // Soft delete: le richieste di recesso referenziano la compagnia e ne
    // conservano lo snapshot; non eliminiamo per preservare l'integrità storica.
    const updated = await prisma.insuranceCompany.update({
      where: { id },
      data: { isActive: false, updatedById: session.user.id },
    });
    await writeAuditLog({
      userId: session.user.id,
      action: "DISABLE_COMPANY",
      entityType: "InsuranceCompany",
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
