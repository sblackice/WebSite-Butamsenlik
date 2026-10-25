"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseTL } from "@/lib/money";
import { slugify } from "@/lib/text";
import { bool, done, int, str } from "./util";

export async function saveCategory(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id", 40);
  const name = str(formData, "name", 60);
  if (name.length < 2) done("/admin/kategoriler", "Kategori adı yazın.", "err");
  const slug = slugify(str(formData, "slug", 80) || name);
  const parentId = str(formData, "parentId", 40) || null;
  if (parentId && parentId === id) done("/admin/kategoriler", "Kategori kendi alt kategorisi olamaz.", "err");
  if (parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parentId } });
    if (!parent || parent.parentId) done("/admin/kategoriler", "Üst kategori yalnızca ana kategorilerden seçilebilir (2 seviye).", "err");
  }
  if (id && parentId && (await prisma.category.count({ where: { parentId: id } })) > 0) {
    done("/admin/kategoriler", "Alt kategorisi olan bir kategori başka kategorinin altına taşınamaz.", "err");
  }
  const clash = await prisma.category.findFirst({ where: { slug, NOT: id ? { id } : undefined } });
  if (clash) done("/admin/kategoriler", "Bu adres (slug) kullanılıyor.", "err");
  const data = { name, slug, parentId, description: str(formData, "description", 300) || null, sortOrder: int(formData, "sortOrder", 0, 999), isActive: bool(formData, "isActive") };
  if (id) await prisma.category.update({ where: { id }, data });
  else await prisma.category.create({ data });
  revalidatePath("/", "layout");
  done("/admin/kategoriler", "Kategori kaydedildi.");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id", 40);
  const [children, products] = await Promise.all([prisma.category.count({ where: { parentId: id } }), prisma.product.count({ where: { categoryId: id } })]);
  if (children || products) done("/admin/kategoriler", "Önce alt kategorileri ve ürünleri başka kategoriye taşıyın.", "err");
  await prisma.category.delete({ where: { id } });
  revalidatePath("/", "layout");
  done("/admin/kategoriler", "Kategori silindi.");
}

export async function saveCoupon(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id", 40);
  const code = str(formData, "code", 30).toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  if (code.length < 3) done("/admin/kampanyalar", "Kod en az 3 karakter olmalı (harf/rakam).", "err");
  const type = str(formData, "type", 10) === "FIXED" ? "FIXED" : "PERCENT";
  const rawValue = str(formData, "value", 20);
  const value = type === "PERCENT" ? Math.trunc(Number(rawValue)) : parseTL(rawValue);
  if (value == null || !Number.isFinite(value) || value <= 0 || (type === "PERCENT" && value > 100)) done("/admin/kampanyalar", "İndirim değeri geçersiz (yüzde: 1–100, tutar: TL).", "err");
  const minSubtotal = parseTL(str(formData, "minSubtotal", 20) || "0");
  const startsAt = str(formData, "startsAt", 20) ? new Date(str(formData, "startsAt", 20)) : null;
  const endsAt = str(formData, "endsAt", 20) ? new Date(`${str(formData, "endsAt", 20)}T23:59:59`) : null;
  const limitRaw = str(formData, "usageLimit", 10);
  const data = { code, type, value: value!, minSubtotal: minSubtotal ?? 0, startsAt, endsAt, usageLimit: limitRaw ? Math.max(1, Math.trunc(Number(limitRaw))) : null, isActive: bool(formData, "isActive") };
  const clash = await prisma.coupon.findFirst({ where: { code, NOT: id ? { id } : undefined } });
  if (clash) done("/admin/kampanyalar", "Bu kod zaten var.", "err");
  if (id) await prisma.coupon.update({ where: { id }, data });
  else await prisma.coupon.create({ data });
  done("/admin/kampanyalar", "İndirim kodu kaydedildi.");
}

export async function deleteCoupon(formData: FormData) {
  await requireAdmin();
  await prisma.coupon.delete({ where: { id: str(formData, "id", 40) } });
  done("/admin/kampanyalar", "İndirim kodu silindi.");
}

/** Apply or remove a % discount on every product of a category (and its subcategories). */
export async function categoryDiscount(formData: FormData) {
  await requireAdmin();
  const categoryId = str(formData, "categoryId", 40);
  const percent = int(formData, "percent", 0, 90);
  const ids = [categoryId, ...(await prisma.category.findMany({ where: { parentId: categoryId }, select: { id: true } })).map((c) => c.id)];
  const products = await prisma.product.findMany({ where: { categoryId: { in: ids } } });
  if (!products.length) done("/admin/kampanyalar", "Bu kategoride ürün yok.", "err");
  for (const p of products) {
    const base = p.compareAtPrice && p.compareAtPrice > p.price ? p.compareAtPrice : p.price; // original price
    if (percent === 0) {
      await prisma.product.update({ where: { id: p.id }, data: { price: base, compareAtPrice: null } });
    } else {
      const price = Math.round((base * (100 - percent)) / 100 / 10) * 10; // round to 0,10 TL
      await prisma.product.update({ where: { id: p.id }, data: { price, compareAtPrice: base } });
    }
  }
  revalidatePath("/", "layout");
  done("/admin/kampanyalar", percent ? `${products.length} ürüne %${percent} indirim uygulandı.` : `${products.length} üründe indirim kaldırıldı.`);
}
