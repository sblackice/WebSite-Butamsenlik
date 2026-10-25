"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ORDER_STATUS } from "@/lib/order-status";
import { changeOrderStatus } from "@/lib/orders";
import { done, str } from "./util";

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id", 40);
  const status = str(formData, "status", 30);
  if (!(status in ORDER_STATUS)) done(`/admin/siparisler/${id}`, "Geçersiz durum.", "err");
  try {
    await changeOrderStatus(id, status, str(formData, "note", 300) || null, str(formData, "trackingNumber", 60));
  } catch (e) {
    done(`/admin/siparisler/${id}`, e instanceof Error ? e.message : "Güncellenemedi.", "err");
  }
  revalidatePath("/admin/siparisler");
  done(`/admin/siparisler/${id}`, "Sipariş durumu güncellendi.");
}

export async function setUserActive(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id", 40);
  const active = formData.get("active") === "1";
  if (id === admin.id) done(`/admin/musteriler/${id}`, "Kendi hesabınızı pasif yapamazsınız.", "err");
  await prisma.user.update({ where: { id }, data: { isActive: active } });
  if (!active) await prisma.session.deleteMany({ where: { userId: id } });
  done(`/admin/musteriler/${id}`, active ? "Hesap etkinleştirildi." : "Hesap pasif yapıldı ve oturumları kapatıldı.");
}

export async function markMessageRead(formData: FormData) {
  await requireAdmin();
  await prisma.contactMessage.update({ where: { id: str(formData, "id", 40) }, data: { isRead: true } });
  done("/admin/mesajlar", "Okundu olarak işaretlendi.");
}
