import { prisma } from "@/lib/prisma";
import { requireRole, canWrite } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { jsonError, jsonOk } from "@/lib/api";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(["SUPER_ADMIN", "ADMIN"]);
    if (!canWrite(session.user.role)) return jsonError("Permesso negato", 403);
    const { id } = await params;
    const before = await prisma.withdrawalRequest.findUnique({ where: { id } });
    const updated = await prisma.withdrawalRequest.update({
      where: { id },
      data: { status: "MANUALLY_RESOLVED" },
    });
    await writeAuditLog({
      userId: session.user.id,
      action: "MARK_REQUEST_MANUALLY_RESOLVED",
      entityType: "WithdrawalRequest",
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
