import "server-only";
import { prisma } from "./db";
import { getCurrentUser } from "./auth";

export async function getFavoriteIds(): Promise<Set<string>> {
  const user = await getCurrentUser();
  if (!user) return new Set();
  const rows = await prisma.favorite.findMany({ where: { userId: user.id }, select: { productId: true } });
  return new Set(rows.map((r) => r.productId));
}
