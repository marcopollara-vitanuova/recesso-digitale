import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET(request: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status");
    const companyId = searchParams.get("companyId");
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(100, Number(searchParams.get("pageSize") ?? "20"));

    const where = {
      ...(status ? { status: status as never } : {}),
      ...(companyId ? { insuranceCompanyId: companyId } : {}),
      ...(q
        ? {
            OR: [
              { customerFirstName: { contains: q, mode: "insensitive" as const } },
              { customerLastName: { contains: q, mode: "insensitive" as const } },
              { customerFiscalCode: { contains: q, mode: "insensitive" as const } },
              { customerEmail: { contains: q, mode: "insensitive" as const } },
              { policyNumber: { contains: q, mode: "insensitive" as const } },
              { publicId: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where,
        orderBy: { submittedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          publicId: true,
          status: true,
          submittedAt: true,
          customerFirstName: true,
          customerLastName: true,
          customerFiscalCode: true,
          customerEmail: true,
          policyNumber: true,
          insuranceCompanyNameSnapshot: true,
        },
      }),
      prisma.withdrawalRequest.count({ where }),
    ]);

    return jsonOk({ items, total, page, pageSize });
  } catch {
    return jsonError("Non autorizzato", 401);
  }
}
