import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    await requireSession();
    const items = await prisma.emailTemplate.findMany({ orderBy: { name: "asc" } });
    return jsonOk(items);
  } catch {
    return jsonError("Non autorizzato", 401);
  }
}
