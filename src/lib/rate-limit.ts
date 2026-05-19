import { prisma } from "@/lib/prisma";

export async function isRateLimited(ip: string, limitPerHour: number): Promise<boolean> {
  if (!ip || limitPerHour <= 0) return false;
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const count = await prisma.withdrawalRequest.count({
    where: { ipAddress: ip, createdAt: { gte: since } },
  });
  return count >= limitPerHour;
}
