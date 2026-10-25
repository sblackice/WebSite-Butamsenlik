"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseTL } from "@/lib/money";
import { SETTING_DEFAULTS, type SettingKey } from "@/lib/settings";
import { slugify } from "@/lib/text";
import { saveUpload } from "@/lib/uploads";
import { bool, done, int, str } from "./util";

const TONES = ["blush", "sage", "mist", "sand"];
const tone = (v: string) => (TONES.includes(v) ? v : "blush");
const safeHref = (v: string) => (v.startsWith("/") && !v.startsWith("//") ? v : null);

export async function saveSettings(formData: FormData) {
  await requireAdmin();
  const updates: [SettingKey, string][] = [];
  for (const key of Object.keys(SETTING_DEFAULTS) as SettingKey[]) {
    if (!formData.has(key)) continue;
    let val = str(formData, key, 2000);
    if (key === "shippingFee" || key === "freeShippingThreshold") {
      const k = parseTL(val || "0");
      if (k == null) done("/admin/vitrin", "Kargo tutarlarını TL olarak yazın.", "err");
      val = String(k);
    }
    if (key === "bankIban") {
      val = val.replace(/\s/g, "").toUpperCase();
      if (val && !/^TR\d{24}$/.test(val)) done("/admin/vitrin", "IBAN TR ile başlamalı ve 26 karakter olmalı.", "err");
    }
    if (key === "instagramUrl" && val && !/^https:\/\/(www\.)?instagram\.com\//.test(val)) done("/admin/vitrin", "Instagram adresi https://instagram.com/… olmalı.", "err");
    updates.push([key, val]);
  }
  await prisma.$transaction(updates.map(([key, value]) => prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })));
  revalidatePath("/", "layout");
  done("/admin/vitrin", "Ayarlar kaydedildi.");
}

export async function saveBanner(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id", 40);
  if (formData.get("intent") === "delete" && id) {
    await prisma.banner.delete({ where: { id } });
    revalidatePath("/");
    done("/admin/vitrin", "Banner silindi.");
  }
  const title = str(formData, "title", 120);
  if (!title) done("/admin/vitrin", "Banner başlığı yazın.", "err");
  let imageUrl = str(formData, "imageUrl", 300) || null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const res = await saveUpload(file);
    if ("error" in res) done("/admin/vitrin", res.error, "err");
    imageUrl = (res as { url: string }).url;
  }
  if (imageUrl && !/^\/(demo|media)\//.test(imageUrl)) done("/admin/vitrin", "Görsel adresi /demo/… veya /media/… olmalı (ya da dosya yükleyin).", "err");
  const data = {
    placement: str(formData, "placement", 10) === "PROMO" ? "PROMO" : "HERO",
    eyebrow: str(formData, "eyebrow", 60) || null,
    title,
    subtitle: str(formData, "subtitle", 200) || null,
    ctaLabel: str(formData, "ctaLabel", 40) || null,
    ctaHref: safeHref(str(formData, "ctaHref", 200)),
    imageUrl,
    tone: tone(str(formData, "tone", 10)),
    sortOrder: int(formData, "sortOrder", 0, 99),
    isActive: bool(formData, "isActive"),
  };
  if (id) await prisma.banner.update({ where: { id }, data });
  else await prisma.banner.create({ data });
  revalidatePath("/");
  done("/admin/vitrin", "Banner kaydedildi.");
}

export async function saveCollection(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id", 40);
  if (formData.get("intent") === "delete" && id) {
    await prisma.collection.delete({ where: { id } });
    revalidatePath("/");
    done("/admin/vitrin", "Koleksiyon silindi.");
  }
  const name = str(formData, "name", 80);
  if (!name) done("/admin/vitrin", "Koleksiyon adı yazın.", "err");
  const slug = slugify(str(formData, "slug", 80) || name);
  const clash = await prisma.collection.findFirst({ where: { slug, NOT: id ? { id } : undefined } });
  if (clash) done("/admin/vitrin", "Bu koleksiyon adresi kullanılıyor.", "err");
  const data = { name, slug, description: str(formData, "description", 300) || null, tone: tone(str(formData, "tone", 10)), sortOrder: int(formData, "sortOrder", 0, 99), isFeatured: bool(formData, "isFeatured") };
  if (id) await prisma.collection.update({ where: { id }, data });
  else await prisma.collection.create({ data });
  revalidatePath("/");
  done("/admin/vitrin", "Koleksiyon kaydedildi. Ürünleri ürün düzenleme sayfasından ekleyebilirsiniz.");
}
