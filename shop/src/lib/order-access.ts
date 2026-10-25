import "server-only";
import { prisma } from "./db";
import { getCurrentUser } from "./auth";
import { safeEqual } from "./crypto";

/** Returns the order only to its owner, an admin, or someone holding the secret link key. */
export async function getAccessibleOrder(orderNumber: string, key: string | undefined) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true, events: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) return null;
  if (key && safeEqual(key, order.accessKey)) return order;
  const user = await getCurrentUser();
  if (user && (user.role === "ADMIN" || user.id === order.userId)) return order;
  return null;
}
