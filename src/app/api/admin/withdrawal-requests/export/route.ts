import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { escapeCsv, jsonError } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const session = await requireRole(["SUPER_ADMIN", "ADMIN", "VIEWER"]);
    const rows = await prisma.withdrawalRequest.findMany({
      orderBy: { submittedAt: "desc" },
      take: 5000,
    });

    const header = [
      "publicId",
      "status",
      "submittedAt",
      "customerFirstName",
      "customerLastName",
      "customerFiscalCode",
      "customerEmail",
      "policyNumber",
      "insuranceCompanyNameSnapshot",
    ];

    const lines = [
      header.join(","),
      ...rows.map((r) =>
        [
          r.publicId,
          r.status,
          r.submittedAt.toISOString(),
          r.customerFirstName,
          r.customerLastName,
          r.customerFiscalCode,
          r.customerEmail,
          r.policyNumber,
          r.insuranceCompanyNameSnapshot,
        ]
          .map(escapeCsv)
          .join(","),
      ),
    ];

    await writeAuditLog({
      userId: session.user.id,
      action: "EXPORT_CSV",
      entityType: "WithdrawalRequest",
    });

    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="withdrawal-requests.csv"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error && e.message === "FORBIDDEN" ? "Permesso negato" : "Non autorizzato";
    return jsonError(msg, e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401);
  }
}
