import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, canWrite } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { jsonError, jsonOk } from "@/lib/api";

const companySchema = z.object({
  legalName: z.string().min(1),
  displayName: z.string().min(1),
  internalCode: z.string().optional(),
  withdrawalEmail: z.string().email(),
  secondaryEmails: z.array(z.string().email()).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    await requireSession();
    const items = await prisma.insuranceCompany.findMany({ orderBy: { displayName: "asc" } });
    return jsonOk(items);
  } catch {
    return jsonError("Non autorizzato", 401);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["SUPER_ADMIN", "ADMIN"]);
    if (!canWrite(session.user.role)) return jsonError("Permesso negato", 403);
    const parsed = companySchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Dati non validi", 400);

    const created = await prisma.insuranceCompany.create({
      data: {
        ...parsed.data,
        secondaryEmails: parsed.data.secondaryEmails ?? [],
        isActive: parsed.data.isActive ?? true,
        createdById: session.user.id,
        updatedById: session.user.id,
      },
    });
    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE_COMPANY",
      entityType: "InsuranceCompany",
      entityId: created.id,
      afterData: created,
    });
    return jsonOk(created, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonError("Permesso negato", 403);
    return jsonError("Non autorizzato", 401);
  }
}
