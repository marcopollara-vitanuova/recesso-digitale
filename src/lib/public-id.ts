import { prisma } from "@/lib/prisma";

function randomSuffix(length = 4): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export async function generatePublicRequestId(): Promise<string> {
  const year = new Date().getUTCFullYear();
  const prefix = `REC-${year}-`;

  for (let attempt = 0; attempt < 10; attempt++) {
    const count = await prisma.withdrawalRequest.count({
      where: { publicId: { startsWith: prefix } },
    });
    const seq = String(count + 1).padStart(6, "0");
    const publicId = `${prefix}${seq}-${randomSuffix()}`;
    const exists = await prisma.withdrawalRequest.findUnique({ where: { publicId } });
    if (!exists) return publicId;
  }

  return `${prefix}${Date.now()}-${randomSuffix(6)}`;
}
