import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    await requireSession();
    const items = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { user: { select: { email: true, name: true } } },
    });
    return jsonOk(items);
  } catch {
    return jsonError("Non autorizzato", 401);
  }
}
