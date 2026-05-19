import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAppSettings, upsertSetting } from "@/lib/settings";
import { requireRole, canWrite } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { jsonError, jsonOk } from "@/lib/api";

const settingsSchema = z.record(z.string(), z.string());

export async function GET() {
  try {
    await requireRole(["SUPER_ADMIN", "ADMIN", "VIEWER"]);
    const settings = await getAppSettings();
    const rows = await prisma.setting.findMany({ orderBy: { key: "asc" } });
    return jsonOk({ settings, rows });
  } catch {
    return jsonError("Non autorizzato", 401);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireRole(["SUPER_ADMIN", "ADMIN"]);
    if (!canWrite(session.user.role)) return jsonError("Permesso negato", 403);

    const parsed = settingsSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Dati non validi", 400);

    const before = await prisma.setting.findMany();
    for (const [key, value] of Object.entries(parsed.data)) {
      await upsertSetting(key, value);
    }
    const after = await prisma.setting.findMany();
    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE_SETTINGS",
      entityType: "Setting",
      beforeData: before,
      afterData: after,
    });
    return jsonOk(await getAppSettings());
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonError("Permesso negato", 403);
    return jsonError("Non autorizzato", 401);
  }
}
