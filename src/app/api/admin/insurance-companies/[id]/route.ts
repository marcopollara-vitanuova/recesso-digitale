import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, canWrite } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { jsonError, jsonOk } from "@/lib/api";

const companySchema = z.object({
  legalName: z.string().min(1).optional(),
  displayName: z.string().min(1).optional(),
  internalCode: z.string().optional(),
  withdrawalEmail: z.string().email().optional(),
  secondaryEmails: z.array(z.string().email()).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(["SUPER_ADMIN", "ADMIN"]);
    if (!canWrite(session.user.role)) return jsonError("Permesso negato", 403);
    const { id } = await params;
    const parsed = companySchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Dati non validi", 400);

    const before = await prisma.insuranceCompany.findUnique({ where: { id } });
    const updated = await prisma.insuranceCompany.update({
      where: { id },
      data: { ...parsed.data, updatedById: session.user.id },
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
