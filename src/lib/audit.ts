import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function writeAuditLog(params: {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  beforeData?: Prisma.InputJsonValue | null;
  afterData?: Prisma.InputJsonValue | null;
  ipAddress?: string;
  userAgent?: string;
}) {
  return prisma.auditLog.create({
    data: {
      ...params,
      beforeData: params.beforeData ?? undefined,
      afterData: params.afterData ?? undefined,
    },
  });
}
