import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const item = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        emailLogs: { orderBy: { createdAt: "desc" } },
        internalNotes: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });
    if (!item) return jsonError("Richiesta non trovata", 404);
    return jsonOk(item);
  } catch {
    return jsonError("Non autorizzato", 401);
  }
}
