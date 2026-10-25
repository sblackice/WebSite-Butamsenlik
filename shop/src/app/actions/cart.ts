"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { findCart, getOrCreateCart, loadCoupon, MAX_QTY_PER_LINE, toLines } from "@/lib/cart";
import { checkCoupon } from "@/lib/pricing";

export type CartActionState = { ok: boolean; message: string } | null;

const addSchema = z.object({
  productId: z.string().min(1).max(40),
  variantId: z.string().max(40).optional().transform((v) => v || null),
  quantity: z.coerce.number().int().min(1).max(MAX_QTY_PER_LINE).default(1),
  personalization: z.string().max(40).optional().transform((v) => (v ?? "").trim()),
});

export async function addToCart(_prev: CartActionState, formData: FormData): Promise<CartActionState> {
  const parsed = addSchema.safeParse({
    productId: formData.get("productId"),
    variantId: formData.get("variantId") ?? undefined,
    quantity: formData.get("quantity") ?? 1,
    personalization: formData.get("personalization") ?? undefined,
  });
  if (!parsed.success) return { ok: false, message: "Geçersiz istek. Adet 1 ile 20 arasında olmalı." };
  const { productId, variantId, quantity, personalization } = parsed.data;

  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
    include: { variants: true },
  });
  if (!product) return { ok: false, message: "Ürün bulunamadı." };

  let stock = product.stock;
  if (product.variants.length > 0) {
    const v = product.variants.find((x) => x.id === variantId);
    if (!v) return { ok: false, message: "Lütfen bir seçenek seçin." };
    stock = v.stock;
  } else if (variantId) {
    return { ok: false, message: "Geçersiz seçenek." };
  }

  if (product.personalization === "LETTER") {
    const letter = personalization.toLocaleUpperCase("tr-TR");
    if (!/^\p{L}$/u.test(letter)) return { ok: false, message: "Lütfen tek bir harf yazın." };
  } else if (product.personalization === "TEXT") {
    if (!personalization) return { ok: false, message: `Lütfen ${product.personalizationLabel ?? "yazı"} alanını doldurun.` };
    if (personalization.length > product.personalizationMax)
      return { ok: false, message: `En fazla ${product.personalizationMax} karakter yazabilirsiniz.` };
    if (!/^[\p{L}\p{N} .'-]+$/u.test(personalization)) return { ok: false, message: "Yalnızca harf, rakam ve boşluk kullanın." };
  }
  const pers =
    product.personalization === "NONE"
      ? ""
      : product.personalization === "LETTER"
        ? personalization.toLocaleUpperCase("tr-TR")
        : personalization;

  const cart = await getOrCreateCart();
  const existing = cart.items.find((i) => i.productId === productId && i.variantId === variantId && i.personalization === pers);
  const newQty = (existing?.quantity ?? 0) + quantity;
  if (stock <= 0) return { ok: false, message: "Bu ürün tükendi." };
  if (newQty > stock) return { ok: false, message: `Stokta yalnızca ${stock} adet var.` };
  if (newQty > MAX_QTY_PER_LINE) return { ok: false, message: `Bir üründen en fazla ${MAX_QTY_PER_LINE} adet eklenebilir.` };

  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, productId, variantId, personalization: pers, quantity } });
  }
  await prisma.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });
  revalidatePath("/", "layout");
  return { ok: true, message: "Sepete eklendi." };
}

async function ownItem(itemId: string) {
  const cart = await findCart();
  return cart?.items.find((i) => i.id === itemId) ? cart : null;
}

export async function updateCartItem(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const qty = Math.trunc(Number(formData.get("quantity")));
  const cart = await ownItem(itemId);
  if (!cart) return;
  if (!Number.isFinite(qty) || qty <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    const line = toLines(cart).find((l) => l.id === itemId);
    const capped = Math.min(qty, MAX_QTY_PER_LINE, Math.max(1, line?.available ?? 1));
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: capped } });
  }
  revalidatePath("/", "layout");
}

export async function removeCartItem(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  if (!(await ownItem(itemId))) return;
  await prisma.cartItem.delete({ where: { id: itemId } });
  revalidatePath("/", "layout");
}

export async function applyCoupon(_prev: CartActionState, formData: FormData): Promise<CartActionState> {
  const code = String(formData.get("code") ?? "").trim().toUpperCase().slice(0, 30);
  if (!code) return { ok: false, message: "Bir kod yazın." };
  const cart = await findCart();
  if (!cart || cart.items.length === 0) return { ok: false, message: "Sepetiniz boş." };
  const coupon = await loadCoupon(code);
  if (!coupon) return { ok: false, message: "Bu indirim kodu bulunamadı." };
  const subtotal = toLines(cart).reduce((s, l) => s + l.lineTotal, 0);
  const err = checkCoupon(coupon, subtotal);
  if (err) return { ok: false, message: err };
  await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: code } });
  revalidatePath("/", "layout");
  return { ok: true, message: `${code} uygulandı.` };
}

export async function removeCoupon() {
  const cart = await findCart();
  if (cart) await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
  revalidatePath("/", "layout");
}
