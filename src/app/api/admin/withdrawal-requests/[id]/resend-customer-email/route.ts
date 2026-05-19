import { requireRole, canWrite } from "@/lib/auth";
import { resendCustomerEmail } from "@/lib/services/withdrawal";
import { jsonError, jsonOk } from "@/lib/api";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(["SUPER_ADMIN", "ADMIN"]);
    if (!canWrite(session.user.role)) return jsonError("Permesso negato", 403);
    const { id } = await params;
    const result = await resendCustomerEmail(id, session.user.id);
    return jsonOk({ success: result.ok });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonError("Permesso negato", 403);
    return jsonError("Non autorizzato", 401);
  }
}
