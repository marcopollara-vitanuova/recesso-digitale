import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    await requireSession();
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [total, last24h, last7d, emailSent, emailFailed, recent] = await Promise.all([
      prisma.withdrawalRequest.count(),
      prisma.withdrawalRequest.count({ where: { submittedAt: { gte: dayAgo } } }),
      prisma.withdrawalRequest.count({ where: { submittedAt: { gte: weekAgo } } }),
      prisma.withdrawalRequest.count({ where: { status: "EMAIL_SENT" } }),
      prisma.withdrawalRequest.count({
        where: { status: { in: ["EMAIL_FAILED", "PARTIAL_EMAIL_FAILURE"] } },
      }),
      prisma.withdrawalRequest.findMany({
        orderBy: { submittedAt: "desc" },
        take: 10,
        select: {
          id: true,
          publicId: true,
          status: true,
          submittedAt: true,
          customerFirstName: true,
          customerLastName: true,
          policyNumber: true,
          insuranceCompanyNameSnapshot: true,
        },
      }),
    ]);

    return jsonOk({ total, last24h, last7d, emailSent, emailFailed, recent });
  } catch {
    return jsonError("Non autorizzato", 401);
  }
}
