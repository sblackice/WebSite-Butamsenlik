import "server-only";
import { randomInt } from "node:crypto";
import { prisma } from "./db";
import { CLOSED_STATUSES } from "./order-status";
import { randomToken } from "./crypto";

export function newOrderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `BTS${ymd}${randomInt(100000, 999999)}`;
}

export function newAccessKey() {
  return randomToken(24);
}

/** Marks an order paid exactly once. Real (non-test) payments increase product sales counts. */
export async function markOrderPaid(orderId: string, paymentRef: string, note: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order || order.status !== "PENDING_PAYMENT") return;
    await tx.order.update({ where: { id: orderId }, data: { status: "PAID", paymentRef } });
    await tx.orderEvent.create({ data: { orderId, status: "PAID", note } });
    if (!order.isTest) {
      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({ where: { id: item.productId }, data: { salesCount: { increment: item.quantity } } });
        }
      }
    }
  });
}

/** Admin status change. Cancelling or refunding puts reserved stock back (once). */
export async function changeOrderStatus(orderId: string, status: string, note: string | null, trackingNumber?: string | null) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new Error("Sipariş bulunamadı.");
    const wasClosed = CLOSED_STATUSES.includes(order.status);
    const willClose = CLOSED_STATUSES.includes(status);
    if (wasClosed && !willClose) throw new Error("İptal / iade edilmiş sipariş yeniden açılamaz.");

    if (!wasClosed && willClose) {
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.updateMany({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
        } else if (item.productId) {
          await tx.product.updateMany({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        }
      }
    }
    if (order.status === "PENDING_PAYMENT" && status === "PAID" && !order.isTest) {
      for (const item of order.items) {
        if (item.productId) {
          await tx.product.updateMany({ where: { id: item.productId }, data: { salesCount: { increment: item.quantity } } });
        }
      }
    }
    await tx.order.update({
      where: { id: orderId },
      data: { status, ...(trackingNumber !== undefined ? { trackingNumber: trackingNumber || null } : {}) },
    });
    await tx.orderEvent.create({ data: { orderId, status, note } });
  });
}
