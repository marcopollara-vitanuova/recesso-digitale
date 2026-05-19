import { prisma } from "@/lib/prisma";
import { requireRole, canWrite } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { z } from "zod";

const noteSchema = z.object({ note: z.string().trim().min(1) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(["SUPER_ADMIN", "ADMIN"]);
    if (!canWrite(session.user.role)) return jsonError("Permesso negato", 403);
    const { id } = await params;
    const body = await request.json();
    const parsed = noteSchema.safeParse(body);
    if (!parsed.success) return jsonError("Nota non valida", 400);

    const note = await prisma.internalNote.create({
      data: {
        withdrawalRequestId: id,
        userId: session.user.id,
        note: parsed.data.note,
      },
    });
    return jsonOk(note);
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonError("Permesso negato", 403);
    return jsonError("Non autorizzato", 401);
  }
}
