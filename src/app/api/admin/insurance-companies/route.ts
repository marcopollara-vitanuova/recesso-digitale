import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, canWrite } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { jsonError, jsonOk } from "@/lib/api";

const companySchema = z.object({
  legalName: z.string().trim().min(1, "Ragione sociale obbligatoria"),
  displayName: z.string().trim().min(1, "Nome visualizzato obbligatorio"),
  internalCode: z.string().trim().min(1).optional().or(z.literal("")),
  withdrawalEmail: z.string().trim().email("Email recesso non valida"),
  secondaryEmails: z.array(z.string().trim().email("Email secondaria non valida")).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().trim().optional().or(z.literal("")),
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
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Dati non validi", 400, "VALIDATION");
    }

    const { internalCode, notes, ...rest } = parsed.data;

    const created = await prisma.insuranceCompany.create({
      data: {
        ...rest,
        internalCode: internalCode ? internalCode : null,
        notes: notes ? notes : null,
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
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return jsonError("Codice interno già esistente", 409, "DUPLICATE_CODE");
    }
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonError("Permesso negato", 403);
    return jsonError("Non autorizzato", 401);
  }
}
