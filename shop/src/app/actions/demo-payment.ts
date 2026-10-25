"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAccessibleOrder } from "@/lib/order-access";
import { changeOrderStatus, markOrderPaid } from "@/lib/orders";
import { isDemoPaymentEnabled } from "@/lib/payments";

// TEST ONLY. Never moves money. Refuses to run unless PAYMENT_PROVIDER=demo
// and the order itself was created as a test (DEMO) order.
export async function confirmDemoPayment(formData: FormData) {
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const key = String(formData.get("t") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!isDemoPaymentEnabled()) throw new Error("Demo ödeme kapalı.");
  const order = await getAccessibleOrder(orderNumber, key);
  if (!order || order.paymentMethod !== "DEMO" || !order.isTest) throw new Error("Sipariş bulunamadı.");
  if (order.status === "PENDING_PAYMENT") {
    if (decision === "approve") {
      await markOrderPaid(order.id, `DEMO-${Date.now()}`, "TEST ödemesi onaylandı (gerçek para çekilmedi).");
    } else {
      await changeOrderStatus(order.id, "CANCELLED", "TEST ödemesi reddedildi; stok geri eklendi.");
    }
  }
  revalidatePath("/", "layout");
  redirect(`/siparis/${order.orderNumber}?t=${encodeURIComponent(order.accessKey)}`);
}
