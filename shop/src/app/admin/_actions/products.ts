"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseTL } from "@/lib/money";
import { buildSearchText, slugify } from "@/lib/text";
import { deleteUpload, saveUpload } from "@/lib/uploads";
import { bool, done, int, str } from "./util";

const METAL_VALUES = ["", "altin", "rose", "gumus", "celik"];
const PERS = ["NONE", "LETTER", "TEXT"];

export async function saveProduct(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id", 40);
  const back = id ? `/admin/urunler/${id}` : "/admin/urunler/yeni";
  const name = str(formData, "name", 120);
  if (name.length < 2) done(back, "Ürün adı en az 2 karakter olmalı.", "err");
  const slug = slugify(str(formData, "slug", 90) || name);
  if (!slug) done(back, "Geçerli bir adres (slug) girin.", "err");
  const categoryId = str(formData, "categoryId", 40);
  if (!(await prisma.category.findUnique({ where: { id: categoryId } }))) done(back, "Kategori seçin.", "err");
  const price = parseTL(str(formData, "price", 20));
  if (price == null || price <= 0) done(back, "Geçerli bir fiyat girin (örn. 349,90).", "err");
  const compareRaw = str(formData, "compareAtPrice", 20);
  const compareAtPrice = compareRaw ? parseTL(compareRaw) : null;
  if (compareRaw && (compareAtPrice == null || compareAtPrice <= price)) done(back, "Eski fiyat, satış fiyatından yüksek olmalı (ya da boş bırakın).", "err");
  const metal = str(formData, "metal", 10);
  const personalization = str(formData, "personalization", 10);
  const description = str(formData, "description", 5000);
  if (description.length < 5) done(back, "Açıklama yazın.", "err");

  const clash = await prisma.product.findFirst({ where: { slug, NOT: id ? { id } : undefined } });
  if (clash) done(back, "Bu adres (slug) başka bir ürüne ait.", "err");

  const data = {
    name,
    slug,
    categoryId,
    description,
    details: str(formData, "details", 3000),
    price: price!,
    compareAtPrice,
    stock: int(formData, "stock", 0, 100000),
    sku: str(formData, "sku", 40) || null,
    metal: METAL_VALUES.includes(metal) && metal ? metal : null,
    material: str(formData, "material", 200) || null,
    isActive: bool(formData, "isActive"),
    isFeatured: bool(formData, "isFeatured"),
    isDemo: bool(formData, "isDemo"),
    personalization: PERS.includes(personalization) ? personalization : "NONE",
    personalizationLabel: str(formData, "personalizationLabel", 40) || null,
    personalizationMax: int(formData, "personalizationMax", 0, 40),
    searchText: buildSearchText([name, description, str(formData, "details", 3000)]),
  };
  const collectionIds = formData.getAll("collections").map(String);

  const saved = id ? await prisma.product.update({ where: { id }, data }) : await prisma.product.create({ data });
  await prisma.collectionProduct.deleteMany({ where: { productId: saved.id, collectionId: { notIn: collectionIds } } });
  for (const cid of collectionIds) {
    await prisma.collectionProduct.upsert({
      where: { collectionId_productId: { collectionId: cid, productId: saved.id } },
      update: {},
      create: { collectionId: cid, productId: saved.id },
    }).catch(() => {});
  }
  revalidatePath("/", "layout");
  done(`/admin/urunler/${saved.id}`, id ? "Ürün güncellendi." : "Ürün oluşturuldu. Şimdi görsel ekleyebilirsiniz.");
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id", 40);
  if (formData.get("confirm") !== "SIL") done(`/admin/urunler/${id}`, "Silmek için kutuya SIL yazın.", "err");
  const images = await prisma.productImage.findMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  await Promise.all(images.map((i) => deleteUpload(i.url)));
  revalidatePath("/", "layout");
  done("/admin/urunler", "Ürün silindi. Geçmiş siparişlerdeki ürün adı korunur.");
}

export async function uploadProductImage(formData: FormData) {
  await requireAdmin();
  const productId = str(formData, "productId", 40);
  const back = `/admin/urunler/${productId}`;
  const file = formData.get("file");
  if (!(file instanceof File)) done(back, "Dosya seçilmedi.", "err");
  const res = await saveUpload(file as File);
  if ("error" in res) done(back, res.error, "err");
  const count = await prisma.productImage.count({ where: { productId } });
  await prisma.productImage.create({ data: { productId, url: (res as { url: string }).url, alt: str(formData, "alt", 160), sortOrder: count } });
  revalidatePath("/", "layout");
  done(back, "Görsel yüklendi.");
}

export async function addImageUrl(formData: FormData) {
  await requireAdmin();
  const productId = str(formData, "productId", 40);
  const back = `/admin/urunler/${productId}`;
  const url = str(formData, "url", 500);
  const ok = /^\/(demo|media)\/[A-Za-z0-9._-]+$/.test(url) || /^https:\/\/[^\s"'<>]+$/.test(url);
  if (!ok) done(back, "Adres /demo/…, /media/… ya da https:// ile başlamalı.", "err");
  const count = await prisma.productImage.count({ where: { productId } });
  await prisma.productImage.create({ data: { productId, url, alt: str(formData, "alt", 160), sortOrder: count } });
  revalidatePath("/", "layout");
  done(back, "Görsel eklendi. Harici adreslerde kullanım izni sizin sorumluluğunuzdadır.");
}

export async function updateImage(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id", 40);
  const img = await prisma.productImage.findUniqueOrThrow({ where: { id } });
  if (formData.get("intent") === "delete") {
    await prisma.productImage.delete({ where: { id } });
    await deleteUpload(img.url);
  } else {
    await prisma.productImage.update({ where: { id }, data: { alt: str(formData, "alt", 160), sortOrder: int(formData, "sortOrder", 0, 99) } });
  }
  revalidatePath("/", "layout");
  done(`/admin/urunler/${img.productId}`, "Görsel güncellendi.");
}

export async function saveVariant(formData: FormData) {
  await requireAdmin();
  const productId = str(formData, "productId", 40);
  const id = str(formData, "id", 40);
  const back = `/admin/urunler/${productId}`;
  if (formData.get("intent") === "delete" && id) {
    await prisma.productVariant.delete({ where: { id } });
    revalidatePath("/", "layout");
    done(back, "Seçenek silindi.");
  }
  const name = str(formData, "name", 60);
  if (!name) done(back, "Seçenek adı yazın (örn. Altın / 45 cm).", "err");
  const deltaRaw = str(formData, "priceDelta", 20);
  const priceDelta = deltaRaw ? parseTL(deltaRaw) : 0;
  if (priceDelta == null) done(back, "Fiyat farkını TL olarak yazın (örn. 20 veya 0).", "err");
  const data = { name, sku: str(formData, "sku", 40) || null, priceDelta: priceDelta!, stock: int(formData, "stock", 0, 100000), sortOrder: int(formData, "sortOrder", 0, 99) };
  if (id) await prisma.productVariant.update({ where: { id }, data });
  else await prisma.productVariant.create({ data: { ...data, productId } });
  revalidatePath("/", "layout");
  done(back, "Seçenek kaydedildi.");
}
